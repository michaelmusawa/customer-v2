// app/lib/settingsActions.ts
"use server";

import { revalidatePath } from "next/cache";
import pool from "./db";
import { AddSettingSchema } from "./schemas";
import type { SettingActionState } from "./definitions";

/**
 * Handles creation of a new setting entry.
 * - services → INSERT into services + subservices
 * - shifts/counters → INSERT into shifts or counters, tied to a station
 * - stations → INSERT into stations
 */
export async function addSetting(
  prev: SettingActionState,
  formData: FormData
): Promise<SettingActionState> {
  const type = formData.get("type") as
    | "services"
    | "shifts"
    | "counters"
    | "stations";
  // optional station context (for shifts & counters)
  const station = (formData.get("station") as string) || null;
  const shift = formData.get("shift") as string;

  // parse inputs
  let parsed;
  if (type === "services") {
    const name = formData.get("name");
    const subservices = formData.getAll("subservices");
    parsed = AddSettingSchema.safeParse({ type, name, subservices });
    parsed = AddSettingSchema.safeParse({ type, name, shift });
  } else {
    // for non-services we expect: value + (maybe) station
    const value = formData.get("value");
    parsed = AddSettingSchema.safeParse({ type, value, station });
  }

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Please fix the errors below.",
    };
  }

  try {
    // -- SERVICES --
    if (parsed.data.type === "services") {
      const { name, subservices } = parsed.data;
      // 1) create service
      const svcRes = await pool.query<{ id: number }>(
        `INSERT INTO services (name) VALUES ($1) RETURNING id`,
        [name.trim()]
      );
      const serviceId = svcRes.rows[0].id;
      // 2) batch insert its subservices
      if (subservices.length) {
        const placeholders = subservices
          .map((_, i) => `($1, $${i + 2})`)
          .join(",");
        await pool.query(
          `INSERT INTO subservices (service_id, name) VALUES ${placeholders}`,
          [serviceId, ...subservices.map((s) => s.trim())]
        );
      }

      // -- SHIFTS --
    } else if (parsed.data.type === "shifts") {
      const { value } = parsed.data;
      // must supply station
      await pool.query(
        `
        INSERT INTO shifts (name, "stationId")
        VALUES (
          $1,
          (SELECT id FROM stations WHERE name = $2)
        )
        `,
        [value.trim(), station!]
      );

      // -- COUNTERS --
    } else if (parsed.data.type === "counters") {
      const { value } = parsed.data;
      // we already have `station` and the supervisor picked a `shift` name
      // so look up the shift by name (and station scope is implicit in shift)
      await pool.query(
        `
        INSERT INTO counters (name, "shiftId")
        VALUES (
          $1,
          (SELECT id FROM shifts WHERE name = $2)
        )
        `,
        [value.trim(), shift!] // assume you passed shift name as form field
      );

      // -- STATIONS --
    } else if (parsed.data.type === "stations") {
      const { value } = parsed.data;
      await pool.query(`INSERT INTO stations (name) VALUES ($1)`, [
        value.trim(),
      ]);
    }

    // revalidate the settings page
    revalidatePath("/settings");
    return { message: "Added successfully!" };
  } catch (err: any) {
    console.error("addSetting error:", err);
    if (err.code === "23505") {
      return { state_error: "That entry already exists." };
    }
    return { state_error: "Unexpected error. Please try again." };
  }
}

/**
 * Get all entries of a given type, ordered alphabetically.
 * - for "services": returns service names
 * - for others: returns shift/counter/station names
 */
export async function getSettings(
  type: "services" | "shifts" | "counters" | "stations"
): Promise<string[]> {
  // safe-guard
  if (!["services", "shifts", "counters", "stations"].includes(type)) {
    throw new Error(`Invalid settings type: ${type}`);
  }
  const { rows } = await pool.query<{ name: string }>(
    `SELECT name FROM ${type} ORDER BY name ASC`
  );
  return rows.map((r) => r.name);
}

/**
 * Given a service name, fetch its subservices.
 */
export async function getSubservices(serviceName: string): Promise<string[]> {
  const { rows } = await pool.query<{ name: string }>(
    `
    SELECT ss.name
      FROM services s
      JOIN subservices ss ON ss.service_id = s.id
     WHERE s.name = $1
     ORDER BY ss.name
    `,
    [serviceName]
  );
  return rows.map((r) => r.name);
}

/**
 * List of all services.
 * (Sometimes you may fetch just service names without subservices.)
 */
export async function getServices(): Promise<string[]> {
  const { rows } = await pool.query<{ name: string }>(
    `SELECT name FROM services ORDER BY name ASC`
  );
  return rows.map((r) => r.name);
}

/**
 * For a given station & shift, return the counters *not yet* assigned.
 */
export async function getAvailableCounters(
  station: string,
  shift: string
): Promise<string[]> {
  // 1) all counters
  const all = await pool.query<{ name: string }>(
    `SELECT name FROM counters ORDER BY name ASC`
  );
  const allNames = all.rows.map((r) => r.name);

  // 2) already assigned to users at that station+shift
  const takenRes = await pool.query<{ name: string }>(
    `
    SELECT c.name
      FROM "User" u
      JOIN counters c  ON u."counterId" = c.id
      JOIN shifts   s  ON u."shiftId"   = s.id
      JOIN stations st ON u."stationId" = st.id
     WHERE st.name = $1
       AND s.name  = $2
    `,
    [station, shift]
  );
  const taken = new Set(takenRes.rows.map((r) => r.name));

  // 3) filter out
  return allNames.filter((c) => !taken.has(c));
}
