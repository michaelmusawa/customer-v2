// app/lib/actions/addUser.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { ProfileActionState, UserActionState } from "./definitions";
import pool from "./db";
import { randomBytes } from "crypto";
import { sendMail } from "./loginActions";
import { ArchiveUserSchema, UpdateSchema } from "./schemas";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs/promises";
import { isDBError } from "./utils";

const AddUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  station: z.string().nullable().optional(),
  shift: z.string().nullable().optional(),
  counter: z.string().nullable().optional(),
  role: z.string().min(1, "Role is required"), // Assuming role is passed but not used in this action
});

export async function addUser(
  prevState: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  // Extract and parse fields
  const parsed = AddUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    station: formData.get("station"),
    shift: formData.get("shift"),
    counter: formData.get("counter"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: fieldErrors,
      message: "Please fix the errors below.",
    };
  }

  const { name, email, station, shift, counter, role } = parsed.data;

  let finalStation = station;

  // For billers without station specified, fetch from logged-in user
  if (role === "biller" && !station) {
    const userSession = await auth();
    const userEmail = userSession?.user?.email || "";
    if (!userEmail) {
      return {
        state_error: "You must be logged in to assign a station.",
      };
    }

    const userRes = await pool.query<{ station: string }>(
      `SELECT station FROM "User" WHERE email = $1`,
      [userEmail]
    );

    if (!userRes.rows.length || !userRes.rows[0].station) {
      return {
        state_error: "Your account has no associated station. Contact admin.",
      };
    }

    finalStation = userRes.rows[0].station;
  }

  try {
    // 1. Check for existing user
    const existing = await pool.query<{ id: number }>(
      `SELECT id FROM "User" WHERE email = $1`,
      [email]
    );
    if (existing.rows.length) {
      return {
        errors: { email: [`A user with this email ${email} already exists.`] },
      };
    }

    // 2. Resolve FK IDs
    const [shiftRes, stationRes, counterRes] = await Promise.all([
      pool.query<{ id: number }>(`SELECT id FROM shifts WHERE name = $1`, [
        shift,
      ]),
      pool.query<{ id: number }>(`SELECT id FROM stations WHERE name = $1`, [
        finalStation,
      ]),
      pool.query<{ id: number }>(`SELECT id FROM counters WHERE name = $1`, [
        counter,
      ]),
    ]);

    if (shift && !shiftRes.rows.length) {
      return { errors: { shift: [`Shift "${shift}" not found`] } };
    }
    if (finalStation && !stationRes.rows.length) {
      return { errors: { station: [`Station "${finalStation}" not found`] } };
    }
    if (counter && !counterRes.rows.length) {
      return { errors: { counter: [`Counter "${counter}" not found`] } };
    }

    const shiftId = shiftRes.rows[0] ? shiftRes.rows[0].id : null;
    const stationId = stationRes.rows[0] ? stationRes.rows[0].id : null;
    const counterId = counterRes.rows[0] ? counterRes.rows[0].id : null;

    // 3. Generate invite token
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 3600 * 1000); // 24h

    // 4. Insert new user
    const insertRes = await pool.query<{ id: number }>(
      `INSERT INTO "User" 
         (name, email, "shiftId", "stationId", "counterId", role, "password_reset_token", "password_reset_expires")
       VALUES 
         ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [name, email, shiftId, stationId, counterId, role, token, expires]
    );

    const newUserId = insertRes.rows[0].id;

    // 5. Send email
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;
    await sendMail(resetUrl, email, name);

    // 6. Revalidate dashboard
    revalidatePath("/dashboard");

    return {
      message: `User #${newUserId} added successfully!`,
    };
  } catch (err) {
    console.error("Error creating user:", err);
    return {
      state_error: "There was an unexpected error. Please try again.",
    };
  }
}

// 1. Validation schema
const UpdateUserSchema = z.object({
  userId: z.coerce.number(),
  name: z.string().min(1, "Name is required"),
  station: z.string().nullable().optional(),
  shift: z.string().nullable().optional(),
  counter: z.string().nullable().optional(),
  role: z.string().min(1, "Role is required"),
});

export async function updateUser(
  prevState: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  // 2. Parse & validate
  const parsed = UpdateUserSchema.safeParse({
    userId: formData.get("userId"),
    name: formData.get("name"),
    station: formData.get("station"),
    shift: formData.get("shift"),
    counter: formData.get("counter"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { userId, name, station, shift, counter, role } = parsed.data;

  // 3. If biller & no station provided, inherit from current user
  let finalStation = station;
  if (role === "biller" && !station) {
    const session = await auth();
    const you = session?.user?.email;
    if (!you) {
      return { state_error: "Must be signed in to assign station." };
    }
    const me = await pool.query<{ station: string }>(
      `
        SELECT
          st.name AS station
        FROM "User" u
        LEFT JOIN stations st
          ON u."stationId" = st.id
        WHERE u.email = $1
        LIMIT 1
      `,
      [you]
    );

    if (!me.rows.length || !me.rows[0].station) {
      return { state_error: "Your account has no station set." };
    }
    finalStation = me.rows[0].station;
  }

  try {
    // 4. Resolve FK ids
    const [shiftRes, stationRes, counterRes] = await Promise.all([
      shift
        ? pool.query<{ id: number }>(`SELECT id FROM shifts WHERE name=$1`, [
            shift,
          ])
        : Promise.resolve({ rows: [] }),
      finalStation
        ? pool.query<{ id: number }>(`SELECT id FROM stations WHERE name=$1`, [
            finalStation,
          ])
        : Promise.resolve({ rows: [] }),
      counter
        ? pool.query<{ id: number }>(`SELECT id FROM counters WHERE name=$1`, [
            counter,
          ])
        : Promise.resolve({ rows: [] }),
    ]);

    if (shift && !shiftRes.rows.length) {
      return { errors: { shift: [`Shift "${shift}" not found`] } };
    }
    if (finalStation && !stationRes.rows.length) {
      return { errors: { station: [`Station "${finalStation}" not found`] } };
    }
    if (counter && !counterRes.rows.length) {
      return { errors: { counter: [`Counter "${counter}" not found`] } };
    }

    const shiftId = shiftRes.rows[0]?.id ?? null;
    const stationId = stationRes.rows[0]?.id ?? null;
    const counterId = counterRes.rows[0]?.id ?? null;

    // 5. Build dynamic SET clause
    const sets: string[] = [`name = $2`, `role = $3`];
    const params: (number | string | null)[] = [userId, name, role];

    if (shift !== undefined) {
      sets.push(`"shiftId" = $${params.length + 1}`);
      params.push(shiftId);
    }
    if (finalStation !== undefined) {
      sets.push(`"stationId" = $${params.length + 1}`);
      params.push(stationId);
    }
    if (counter !== undefined) {
      sets.push(`"counterId" = $${params.length + 1}`);
      params.push(counterId);
    }

    // 6. Execute update
    await pool.query(
      `UPDATE "User" SET ${sets.join(", ")} WHERE id = $1`,
      params
    );

    // 7. Revalidate listing
    revalidatePath("/dashboard");

    return { message: "User updated successfully!" };
  } catch (err) {
    console.error("Error updating user:", err);
    return { state_error: "Unexpected error. Please try again." };
  }
}

export async function updateProfile(
  prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  // 1) Validate inputs
  const parsed = UpdateSchema.safeParse({
    name: formData.get("name"),
    image: formData.get("image") as File | null,
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      state_error: "Please fix the errors below.",
    };
  }

  const { name, image, password } = parsed.data;

  // 2) Identify user
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return { state_error: "Not authenticated." };
  }

  // 1) Load existing image URL from the DB
  const { rows } = await pool.query<{ image: string | null }>(
    `SELECT image FROM "User" WHERE email = $1`,
    [email]
  );

  const oldImage = rows[0]?.image;

  // 3) Handle avatar upload, if any
  let imageUrl = oldImage;
  if (image && image.size > 0) {
    // ensure uploads dir exists under public/images
    const uploadDir = path.join(process.cwd(), "public", "images", "uploads");

    // delete old file if it’s in our uploads folder
    if (oldImage && oldImage.startsWith("/images/uploads/")) {
      const oldFile = path.join(process.cwd(), "public", oldImage);
      try {
        await fs.unlink(oldFile);
      } catch {
        /* swallow not-found errors */
      }
    }

    await fs.mkdir(uploadDir, { recursive: true });

    // write the new file
    const buf = Buffer.from(await image.arrayBuffer());
    const fileName = `${Date.now()}-${image.name.replace(/\s+/g, "_")}`;
    const dest = path.join(uploadDir, fileName);
    await fs.writeFile(dest, buf);

    // public URL path
    imageUrl = `/images/uploads/${fileName}`;
  }

  // 4) Build SQL
  const setClauses: string[] = [];
  const params: (string | null)[] = [email]; // $1

  // name
  setClauses.push(`name = $${params.length + 1}`);
  params.push(name);

  // avatar
  if (imageUrl !== null) {
    setClauses.push(`image = $${params.length + 1}`);
    params.push(imageUrl);
  }

  // password
  if (password) {
    const hash = await bcrypt.hash(password, 12);
    setClauses.push(`password = $${params.length + 1}`);
    params.push(hash);
  }

  // 5) Execute
  try {
    const sql = `
      UPDATE "User"
         SET ${setClauses.join(", ")}
       WHERE email = $1
    `;
    await pool.query(sql, params);

    // 6) Revalidate and respond
    revalidatePath("/profile");
    return { message: "Profile updated successfully!" };
  } catch (err) {
    console.error("updateProfile error:", err);
    return { state_error: "Something went wrong. Please try again." };
  }
}

// 2) Server action
export async function archiveUser(
  prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  // parse + validate
  const raw = Object.fromEntries(formData.entries());
  const parsed = ArchiveUserSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      state_error: "Invalid request.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { userId } = parsed.data;
  try {
    // soft-delete: set status to 'archived'
    await pool.query(`UPDATE "User" SET status = 'archived' WHERE id = $1`, [
      userId,
    ]);
    // revalidate any pages showing users
    revalidatePath("/dashboard");
    return { message: "User archived." };
  } catch (err) {
    console.error("archiveUser error:", err);
    return { state_error: "Could not archive user." };
  }
}

export async function activateUser(
  prevState: UserActionState | undefined,
  formData: FormData
): Promise<UserActionState> {
  // Parse and validate userId
  const raw = formData.get("userId");
  const userId = raw ? parseInt(raw.toString(), 10) : NaN;

  if (isNaN(userId)) {
    return {
      state_error: "Invalid user identifier.",
      errors: {},
      message: null,
    };
  }

  try {
    const result = await pool.query(
      `UPDATE "User" SET status = NULL WHERE id = $1`,
      [userId]
    );

    if (result.rowCount === 0) {
      // No rows updated → probably invalid id
      return {
        state_error: "User not found or already active.",
        errors: {},
        message: null,
      };
    }

    // Invalidate any cached pages that list users
    revalidatePath("/dashboard");

    return {
      message: "User activated successfully.",
      state_error: null,
      errors: {},
    };
  } catch (err: unknown) {
    console.error("activateUser error:", err);
    const state_error =
      isDBError(err) && err.code === "23503"
        ? "Cannot activate this user due to referential integrity."
        : "Failed to activate user. Please try again later.";

    return {
      state_error,
      errors: {},
      message: null,
    };
  }
}
