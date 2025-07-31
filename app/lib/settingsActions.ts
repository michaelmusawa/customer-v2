// app/lib/settingsActions.ts
"use server";

import { revalidatePath } from "next/cache";
import { safeQuery, DatabaseError } from "./db";
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

export async function addSetting(
  _prev: SettingActionState,
  formData: FormData
): Promise<SettingActionState> {
  const type = String(formData.get("type")) as
    | "services"
    | "shifts"
    | "counters"
    | "stations";
  const station = String(formData.get("station")) || null;
  const shift = String(formData.get("shift"));

  let parsed;
  if (type === "services") {
    parsed = AddSettingSchema.safeParse({
      type,
      name: formData.get("name"),
      subservices: formData.getAll("subservices"),
    });
  } else {
    parsed = AddSettingSchema.safeParse({
      type,
      value: formData.get("value"),
      station,
    });
  }

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Please fix the errors below.",
    };
  }

  try {
    if (type === "services") {
      const { name, subservices } = parsed.data;
      const insertSvc = `INSERT INTO services (name) OUTPUT INSERTED.id AS id VALUES (@name)`;
      const { recordset: svcRows } = await safeQuery<{ id: number }>(
        insertSvc,
        { name: name.trim() }
      );
      const serviceId = svcRows[0].id;
      if (subservices.length) {
        const inserts = subservices
          .map((_, i) => `( @serviceId, @name${i} )`)
          .join(",");
        const params: Record<string, unknown> = { serviceId };
        subservices.forEach((s, i) => (params[`name${i}`] = s.trim()));
        const sql = `INSERT INTO subservices (service_id, name) VALUES ${inserts}`;
        await safeQuery(sql, params);
      }
    } else if (type === "shifts") {
      const { value } = parsed.data;
      const sql = `
        INSERT INTO shifts (name, stationId)
        SELECT @value, id FROM stations WHERE name = @station`;
      await safeQuery(sql, { value: value.trim(), station });
    } else if (type === "counters") {
      const { value } = parsed.data;
      const sql = `
        INSERT INTO counters (name, shiftId)
        SELECT @value, s.id
        FROM shifts s
        JOIN stations st ON s.stationId = st.id
        WHERE s.name = @shift AND st.name = @station`;
      await safeQuery(sql, { value: value.trim(), shift, station });
    } else if (type === "stations") {
      await safeQuery(`INSERT INTO stations (name) VALUES (@value)`, {
        value: parsed.data.value.trim(),
      });
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
  const stationName = me?.station || null;

  let sql: string;
  let params: Record<string, unknown> = {};
  if (type === "shifts") {
    if (!stationName) return [];
    sql = `SELECT id, name FROM shifts WHERE stationId = (SELECT id FROM stations WHERE name = @station) ORDER BY name`;
    params.station = stationName;
  } else if (type === "counters") {
    if (!stationName) return [];
    sql = `SELECT c.id, c.name FROM counters c JOIN shifts s ON c.shiftId = s.id WHERE s.stationId = (SELECT id FROM stations WHERE name = @station) ORDER BY s.name, c.name`;
    params.station = stationName;
  } else {
    sql = `SELECT id, name FROM ${type} ORDER BY name`;
  }

  const { recordset } = await safeQuery<{ id: number; name: string }>(
    sql,
    params
  );
  return recordset;
}

export async function getSubservices(serviceName: string): Promise<string[]> {
  const sql = `
    SELECT ss.name
    FROM services s
    JOIN subservices ss ON ss.service_id = s.id
    WHERE s.name = @serviceName
    ORDER BY ss.name`;
  const { recordset } = await safeQuery<{ name: string }>(sql, { serviceName });
  return recordset.map((r) => r.name);
}

export async function getServices(): Promise<string[]> {
  const { recordset } = await safeQuery<{ name: string }>(
    `SELECT name FROM services ORDER BY name ASC`,
    {}
  );
  return recordset.map((r) => r.name);
}

export async function getAvailableCounters(
  station: string,
  shift: string
): Promise<string[]> {
  const sqlAll = `
    SELECT c.name
    FROM counters c
    JOIN shifts s ON c.shiftId = s.id
    JOIN stations st ON s.stationId = st.id
    WHERE st.name = @station AND s.name = @shift
    ORDER BY c.name ASC`;
  const { recordset: allRows } = await safeQuery<{ name: string }>(sqlAll, {
    station,
    shift,
  });
  const allNames = allRows.map((r) => r.name);

  const sqlTaken = `
    SELECT c2.name
    FROM [User] u
    JOIN counters c2 ON u.counterId = c2.id
    JOIN shifts s2 ON u.shiftId = s2.id
    JOIN stations st2 ON u.stationId = st2.id
    WHERE st2.name = @station AND s2.name = @shift`;
  const { recordset: takenRows } = await safeQuery<{ name: string }>(sqlTaken, {
    station,
    shift,
  });
  const taken = new Set(takenRows.map((r) => r.name));
  return allNames.filter((c) => !taken.has(c));
}

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

  const sql = `
    SELECT
      s.id AS shift_id,
      s.name AS shift_name,
      c.id AS counter_id,
      c.name AS counter_name
    FROM counters c
    JOIN shifts s ON c.shiftId = s.id
    JOIN stations st ON s.stationId = st.id
    WHERE st.name = @station
    ORDER BY s.name, c.name`;
  const { recordset } = await safeQuery<{
    shift_id: number;
    shift_name: string;
    counter_id: number;
    counter_name: string;
  }>(sql, { station: stationName });

  const grouped: any[] = [];
  recordset.forEach((row) => {
    let grp = grouped.find((g) => g.shift.id === row.shift_id);
    if (!grp) {
      grp = { shift: { id: row.shift_id, name: row.shift_name }, counters: [] };
      grouped.push(grp);
    }
    grp.counters.push({ id: row.counter_id, name: row.counter_name });
  });
  return grouped;
}

export async function getSettingDetails(
  type: "stations" | "shifts" | "counters" | "services",
  id: number
): Promise<{ id: number; name: string } | null> {
  try {
    const sql = `SELECT id, name FROM ${type} WHERE id = @id`;
    const { recordset } = await safeQuery<{ id: number; name: string }>(sql, {
      id,
    });
    return recordset[0] || null;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function updateSetting(
  _prev: SettingActionState,
  formData: FormData
): Promise<SettingActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = UpdateSettingSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      state_error: "Please fix the errors below.",
    };
  }
  const { type, id, newName } = parsed.data;

  try {
    const sql = `UPDATE ${type} SET name = @newName WHERE id = @id`;
    await safeQuery(sql, { newName: newName.trim(), id });
    revalidatePath("/settings");
    return { message: "Updated successfully!" };
  } catch (err: unknown) {
    console.error("updateSetting error:", err);
    const state_error =
      isDBError(err) && (err as any).code === "23505"
        ? "That name already exists."
        : "Unexpected error. Please try again.";
    return { state_error };
  }
}

export async function deleteSetting(
  _prev: SettingActionState,
  formData: FormData
): Promise<SettingActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = DeleteSettingSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      state_error: "Invalid request.",
    };
  }
  const { type, id } = parsed.data;

  try {
    let inUse = false;
    const checks: Record<string, string> = {
      stations: `SELECT 1 FROM [User] WHERE stationId = @id`,
      shifts: `SELECT 1 FROM counters WHERE shiftId = @id`,
      counters: `SELECT 1 FROM [User] WHERE counterId = @id`,
      services: `SELECT 1 FROM tickets WHERE serviceId IN (SELECT id FROM subservices WHERE service_id = @id)`,
    };
    const checkSql = checks[type];
    const { recordset: checkRows } = await safeQuery<{ [k: string]: any }>(
      checkSql,
      { id }
    );
    if (checkRows.length) inUse = true;

    if (inUse) return { state_error: "Cannot delete because it is in use." };
    await safeQuery(`DELETE FROM ${type} WHERE id = @id`, { id });
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
    const begin = `BEGIN TRANSACTION`;
    await safeQuery(begin, {});
    const sql = `UPDATE services SET name = @newName WHERE id = @id`;
    await safeQuery(sql, { newName: newName.trim(), id });
    const commit = `COMMIT TRANSACTION`;
    await safeQuery(commit, {});
    revalidatePath("/settings");
    return { message: "Service updated successfully!" };
  } catch (err: unknown) {
    await safeQuery(`ROLLBACK TRANSACTION`, {});
    console.error("updateService error:", err);
    const errorMessage =
      isDBError(err) && (err as any).code === "23505"
        ? "A service with that name already exists."
        : "Unexpected error. Please try again.";
    return { error: errorMessage };
  }
}

export async function updateSubservice(
  _prev: SettingActionState,
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
    const sql = `UPDATE subservices SET name = @newName WHERE service_id = @serviceId AND name = @oldName`;
    await safeQuery(sql, { newName: newName.trim(), serviceId, oldName });
    revalidatePath("/settings");
    return { message: "Updated successfully!" };
  } catch (err: unknown) {
    console.error("updateSubservice error:", err);
    const state_error =
      isDBError(err) && (err as any).code === "23505"
        ? "A sub-service with that name already exists."
        : "Unexpected error. Please try again.";
    return { state_error };
  }
}

export async function deleteSubservice(
  _prev: SettingActionState,
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
    const sql = `DELETE FROM subservices WHERE service_id = @serviceId AND name = @name`;
    await safeQuery(sql, { serviceId, name });
    revalidatePath("/settings");
    return { message: "Deleted successfully!" };
  } catch (err) {
    console.error("deleteSubservice error:", err);
    return { state_error: "Unexpected error. Please try again." };
  }
}

export async function addSubservice(
  _prev: SettingActionState,
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
    const lookup = `SELECT id FROM services WHERE name = @serviceName`;
    const { recordset: svc } = await safeQuery<{ id: number }>(lookup, {
      serviceName,
    });
    if (!svc.length) return { state_error: "Service not found." };
    const sql = `INSERT INTO subservices (service_id, name) VALUES (@serviceId, @subservice)`;
    await safeQuery(sql, {
      serviceId: svc[0].id,
      subservice: subservice.trim(),
    });
    revalidatePath("/settings");
    return { message: "Sub-service added!" };
  } catch (err: unknown) {
    console.error("addSubservice error:", err);
    const state_error =
      isDBError(err) && (err as any).code === "23505"
        ? "That sub-service already exists."
        : "Unexpected error.";
    return { state_error };
  }
}
