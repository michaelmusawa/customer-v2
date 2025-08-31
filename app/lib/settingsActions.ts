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
import { safeQuery } from "./db";

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
  const station = (formData.get("station") as string) || null;
  const shift = formData.get("shift") as string;

  let parsed;
  if (type === "services") {
    const name = formData.get("name");
    const subservices = formData.getAll("subservices");
    parsed = AddSettingSchema.safeParse({ type, name, subservices });
  } else {
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
    if (parsed.data.type === "services") {
      const { name, subservices } = parsed.data;
      const svcRes = await safeQuery<{ id: number }>(
        `INSERT INTO services (name) OUTPUT INSERTED.id VALUES ($1)`,
        [name.trim()]
      );
      const serviceId = svcRes.rows[0].id;

      if (subservices.length) {
        const placeholders = subservices
          .map((_, i) => `($1, $${i + 2})`)
          .join(",");
        await safeQuery(
          `INSERT INTO subservices (service_id, name) VALUES ${placeholders}`,
          [serviceId, ...subservices.map((s) => s.trim())]
        );
      }
    } else if (parsed.data.type === "shifts") {
      const { value } = parsed.data;
      await safeQuery(
        `
        INSERT INTO shifts (name, "stationId")
        VALUES (
          $1,
          (SELECT id FROM stations WHERE name = $2)
        )
        `,
        [value.trim(), station!]
      );
    } else if (parsed.data.type === "counters") {
      const { value } = parsed.data;
      await safeQuery(
        `
        INSERT INTO counters (name, "shiftId")
        VALUES (
          $1,
          (
            SELECT TOP 1 s.id
              FROM shifts s
              JOIN stations st ON s."stationId" = st.id
             WHERE s.name = $2
               AND st.name = $3
          )
        )
        `,
        [value.trim(), shift!, station!]
      );
    } else if (parsed.data.type === "stations") {
      const { value } = parsed.data;
      await safeQuery(`INSERT INTO stations (name) VALUES ($1)`, [
        value.trim(),
      ]);
    }

    revalidatePath("/settings");
    return { message: "Added successfully!" };
  } catch (err: unknown) {
    console.error("addSetting error:", err);

    const state_error =
      isDBError(err) && (err as any).code === "23505"
        ? "That entry already exists."
        : "Unexpected error. Please try again.";

    return { state_error };
  }
}

export async function getSettings(
  type: "services" | "stations" | "shifts" | "counters"
): Promise<{ id: number; name: string }[]> {
  const session = await auth();
  const email = session?.user?.email;
  const me = email ? await getUser(email) : null;

  const stationName = me?.station ?? null;

  let sql: string;
  let params: string[] = [];

  switch (type) {
    case "shifts":
      if (stationName) {
        sql = `
          SELECT id, name
          FROM shifts
          WHERE "stationId" = (
            SELECT id FROM stations WHERE name = $1
          )
          ORDER BY name
        `;
        params = [stationName];
      } else {
        return [];
      }
      break;

    case "counters":
      if (stationName) {
        sql = `
          SELECT c.id, c.name
          FROM counters c
          JOIN shifts s ON c."shiftId" = s.id
          WHERE s."stationId" = (
            SELECT id FROM stations WHERE name = $1
          )
          ORDER BY s.name, c.name
        `;
        params = [stationName];
      } else {
        return [];
      }
      break;

    case "services":
    case "stations":
    default:
      sql = `SELECT id, name FROM ${type} ORDER BY name`;
      break;
  }

  const { rows } = await safeQuery<{ id: number; name: string }>(sql, params);
  return rows;
}

export async function getSubservices(serviceName: string): Promise<string[]> {
  const { rows } = await safeQuery<{ name: string }>(
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

export async function getServices(): Promise<string[]> {
  const { rows } = await safeQuery<{ name: string }>(
    `SELECT name FROM services ORDER BY name ASC`
  );
  return rows.map((r) => r.name);
}

export async function getAvailableCounters(
  station: string,
  shift: string
): Promise<string[]> {
  const allRes = await safeQuery<{ name: string }>(
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

  const takenRes = await safeQuery<{ name: string }>(
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

  return allNames.filter((c) => !taken.has(c));
}

// Update getGroupedCounters to return IDs
export async function getGroupedCounters(): Promise<
  {
    shift: { id: number; name: string };
    counters: { id: number; name: string }[];
  }[]
> {
  const session = await auth();
  const email = session?.user?.email;
  const me = email ? await getUser(email) : null;
  const stationName = me?.station;
  if (!stationName) return [];

  const { rows } = await safeQuery<{
    shift_id: number;
    shift_name: string;
    counter_id: number;
    counter_name: string;
  }>(
    `
    SELECT
      s.id   AS shift_id,
      s.name AS shift_name,
      c.id   AS counter_id,
      c.name AS counter_name
    FROM counters c
    JOIN shifts s      ON c."shiftId" = s.id
    JOIN stations st   ON s."stationId" = st.id
    WHERE st.name = $1
    ORDER BY s.name, c.name
    `,
    [stationName]
  );

  return rows.reduce<
    {
      shift: { id: number; name: string };
      counters: { id: number; name: string }[];
    }[]
  >((acc, row) => {
    let grp = acc.find((g) => g.shift.id === row.shift_id);
    if (!grp) {
      grp = {
        shift: { id: row.shift_id, name: row.shift_name },
        counters: [],
      };
      acc.push(grp);
    }
    grp.counters.push({ id: row.counter_id, name: row.counter_name });
    return acc;
  }, []);
}

export async function getSettingDetails(
  type: "stations" | "shifts" | "counters" | "services",
  id: number
): Promise<{ id: number; name: string } | null> {
  try {
    const { rows } = await safeQuery<{ id: number; name: string }>(
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
    await safeQuery(`UPDATE ${type} SET name = $1 WHERE id = $2`, [
      newName.trim(),
      id,
    ]);
    revalidatePath("/settings");
    return { message: "Updated successfully!" };
  } catch (err: unknown) {
    console.error("updateSetting error:", err);
    return { state_error: "Unexpected error. Please try again." };
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
    let inUse = false;
    if (type === "stations") {
      const { rows } = await safeQuery(
        `SELECT 1 AS one FROM "User" WHERE "stationId" = $1`,
        [id]
      );
      inUse = rows.length > 0;
    } else if (type === "shifts") {
      const { rows } = await safeQuery(
        `SELECT 1 AS one FROM counters WHERE "shiftId" = $1`,
        [id]
      );
      inUse = rows.length > 0;
    } else if (type === "counters") {
      const { rows } = await safeQuery(
        `SELECT 1 AS one FROM "User" WHERE "counterId" = $1`,
        [id]
      );
      inUse = rows.length > 0;
    } else if (type === "services") {
      const { rows } = await safeQuery(
        `SELECT 1 AS one FROM tickets WHERE "serviceId" IN (
           SELECT id FROM subservices WHERE service_id = $1
         )`,
        [id]
      );
      inUse = rows.length > 0;
    }

    if (inUse) {
      return { state_error: "Cannot delete because it is in use." };
    }

    await safeQuery(`DELETE FROM ${type} WHERE id = $1`, [id]);
    revalidatePath("/settings");
    return { message: "Deleted successfully!" };
  } catch (err: unknown) {
    console.error("deleteSetting error:", err);
    return { state_error: "Unexpected error. Please try again." };
  }
}

export async function updateService(
  id: number,
  newName: string
): Promise<{ error?: string; message?: string }> {
  try {
    await safeQuery(`UPDATE services SET name = $1 WHERE id = $2`, [
      newName.trim(),
      id,
    ]);
    revalidatePath("/settings");
    return { message: "Service updated successfully!" };
  } catch (err: unknown) {
    console.error("updateService error:", err);
    return { error: "Unexpected error. Please try again." };
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
    await safeQuery(
      `UPDATE subservices
         SET name = $1
       WHERE service_id = $2 AND name = $3`,
      [newName.trim(), serviceId, oldName]
    );
    revalidatePath("/settings");
    return { message: "Updated successfully!" };
  } catch (err: unknown) {
    console.error("updateSubservice error:", err);
    return { state_error: "Unexpected error. Please try again." };
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
    await safeQuery(
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
    const { rows } = await safeQuery<{ id: number }>(
      `SELECT id FROM services WHERE name = $1`,
      [serviceName]
    );
    if (!rows.length) {
      return { state_error: "Service not found." };
    }
    const serviceId = rows[0].id;

    await safeQuery(
      `INSERT INTO subservices (service_id, name) VALUES ($1, $2)`,
      [serviceId, subservice.trim()]
    );

    revalidatePath("/settings");
    return { message: "Sub-service added!" };
  } catch (err: unknown) {
    console.error("addSubservice error:", err);
    return { state_error: "Unexpected error." };
  }
}
