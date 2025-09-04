"use server";

// app/lib/recordQueries.ts

import { auth } from "@/auth";
import { getUser } from "./loginActions";
import { safeQuery } from "./db";
import { RecordActionState, RecordRow } from "./definitions";
import { RecordInput, RecordSchema } from "./schemas";
import { revalidatePath } from "next/cache";

/** Get total pages of records matching filters and role */
export async function fetchRecordsPages(
  query: string,
  startDate: string,
  endDate: string,
  role: string | null,
  recordType?: "invoice" | "receipt"
): Promise<number> {
  const ITEMS_PER_PAGE = 10;
  const likeParam = `%${query.toLowerCase()}%`;
  const params: unknown[] = [likeParam];

  let countSql = `
    SELECT COUNT(*) AS total
    FROM records r
    JOIN [User] u ON r.userId = u.id
    JOIN counters c ON u.counterId = c.id
    JOIN shifts   s ON u.shiftId = s.id
  `;

  const where: string[] = [
    `(LOWER(r.ticket) LIKE @p1 OR
      LOWER(r.recordType) LIKE @p1 OR
      LOWER(r.name) LIKE @p1 OR
      LOWER(r.service) LIKE @p1 OR
      LOWER(r.recordNumber) LIKE @p1 OR
      LOWER(c.name) LIKE @p1 OR
      LOWER(s.name) LIKE @p1)`,
  ];

  if (startDate && endDate) {
    where.push(
      `r.createdAt BETWEEN @p${params.length + 1} AND @p${params.length + 2}`
    );
    params.push(startDate, endDate);
  } else if (startDate) {
    where.push(`r.createdAt >= @p${params.length + 1}`);
    params.push(startDate);
  } else if (endDate) {
    where.push(`r.createdAt <= @p${params.length + 1}`);
    params.push(endDate);
  }

  if (recordType) {
    where.push(`r.recordType = @p${params.length + 1}`);
    params.push(recordType);
  }

  if (role === "supervisor") {
    const session = await auth();
    const email = session?.user?.email || "";
    const user = await getUser(email);
    if (user?.stationId != null) {
      where.push(`u.stationId = @p${params.length + 1}`);
      params.push(user.stationId);
    }
  } else if (role === "biller") {
    const session = await auth();
    const email = session?.user?.email || "";
    const user = await getUser(email);
    if (user?.id != null) {
      where.push(`r.userId = @p${params.length + 1}`);
      params.push(user.id);
    }
  }

  countSql += ` WHERE ${where.join(" AND ")}`;

  const { rows } = await safeQuery<{ total: number }>(countSql, params);
  const total = Number(rows[0].total);
  return Math.ceil(total / ITEMS_PER_PAGE);
}

/** Fetch one page of records */
export async function fetchFilteredRecords(
  query: string,
  startDate: string,
  endDate: string,
  role: string | null,
  currentPage: number,
  recordType?: "invoice" | "receipt",
  itemsPerPage: number = 10
): Promise<RecordRow[]> {
  const offset = (currentPage - 1) * itemsPerPage;
  const likeParam = `%${query.toLowerCase()}%`;
  const params: unknown[] = [likeParam];

  let sql = `
    WITH OrderedRecords AS (
      SELECT
        r.id,
        r.ticket,
        r.recordType,
        r.name,
        r.service,
        r.subService,
        r.recordNumber,
        r.value,
        c.name AS counter,
        s.name AS shift,
        r.createdAt,
        CASE WHEN EXISTS(
          SELECT 1 FROM EditedRecord er WHERE er.recordId = r.id
        ) THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS hasEdits,
        ROW_NUMBER() OVER (ORDER BY r.createdAt DESC) AS rn
      FROM records r
      JOIN [User] u ON r.userId = u.id
      JOIN counters c ON u.counterId = c.id
      JOIN shifts   s ON u.shiftId = s.id
  `;

  const where: string[] = [
    `(LOWER(r.ticket) LIKE @p1 OR
      LOWER(r.recordType) LIKE @p1 OR
      LOWER(r.name) LIKE @p1 OR
      LOWER(r.service) LIKE @p1 OR
      LOWER(r.recordNumber) LIKE @p1 OR
      LOWER(c.name) LIKE @p1 OR
      LOWER(s.name) LIKE @p1)`,
  ];

  if (startDate && endDate) {
    where.push(
      `r.createdAt BETWEEN @p${params.length + 1} AND @p${params.length + 2}`
    );
    params.push(startDate, endDate);
  } else if (startDate) {
    where.push(`r.createdAt >= @p${params.length + 1}`);
    params.push(startDate);
  } else if (endDate) {
    where.push(`r.createdAt <= @p${params.length + 1}`);
    params.push(endDate);
  }

  if (recordType) {
    where.push(`r.recordType = @p${params.length + 1}`);
    params.push(recordType);
  }

  if (role === "supervisor") {
    const session = await auth();
    const email = session?.user?.email || "";
    const user = await getUser(email);
    if (user?.stationId) {
      where.push(`u.stationId = @p${params.length + 1}`);
      params.push(user.stationId);
    }
  } else if (role === "biller") {
    const session = await auth();
    const email = session?.user?.email || "";
    const user = await getUser(email);
    if (user?.id) {
      where.push(`r.userId = @p${params.length + 1}`);
      params.push(user.id);
    }
  }

  sql += ` WHERE ${where.join(" AND ")} ) `;

  sql += `
    SELECT *
    FROM OrderedRecords
    WHERE rn BETWEEN @p${params.length + 1} AND @p${params.length + 2}
  `;

  params.push(offset + 1, offset + itemsPerPage);

  const { rows } = await safeQuery<RecordRow>(sql, params);
  return rows;
}

interface EditRecordRow {
  id: number;
  ticket: string;
  recordType: string | null;
  recordId: number;
  changes: number;
  name: string;
  service: string;
  subService: string | null;
  recordNumber: string | null;
  value: number;
  counter: string;
  shift: string;
  createdAt: Date;
  billerName: string;
}

/** Edited records */

// app/lib/recordsActions.ts

/** Get total pages of pending (for non‑billers) or all (for billers) edited records */

export async function fetchEditedRecordsPages(
  query: string,
  startDate: string,
  endDate: string,
  role: string | null,
  recordType: "invoice" | "receipt"
): Promise<number> {
  const ITEMS_PER_PAGE = 10;
  const likeParam = `%${query}%`;
  const params: unknown[] = [likeParam];

  let countSql = `
    SELECT COUNT(*) AS total
    FROM EditedRecord r
    JOIN [User] u ON r.billerId = u.id
    JOIN counters c ON u.counterId = c.id
    JOIN shifts   s ON u.shiftId   = s.id
  `;

  const where: string[] = [
    `(LOWER(r.ticket)       LIKE $1 OR
      LOWER(r.recordType)   LIKE $1 OR
      LOWER(r.name)         LIKE $1 OR
      LOWER(r.service)      LIKE $1 OR
      LOWER(r.recordNumber) LIKE $1 OR
      LOWER(c.name)         LIKE $1 OR
      LOWER(s.name)         LIKE $1)`,
  ];

  if (startDate && endDate) {
    where.push(
      `r.createdAt BETWEEN $${params.length + 1} AND $${params.length + 2}`
    );
    params.push(startDate, endDate);
  } else if (startDate) {
    where.push(`r.createdAt >= $${params.length + 1}`);
    params.push(startDate);
  } else if (endDate) {
    where.push(`r.createdAt <= $${params.length + 1}`);
    params.push(endDate);
  }

  if (role !== "biller") {
    where.push(`r.status = 'pending'`);
  }

  if (recordType) {
    where.push(`r.recordType = $${params.length + 1}`);
    params.push(recordType);
  }

  if (role === "supervisor") {
    const session = await auth();
    const email = session?.user?.email || "";
    const user = await getUser(email);
    if (user?.stationId != null) {
      where.push(`u.stationId = $${params.length + 1}`);
      params.push(user.stationId);
    }
  } else if (role === "biller") {
    const session = await auth();
    const email = session?.user?.email || "";
    const user = await getUser(email);
    if (user?.id != null) {
      where.push(`r.billerId = $${params.length + 1}`);
      params.push(user.id);
    }
  }

  countSql += ` WHERE ${where.join(" AND ")}`;

  const { rows } = await safeQuery<{ total: string }>(countSql, params);
  const total = parseInt(rows[0].total, 10);
  return Math.ceil(total / ITEMS_PER_PAGE);
}

/** Fetch filtered & paginated edited records (only pending for non-billers) */
export async function fetchFilteredEditedRecords(
  query: string,
  startDate: string,
  endDate: string,
  role: string | null,
  currentPage: number,
  recordType: "invoice" | "receipt"
): Promise<EditRecordRow[]> {
  const ITEMS_PER_PAGE = 10;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const likeParam = `%${query}%`;
  const params: unknown[] = [likeParam];

  let sql = `
    WITH OrderedEdited AS (
      SELECT
        r.id,
        r.ticket,
        r.recordId,
        r.recordType,
        r.name,
        r.service,
        r.subService,
        r.recordNumber,
        r.value,
        c.name   AS counter,
        s.name   AS shift,
        u.name   AS billerName,
        r.createdAt,
        (
          (CASE WHEN r.ticket        <> orig.ticket        THEN 1 ELSE 0 END)
        + (CASE WHEN r.recordType   <> orig.recordType    THEN 1 ELSE 0 END)
        + (CASE WHEN r.name         <> orig.name          THEN 1 ELSE 0 END)
        + (CASE WHEN r.service      <> orig.service       THEN 1 ELSE 0 END)
        + (CASE WHEN r.subService   <> orig.subService    THEN 1 ELSE 0 END)
        + (CASE WHEN r.recordNumber <> orig.recordNumber  THEN 1 ELSE 0 END)
        + (CASE WHEN r.value        <> orig.value         THEN 1 ELSE 0 END)
        ) AS changes,
        ROW_NUMBER() OVER (ORDER BY r.createdAt DESC) AS rn
      FROM EditedRecord r
      JOIN [User]    u    ON r.billerId = u.id
      JOIN counters  c    ON u.counterId = c.id
      JOIN shifts    s    ON u.shiftId   = s.id
      JOIN records   orig ON orig.id = r.recordId
  `;

  const where: string[] = [
    `(LOWER(r.ticket)       LIKE $1 OR
      LOWER(r.recordType)   LIKE $1 OR
      LOWER(r.name)         LIKE $1 OR
      LOWER(r.service)      LIKE $1 OR
      LOWER(r.subService)   LIKE $1 OR
      LOWER(r.recordNumber) LIKE $1 OR
      LOWER(c.name)         LIKE $1 OR
      LOWER(s.name)         LIKE $1)`,
  ];

  if (startDate && endDate) {
    where.push(
      `r.createdAt BETWEEN $${params.length + 1} AND $${params.length + 2}`
    );
    params.push(startDate, endDate);
  } else if (startDate) {
    where.push(`r.createdAt >= $${params.length + 1}`);
    params.push(startDate);
  } else if (endDate) {
    where.push(`r.createdAt <= $${params.length + 1}`);
    params.push(endDate);
  }

  if (role !== "biller") {
    where.push(`r.status = 'pending'`);
  }

  if (recordType) {
    where.push(`r.recordType = $${params.length + 1}`);
    params.push(recordType);
  }

  if (role === "supervisor") {
    const session = await auth();
    const email = session?.user?.email || "";
    const user = await getUser(email);
    if (user?.stationId) {
      where.push(`u.stationId = $${params.length + 1}`);
      params.push(user.stationId);
    }
  } else if (role === "biller") {
    const session = await auth();
    const email = session?.user?.email || "";
    const user = await getUser(email);
    if (user?.id) {
      where.push(`r.billerId = $${params.length + 1}`);
      params.push(user.id);
    }
  }

  sql += ` WHERE ${where.join(" AND ")} ) `;

  // final pagination slice
  sql += `
    SELECT *
    FROM OrderedEdited
    WHERE rn BETWEEN $${params.length + 1} AND $${params.length + 2}
  `;

  params.push(offset + 1, offset + ITEMS_PER_PAGE);

  const { rows } = await safeQuery<EditRecordRow>(sql, params);
  return rows;
}

/** Add new record(s) */
export async function addRecord(
  prevState: RecordActionState,
  formData: FormData
): Promise<RecordActionState> {
  // 1. Extract single fields
  const ticket = formData.get("ticket");
  const recordType = formData.get("recordType");
  const name = formData.get("name");

  if (typeof ticket !== "string" || ticket.trim() === "") {
    return { errors: { ticket: ["Ticket is required"] } };
  }
  if (typeof name !== "string" || name.trim() === "") {
    return { errors: { name: ["Name is required"] } };
  }

  // 2. Extract arrays of row-fields
  const services = formData.getAll("service") as string[];
  const subServices = formData.getAll("subService") as string[];
  const values = formData.getAll("value") as string[];
  const recordNumbers = formData.getAll("recordNumber") as string[];

  if (!services.length) {
    return { state_error: "At least one record row is required." };
  }

  // 3. Validate each row
  const rowErrors: Record<string, string[]> = {};
  const validRows: RecordInput[] = [];

  for (let i = 0; i < services.length; i++) {
    const rowObj = {
      ticket,
      recordType: (recordType as string) || undefined,
      name,
      service: services[i],
      subService: subServices[i] || undefined,
      recordNumber: recordNumbers[i] || undefined,
      value: values[i],
    };

    const parsed = RecordSchema.safeParse(rowObj);
    if (!parsed.success) {
      Object.entries(parsed.error.flatten().fieldErrors).forEach(
        ([field, errs]) => {
          rowErrors[`${field}[${i}]`] = errs as string[];
        }
      );
    } else {
      validRows.push(parsed.data);
    }
  }

  if (Object.keys(rowErrors).length) {
    return { errors: rowErrors, message: "Please fix the errors below." };
  }

  // 4. Lookup userId
  const session = await auth();
  const userEmail = session?.user?.email;
  const usr = userEmail ? await getUser(userEmail) : null;
  if (!usr?.id) {
    return { state_error: "User not authenticated." };
  }

  try {
    const insertSql = `
      INSERT INTO records
        (ticket, recordType, name, service, subService, recordNumber, value, userId)
      VALUES (@p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8)
    `;

    for (const row of validRows) {
      await safeQuery(insertSql, [
        row.ticket,
        row.recordType ?? null,
        row.name,
        row.service,
        row.subService ?? null,
        row.recordNumber ?? null,
        row.value,
        usr.id,
      ]);
    }

    revalidatePath("/records");
    return { message: "Record(s) added successfully!" };
  } catch (err) {
    console.error("AddRecord error:", err);
    return { state_error: "Failed to add record(s). Please try again." };
  }
}

export async function updateRecord(
  _: RecordActionState,
  formData: FormData
): Promise<RecordActionState> {
  const id = formData.get("id");
  const ticket = formData.get("ticket") as string;
  const recordType = formData.get("recordType") as string;
  const name = formData.get("name") as string;
  const service = formData.get("service") as string;
  const subService = formData.get("subService") as string;
  const recordNumber = formData.get("recordNumber") as string;
  const value = Number(formData.get("value"));

  if (
    !id ||
    !ticket ||
    !recordType ||
    !name ||
    !service ||
    !subService ||
    isNaN(value)
  ) {
    return { state_error: "All fields are required.", errors: {} };
  }

  try {
    await safeQuery(
      `
      UPDATE records
      SET ticket = @p1,
          recordType = @p2,
          name = @p3,
          service = @p4,
          subService = @p5,
          recordNumber = @p6,
          value = @p7
      WHERE id = @p8
      `,
      [ticket, recordType, name, service, subService, recordNumber, value, id]
    );

    revalidatePath("/dashboard");
    return { message: "Record updated successfully!" };
  } catch (err) {
    console.error("Update failed:", err);
    return { state_error: "Update failed. Please try again.", errors: {} };
  }
}

export async function editRecord(
  _: RecordActionState,
  formData: FormData
): Promise<RecordActionState> {
  const id = formData.get("id");
  const ticket = formData.get("ticket") as string;
  const recordType = formData.get("recordType") as string;
  const name = formData.get("name") as string;
  const service = formData.get("service") as string;
  const subService = formData.get("subService") as string;
  const recordNumber = formData.get("recordNumber") as string;
  const value = Number(formData.get("value"));
  const reason = formData.get("reason") as string;

  if (
    !id ||
    !ticket ||
    !recordType ||
    !name ||
    !service ||
    !subService ||
    isNaN(value) ||
    !reason
  ) {
    return { state_error: "All fields are required.", errors: {} };
  }

  const session = await auth();
  const email = session?.user?.email || "";
  const userRes = await safeQuery<{ id: number }>(
    `SELECT TOP 1 id FROM [User] WHERE email = @p1`,
    [email]
  );

  if (!userRes.rows.length) {
    return { state_error: "Unknown userEmail" };
  }

  const userId = userRes.rows[0].id;

  try {
    await safeQuery(
      `INSERT INTO EditedRecord
        (recordId, ticket, recordType, name, service, subService, recordNumber,
         [value], billerId, reason, status)
       VALUES (@p1,@p2,@p3,@p4,@p5,@p6,@p7,@p8,@p9,@p10,'pending')`,
      [
        id,
        ticket,
        recordType,
        name,
        service,
        subService,
        recordNumber,
        value,
        userId,
        reason,
      ]
    );

    revalidatePath("/dashboard/biller/records");
    return { message: "Record updated successfully!" };
  } catch (err) {
    console.error("EditRecord error:", err);
    return { state_error: "Update failed. Please try again.", errors: {} };
  }
}

export async function decideEditedRecord(
  _: RecordActionState,
  formData: FormData
): Promise<RecordActionState> {
  const id = formData.get("id") as string;
  const decision = formData.get("decision") as string;
  const comment = (formData.get("comment") as string) || null;

  if (!id || !decision || (decision !== "accept" && decision !== "reject")) {
    return { state_error: "Invalid request" };
  }

  try {
    const erRes = await safeQuery<{
      recordId: number;
      ticket: string;
      recordType: string | null;
      name: string;
      service: string;
      subService: string | null;
      recordNumber: string | null;
      value: number;
    }>(
      `SELECT recordId, ticket, recordType, name, service,
              subService, recordNumber, [value]
       FROM EditedRecord
       WHERE id = @p1`,
      [id]
    );

    if (!erRes.rows.length) {
      return { state_error: "Edited record not found." };
    }
    const er = erRes.rows[0];

    if (decision === "accept") {
      await safeQuery(
        `UPDATE records
           SET ticket = @p1,
               recordType = @p2,
               name = @p3,
               service = @p4,
               subService = @p5,
               recordNumber = @p6,
               [value] = @p7,
               updatedAt = GETDATE()
         WHERE id = @p8`,
        [
          er.ticket,
          er.recordType,
          er.name,
          er.service,
          er.subService,
          er.recordNumber,
          er.value,
          er.recordId,
        ]
      );

      await safeQuery(
        `UPDATE EditedRecord
           SET status = 'accepted',
               comment = @p2,
               updatedAt = GETDATE()
         WHERE id = @p1`,
        [id, comment]
      );
    } else {
      await safeQuery(
        `UPDATE EditedRecord
           SET status = 'rejected',
               comment = @p2,
               updatedAt = GETDATE()
         WHERE id = @p1`,
        [id, comment]
      );
    }

    revalidatePath("/notifications");
    return { message: `Record ${decision}ed successfully.` };
  } catch (err) {
    console.error("decideEditedRecord error:", err);
    return { state_error: "Server error, please try again." };
  }
}

export async function updateTicket(
  _: RecordActionState,
  formData: FormData
): Promise<RecordActionState> {
  const id = formData.get("id");
  const ticket = formData.get("ticket") as string;

  if (!id || !ticket) {
    return { state_error: "Ticket value is required.", errors: {} };
  }

  try {
    await safeQuery(
      `UPDATE records
         SET ticket = @p1
       WHERE id = @p2`,
      [ticket, id]
    );

    revalidatePath("/dashboard/records");
    return { message: "Ticket updated successfully!" };
  } catch (err) {
    console.error("Failed to update ticket:", err);
    return { state_error: "Update failed. Please try again.", errors: {} };
  }
}
