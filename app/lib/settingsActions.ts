"use server";

import { revalidatePath } from "next/cache";
import pool from "./db";
import { SettingActionState } from "./definitions";
import { AddSettingSchema } from "./schemas";

export async function addSetting(
  prev: SettingActionState,
  formData: FormData
): Promise<SettingActionState> {
  // Build a raw object, but *extract subservices via getAll()*
  const type = formData.get("type") as string;
  let parsed;
  if (type === "services") {
    const name = formData.get("name");
    const subservices = formData.getAll("subservices"); // <-- grabs ALL
    parsed = AddSettingSchema.safeParse({ type, name, subservices });
  } else {
    const value = formData.get("value");
    parsed = AddSettingSchema.safeParse({ type, value });
  }

  if (!parsed.success) {
    const errs = parsed.error.flatten().fieldErrors;
    return { errors: errs, message: "Fix errors below." };
  }

  try {
    if (parsed.data.type === "services") {
      const { name, subservices } = parsed.data;
      const svcRes = await pool.query<{ id: number }>(
        `INSERT INTO services (name) VALUES ($1) RETURNING id`,
        [name.trim()]
      );
      const serviceId = svcRes.rows[0].id;
      // Insert each subservice
      const placeholders = subservices
        .map((_, i) => `($1,$${i + 2})`)
        .join(",");
      await pool.query(
        `INSERT INTO subservices (service_id,name) VALUES ${placeholders}`,
        [serviceId, ...subservices.map((s) => s.trim())]
      );
    } else {
      const { type, value } = parsed.data;
      await pool.query(`INSERT INTO ${type} (name) VALUES ($1)`, [
        value.trim(),
      ]);
    }

    revalidatePath("/settings");
    return {
      message: `${type === "services" ? "Service" : type.slice(0, -1)} added!`,
    };
  } catch (err: any) {
    console.error(err);
    if (err.code === "23505") {
      return { state_error: "That name already exists." };
    }
    return { state_error: "Unexpected error." };
  }
}

export async function getSettings(
  type: "shifts" | "counters" | "stations" | "services"
): Promise<string[]> {
  // Validate type just in case
  if (!["shifts", "counters", "stations", "services"].includes(type)) {
    throw new Error(`Invalid settings type: ${type}`);
  }

  const result = await pool.query<{ name: string }>(
    `SELECT name FROM ${type} ORDER BY name ASC`
  );
  return result.rows.map((r) => r.name);
}

export async function getAvailableCounters(
  station: string,
  shift: string
): Promise<string[]> {
  // 1. fetch all counters
  const allRes = await pool.query<{ name: string }>(
    `SELECT name FROM counters ORDER BY name ASC`
  );
  const allCounters = allRes.rows.map((r) => r.name);

  // 2. fetch assigned counters via joins on stationId & shiftId
  const takenRes = await pool.query<{ name: string }>(
    `SELECT c.name
       FROM "User" u
         JOIN counters c  ON u."counterId" = c.id
         JOIN stations st ON u."stationId" = st.id
         JOIN shifts   s  ON u."shiftId"   = s.id
       WHERE st.name = $1
         AND s.name  = $2`,
    [station, shift]
  );
  const taken = new Set(takenRes.rows.map((r) => r.name));

  // 3. filter out
  return allCounters.filter((c) => !taken.has(c));
}

export async function getServices(): Promise<string[]> {
  const res = await pool.query<{ name: string }>(
    `SELECT name FROM services ORDER BY name`
  );
  return res.rows.map((r) => r.name);
}

export async function getSubservices(serviceName: string): Promise<string[]> {
  const res = await pool.query<{ name: string }>(
    `SELECT sserv.name
       FROM services svc
       JOIN subservices sserv ON sserv.service_id = svc.id
       WHERE svc.name = $1
       ORDER BY sserv.name`,
    [serviceName]
  );
  return res.rows.map((r) => r.name);
}
