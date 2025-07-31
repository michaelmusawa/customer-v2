// app/lib/actions/addUser.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { ProfileActionState, UserActionState } from "./definitions";
import { safeQuery, DatabaseError } from "./db";
import { randomBytes } from "crypto";
import { sendMail } from "./loginActions";
import { ArchiveUserSchema, UpdateSchema } from "./schemas";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs/promises";
import { isDBError } from "./utils";

const AddUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  station: z.string().nullable().optional(),
  shift: z.string().nullable().optional(),
  counter: z.string().nullable().optional(),
  role: z.string().min(1),
});

export async function addUser(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const parsed = AddUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    station: formData.get("station"),
    shift: formData.get("shift"),
    counter: formData.get("counter"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Fix errors.",
    };
  }
  const { name, email, station, shift, counter, role } = parsed.data;

  let finalStation = station;
  if (role === "biller" && !station) {
    const session = await auth();
    const you = session?.user?.email;
    if (!you) return { state_error: "Must be logged in." };
    const sql = `SELECT st.name AS station FROM [User] u JOIN stations st ON u.stationId=st.id WHERE u.email=@you`;
    const { recordset: me } = await safeQuery<{ station: string }>(sql, {
      you,
    });
    if (!me.length) return { state_error: "No station on your account." };
    finalStation = me[0].station;
  }

  try {
    // check existing
    const existSql = `SELECT id FROM [User] WHERE email=@email`;
    const { recordset: exist } = await safeQuery<{ id: number }>(existSql, {
      email,
    });
    if (exist.length) return { errors: { email: [`Email ${email} exists`] } };

    // resolve FKs
    const promises: any[] = [];
    promises.push(
      shift
        ? safeQuery<{ id: number }>(`SELECT id FROM shifts WHERE name=@shift`, {
            shift,
          })
        : Promise.resolve({ recordset: [] })
    );
    promises.push(
      finalStation
        ? safeQuery<{ id: number }>(
            `SELECT id FROM stations WHERE name=@station`,
            { station: finalStation }
          )
        : Promise.resolve({ recordset: [] })
    );
    promises.push(
      counter
        ? safeQuery<{ id: number }>(
            `SELECT id FROM counters WHERE name=@counter`,
            { counter }
          )
        : Promise.resolve({ recordset: [] })
    );
    const [shiftRes, stationRes, counterRes] = await Promise.all(promises);
    if (shift && !shiftRes.recordset.length)
      return { errors: { shift: [`Shift "${shift}" not found`] } };
    if (finalStation && !stationRes.recordset.length)
      return { errors: { station: [`Station "${finalStation}" not found`] } };
    if (counter && !counterRes.recordset.length)
      return { errors: { counter: [`Counter "${counter}" not found`] } };
    const shiftId = shiftRes.recordset[0]?.id || null;
    const stationId = stationRes.recordset[0]?.id || null;
    const counterId = counterRes.recordset[0]?.id || null;

    // invite token
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 3600 * 1000);
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;
    const mailRes = await sendMail(resetUrl, email, name);
    if (mailRes === "Failed") return { state_error: "Email failed." };

    const insertSql = `
      INSERT INTO [User] (name,email,shiftId,stationId,counterId,role,password_reset_token,password_reset_expires)
      OUTPUT INSERTED.id AS id
      VALUES (@name,@email,@shiftId,@stationId,@counterId,@role,@token,@expires)`;
    const { recordset: ins } = await safeQuery<{ id: number }>(insertSql, {
      name,
      email,
      shiftId,
      stationId,
      counterId,
      role,
      token,
      expires,
    });
    const newUserId = ins[0].id;
    revalidatePath("/dashboard");
    return { message: `User #${newUserId} added!` };
  } catch (err) {
    console.error(err);
    return { state_error: "Unexpected error." };
  }
}

const UpdateUserSchema = z.object({
  userId: z.coerce.number(),
  name: z.string().min(1),
  station: z.string().nullable().optional(),
  shift: z.string().nullable().optional(),
  counter: z.string().nullable().optional(),
  role: z.string().min(1),
});

export async function updateUser(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const parsed = UpdateUserSchema.safeParse({
    userId: formData.get("userId"),
    name: formData.get("name"),
    station: formData.get("station"),
    shift: formData.get("shift"),
    counter: formData.get("counter"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };
  const { userId, name, station, shift, counter, role } = parsed.data;

  let finalStation = station;
  if (role === "biller" && !station) {
    const session = await auth();
    const you = session?.user?.email;
    if (!you) return { state_error: "Must be signed in." };
    const lookup = `SELECT st.name AS station FROM [User] u JOIN stations st ON u.stationId=st.id WHERE u.email=@you`;
    const { recordset: me } = await safeQuery<{ station: string }>(lookup, {
      you,
    });
    if (!me.length) return { state_error: "No station on your account." };
    finalStation = me[0].station;
  }

  try {
    const promises: any[] = [];
    promises.push(
      shift
        ? safeQuery<{ id: number }>(`SELECT id FROM shifts WHERE name=@shift`, {
            shift,
          })
        : Promise.resolve({ recordset: [] })
    );
    promises.push(
      finalStation
        ? safeQuery<{ id: number }>(
            `SELECT id FROM stations WHERE name=@station`,
            { station: finalStation }
          )
        : Promise.resolve({ recordset: [] })
    );
    promises.push(
      counter
        ? safeQuery<{ id: number }>(
            `SELECT id FROM counters WHERE name=@counter`,
            { counter }
          )
        : Promise.resolve({ recordset: [] })
    );
    const [shiftRes, stationRes, counterRes] = await Promise.all(promises);
    const shiftId = shiftRes.recordset[0]?.id || null;
    const stationId = stationRes.recordset[0]?.id || null;
    const counterId = counterRes.recordset[0]?.id || null;

    const sets = [`name=@name`, `role=@role`];
    const params: Record<string, unknown> = { userId, name, role };
    if (shift !== undefined) {
      sets.push(`shiftId=@shiftId`);
      params.shiftId = shiftId;
    }
    if (finalStation !== undefined) {
      sets.push(`stationId=@stationId`);
      params.stationId = stationId;
    }
    if (counter !== undefined) {
      sets.push(`counterId=@counterId`);
      params.counterId = counterId;
    }

    const sql = `UPDATE [User] SET ${sets.join(",")} WHERE id=@userId`;
    await safeQuery(sql, params);
    revalidatePath("/dashboard");
    return { message: "User updated successfully!" };
  } catch (err) {
    console.error(err);
    return { state_error: "Unexpected error." };
  }
}

export async function updateProfile(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const parsed = UpdateSchema.safeParse({
    name: formData.get("name"),
    image: formData.get("image") as File | null,
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success)
    return {
      errors: parsed.error.flatten().fieldErrors,
      state_error: "Fix errors.",
    };
  const { name, image, password } = parsed.data;
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return { state_error: "Not authenticated." };

  const { recordset: oldRes } = await safeQuery<{ image: string | null }>(
    `SELECT image FROM [User] WHERE email=@email`,
    { email }
  );
  let imageUrl = oldRes[0]?.image;
  if (image && image.size) {
    const uploadDir = path.join(process.cwd(), "public", "images", "uploads");
    if (imageUrl?.startsWith("/images/uploads/")) {
      await fs
        .unlink(path.join(process.cwd(), "public", imageUrl))
        .catch(() => {});
    }
    await fs.mkdir(uploadDir, { recursive: true });
    const buf = Buffer.from(await image.arrayBuffer());
    const fileName = `${Date.now()}-${image.name.replace(/\s+/g, "_")}`;
    await fs.writeFile(path.join(uploadDir, fileName), buf);
    imageUrl = `/images/uploads/${fileName}`;
  }

  const sets: string[] = [];
  const params: Record<string, unknown> = { email, name };
  sets.push(`name=@name`);
  if (imageUrl) {
    sets.push(`image=@imageUrl`);
    params.imageUrl = imageUrl;
  }
  if (password) {
    const hash = await bcrypt.hash(password, 12);
    sets.push(`password=@hash`);
    params.hash = hash;
  }

  try {
    const sql = `UPDATE [User] SET ${sets.join(",")} WHERE email=@email`;
    await safeQuery(sql, params);
    revalidatePath("/profile");
    return { message: "Profile updated!" };
  } catch (err) {
    console.error(err);
    return { state_error: "Unexpected error." };
  }
}

export async function archiveUser(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = ArchiveUserSchema.safeParse(raw);
  if (!parsed.success)
    return {
      state_error: "Invalid request.",
      errors: parsed.error.flatten().fieldErrors,
    };
  const { userId } = parsed.data;
  try {
    await safeQuery(`UPDATE [User] SET status='archived' WHERE id=@userId`, {
      userId,
    });
    revalidatePath("/dashboard");
    return { message: "User archived." };
  } catch (err) {
    console.error(err);
    return { state_error: "Could not archive user." };
  }
}

export async function activateUser(
  _prev: UserActionState | undefined,
  formData: FormData
): Promise<UserActionState> {
  const raw = formData.get("userId");
  const userId = raw ? parseInt(raw.toString(), 10) : NaN;
  if (isNaN(userId)) return { state_error: "Invalid user.", errors: {} };
  try {
    const { recordset } = await safeQuery<any>(
      `UPDATE [User] SET status=NULL OUTPUT INSERTED.id WHERE id=@userId`,
      { userId }
    );
    if (!recordset.length)
      return { state_error: "Not found or already active." };
    revalidatePath("/dashboard");
    return { message: "User activated." };
  } catch (err) {
    console.error(err);
    const state_error =
      isDBError(err) && (err as any).code === "23503"
        ? "Cannot activate."
        : "Failed to activate.";
    return { state_error, errors: {} };
  }
}
