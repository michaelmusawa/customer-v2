// app/lib/settingsActions.ts
"use server";

import { revalidatePath } from "next/cache";
import pool from "./db";
import {
  AddSettingSchema,
  AddSubserviceSchema,
  DeleteSettingSchema,
  DeleteSubserviceSchema,
  UpdateSettingSchema,
  UpdateSubserviceSchema,
} from "./schemas";
import type { SettingActionState } from "./definitions";
import { auth } from "@/auth";
import { getUser } from "./loginActions";
import { isDBError } from "./utils";

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
  console.log("formData", formData);
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
  } catch (err: unknown) {
    console.error("addSetting error:", err);

    const state_error =
      isDBError(err) && err.code === "23505"
        ? "That entry already exists."
        : "Unexpected error. Please try again.";

    return { state_error };
  }
}

/**
 * Get all entries of a given type, ordered alphabetically.
 * - for "services": returns service names
 * - for others: returns shift/counter/station names
 */
// app/lib/settingsActions.ts
export async function getSettings(
  type: "services" | "stations" | "shifts" | "counters"
): Promise<{ id: number; name: string }[]> {
  let sql: string;
  let params: string[] = [];

  // get users station

  const session = await auth();
  const userEmail = session?.user?.email || "";
  const user = await getUser(userEmail);
  const station = user?.station || null;

  if (type === "shifts") {
    sql = `
      SELECT id,name
        FROM shifts
       WHERE "stationId" = (SELECT id FROM stations WHERE name = $1)
       ORDER BY name`;
    params = [station!];
  } else if (type === "counters") {
    sql = `
      SELECT c.id,c.name
        FROM counters c
        JOIN shifts s ON c."shiftId" = s.id
       WHERE s."stationId" = (SELECT id FROM stations WHERE name = $1)
       ORDER BY s.name, c.name`;
    params = [station!];
  } else {
    // services & stations unchanged
    sql = `SELECT id,name FROM ${type} ORDER BY name`;
  }

  const { rows } = await pool.query<{ id: number; name: string }>(sql, params);
  return rows;
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
  // 1) Get all counters defined for this shift (and station, if you want to scope by station too)
  //    Assuming shifts table has a stationId FK; if not, you can omit station scoping here.
  const allRes = await pool.query<{ name: string }>(
    `
    SELECT c.name
      FROM counters c
      JOIN shifts   s ON c."shiftId"   = s.id
      JOIN stations st ON s."stationId" = st.id
     WHERE st.name  = $1
       AND s.name   = $2
     ORDER BY c.name ASC
  `,
    [station, shift]
  );
  const allNames = allRes.rows.map((r) => r.name);

  // 2) Find which of those are already assigned to a user at that station+shift
  const takenRes = await pool.query<{ name: string }>(
    `
    SELECT c2.name
      FROM "User" u
      JOIN counters c2 ON u."counterId" = c2.id
      JOIN shifts   s2 ON u."shiftId"   = s2.id
      JOIN stations st2 ON u."stationId" = st2.id
     WHERE st2.name = $1
       AND s2.name  = $2
  `,
    [station, shift]
  );
  const taken = new Set(takenRes.rows.map((r) => r.name));

  // 3) Return only those counters that are defined for the shift but not yet taken
  return allNames.filter((c) => !taken.has(c));
}

// Update getGroupedCounters to return IDs
export async function getGroupedCounters(): Promise<
  {
    shift: { id: number; name: string };
    counters: { id: number; name: string }[];
  }[]
> {
  const { rows } = await pool.query<{
    shift_id: number;
    shift_name: string;
    counter_id: number;
    counter_name: string;
  }>(
    `SELECT 
      s.id AS shift_id, 
      s.name AS shift_name,
      c.id AS counter_id,
      c.name AS counter_name
    FROM counters c
    JOIN shifts s ON c."shiftId" = s.id
    ORDER BY s.name ASC, c.name ASC`
  );

  // Group counters by shift
  const grouped = rows.reduce((acc, row) => {
    const existingGroup = acc.find((g) => g.shift.id === row.shift_id);

    const counter = {
      id: row.counter_id,
      name: row.counter_name,
    };

    if (existingGroup) {
      existingGroup.counters.push(counter);
    } else {
      acc.push({
        shift: {
          id: row.shift_id,
          name: row.shift_name,
        },
        counters: [counter],
      });
    }
    return acc;
  }, [] as { shift: { id: number; name: string }; counters: { id: number; name: string }[] }[]);

  return grouped;
}
// Add these new functions:
export async function getSettingDetails(
  type: "stations" | "shifts" | "counters" | "services",
  id: number
): Promise<{ id: number; name: string } | null> {
  try {
    const { rows } = await pool.query(
      `SELECT id, name FROM ${type} WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function updateSetting(
  prev: SettingActionState,
  formData: FormData
): Promise<SettingActionState> {
  const raw = Object.fromEntries(formData.entries());
  const result = UpdateSettingSchema.safeParse(raw);
  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      state_error: "Please fix the errors below.",
    };
  }
  const { type, id, newName } = result.data;

  try {
    await pool.query(`UPDATE ${type} SET name = $1 WHERE id = $2`, [
      newName.trim(),
      id,
    ]);
    revalidatePath("/settings");
    return { message: "Updated successfully!" };
  } catch (err: unknown) {
    console.error("updateSetting error:", err);

    const state_error =
      isDBError(err) && err.code === "23505"
        ? "That name already exists."
        : "Unexpected error. Please try again.";

    return { state_error };
  }
}

export async function deleteSetting(
  prev: SettingActionState,
  formData: FormData
): Promise<SettingActionState> {
  const raw = Object.fromEntries(formData.entries());
  const result = DeleteSettingSchema.safeParse(raw);
  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      state_error: "Invalid request.",
    };
  }
  const { type, id } = result.data;

  try {
    // check in-use constraints...
    let inUse = false;
    if (type === "stations") {
      const r = await pool.query(
        `SELECT 1 FROM "User" WHERE "stationId" = $1 LIMIT 1`,
        [id]
      );
      inUse = r.rowCount !== null && r.rowCount > 0;
    } else if (type === "shifts") {
      const r = await pool.query(
        `SELECT 1 FROM counters WHERE "shiftId" = $1 LIMIT 1`,
        [id]
      );
      inUse = r.rowCount !== null && r.rowCount > 0;
    } else if (type === "counters") {
      const r = await pool.query(
        `SELECT 1 FROM "User" WHERE "counterId" = $1 LIMIT 1`,
        [id]
      );
      inUse = (r.rowCount ?? 0) > 0;
    } else if (type === "services") {
      // prevent deleting a service that has subservices in use
      const r = await pool.query(
        `SELECT 1 FROM tickets WHERE "serviceId" IN (
          SELECT id FROM subservices WHERE service_id = $1
        ) LIMIT 1`,
        [id]
      );
      inUse = (r.rowCount ?? 0) > 0;
    }

    if (inUse) {
      return { state_error: "Cannot delete because it is in use." };
    }

    await pool.query(`DELETE FROM ${type} WHERE id = $1`, [id]);
    revalidatePath("/settings");
    return { message: "Deleted successfully!" };
  } catch (err: unknown) {
    console.error("deleteSetting error:", err);

    // You could branch on specific err.code here if needed:
    // if (isDBError(err) && err.code === "23503") { ... }

    return {
      state_error: "Unexpected error. Please try again.",
    };
  }
}

// Add these new functions:
export async function updateService(
  id: number,
  newName: string
): Promise<{ error?: string; message?: string }> {
  try {
    await pool.query("BEGIN");

    // Update service name
    await pool.query(`UPDATE services SET name = $1 WHERE id = $2`, [
      newName.trim(),
      id,
    ]);

    // Keep subservices as is (no changes to subservices in this update)

    await pool.query("COMMIT");
    revalidatePath("/settings");
    return { message: "Service updated successfully!" };
  } catch (err: unknown) {
    await pool.query("ROLLBACK");
    console.error("updateService error:", err);

    const errorMessage =
      isDBError(err) && err.code === "23505"
        ? "A service with that name already exists."
        : "Unexpected error. Please try again.";

    return { error: errorMessage };
  }
}

export async function updateSubservice(
  prev: SettingActionState,
  formData: FormData
): Promise<SettingActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = UpdateSubserviceSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      state_error: "Fix the errors below.",
    };
  }
  const { serviceId, oldName, newName } = parsed.data;

  try {
    await pool.query(
      `UPDATE subservices
         SET name = $1
       WHERE service_id = $2 AND name = $3`,
      [newName.trim(), serviceId, oldName]
    );
    revalidatePath("/settings");
    return { message: "Updated successfully!" };
  } catch (err: unknown) {
    console.error("updateSubservice error:", err);

    const state_error =
      isDBError(err) && err.code === "23505"
        ? "A sub-service with that name already exists."
        : "Unexpected error. Please try again.";

    return { state_error };
  }
}

export async function deleteSubservice(
  prev: SettingActionState,
  formData: FormData
): Promise<SettingActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = DeleteSubserviceSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      state_error: "Invalid request.",
    };
  }
  const { serviceId, name } = parsed.data;

  try {
    await pool.query(
      `DELETE FROM subservices
       WHERE service_id = $1 AND name = $2`,
      [serviceId, name]
    );
    revalidatePath("/settings");
    return { message: "Deleted successfully!" };
  } catch (err) {
    console.error("deleteSubservice error:", err);
    return { state_error: "Unexpected error. Please try again." };
  }
}

export async function addSubservice(
  prev: SettingActionState,
  formData: FormData
): Promise<SettingActionState> {
  // parse + validate
  const parsed = AddSubserviceSchema.safeParse(
    Object.fromEntries(formData.entries())
  );
  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Fix errors.",
    };
  }
  const { serviceName, subservice } = parsed.data;

  try {
    // find service ID
    const svcRes = await pool.query<{ id: number }>(
      `SELECT id FROM services WHERE name = $1`,
      [serviceName]
    );
    if (!svcRes.rowCount) {
      return { state_error: "Service not found." };
    }
    const serviceId = svcRes.rows[0].id;

    // insert new subservice
    await pool.query(
      `INSERT INTO subservices (service_id, name) VALUES ($1, $2)`,
      [serviceId, subservice.trim()]
    );

    revalidatePath("/settings");
    return { message: "Sub-service added!" };
  } catch (err: unknown) {
    console.error("addSubservice error:", err);

    const state_error =
      isDBError(err) && err.code === "23505"
        ? "That sub-service already exists."
        : "Unexpected error.";

    return { state_error };
  }
}
