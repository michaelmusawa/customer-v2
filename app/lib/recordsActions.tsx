"use server";

// app/lib/recordQueries.ts

import { auth } from "@/auth";
import { getUser } from "./loginActions";
import pool from "./db";
import { RecordActionState } from "./definitions";
import { RecordInput, RecordSchema } from "./schemas";
import { revalidatePath } from "next/cache";

interface RecordRow {
  id: number;
  ticket: string;
  recordType: string | null;
  name: string;
  service: string;
  subService: string | null;
  recordNumber: string | null;
  value: number;
  counter: string;
  shift: string;
  createdAt: Date;
}

/** Get total pages of records matching filters and role */
export async function fetchRecordsPages(
  query: string,
  startDate: string,
  endDate: string,
  role: string | null
): Promise<number> {
  const ITEMS_PER_PAGE = 10;
  const likeParam = `%${query}%`;
  const params = [likeParam];

  let countSql = `
    SELECT COUNT(*) AS total
    FROM records r
    JOIN "User" u ON r."userId"      = u.id
    JOIN counters c ON u."counterId" = c.id
    JOIN shifts   s ON u."shiftId"   = s.id
    
  `;

  // Base text search on several fields
  const where: string[] = [
    `(r.ticket   ILIKE $1 OR
      r."recordType" ILIKE $1 OR
      r.name     ILIKE $1 OR
      r.service  ILIKE $1 OR
      r."recordNumber" ILIKE $1 OR
      c.name     ILIKE $1 OR
      s.name     ILIKE $1)`,
  ];

  // Date filtering
  if (startDate && endDate) {
    where.push(
      `r."createdAt" BETWEEN $${params.length + 1} AND $${params.length + 2}`
    );
    params.push(startDate, endDate);
  } else if (startDate) {
    where.push(`r."createdAt" >= $${params.length + 1}`);
    params.push(startDate);
  } else if (endDate) {
    where.push(`r."createdAt" <= $${params.length + 1}`);
    params.push(endDate);
  }

  // Role filtering
  if (role === "supervisor") {
    // only records from your station
    const session = await auth();
    const email = session?.user?.email || "";
    const user = await getUser(email);
    const stationId = user?.stationId;
    if (stationId != null) {
      where.push(`u."stationId" = $${params.length + 1}`);
      params.push(`${stationId}`);
    }
  } else if (role === "biller") {
    // only your own records
    const session = await auth();
    const email = session?.user?.email || "";
    const user = await getUser(email);
    const userId = user?.id;
    if (userId != null) {
      where.push(`r."userId" = $${params.length + 1}`);
      params.push(`${userId}`);
    }
  }
  // admin & coordinator: no extra filter

  countSql += ` WHERE ${where.join(" AND ")}`;

  const res = await pool.query(countSql, params);
  const total = parseInt(res.rows[0].total, 10);
  return Math.ceil(total / ITEMS_PER_PAGE);
}

/** Fetch one page of records matching filters and role */
export async function fetchFilteredRecords(
  query: string,
  startDate: string,
  endDate: string,
  role: string | null,
  currentPage: number
): Promise<RecordRow[]> {
  const ITEMS_PER_PAGE = 10;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const likeParam = `%${query}%`;
  const params = [likeParam];

  let sql = `
    SELECT
      r.id,
      r.ticket,
      r."recordType",
      r.name,
      r.service,
      r."subService",
      r."recordNumber",
      r.value,
      c.name   AS counter,
      s.name   AS shift,
      r."createdAt"
    FROM records r
    JOIN "User" u ON r."userId"      = u.id
    JOIN counters c ON u."counterId" = c.id
    JOIN shifts   s ON u."shiftId"   = s.id
  `;

  const where: string[] = [
    `(r.ticket   ILIKE $1 OR
      r."recordType" ILIKE $1 OR
      r.name     ILIKE $1 OR
      r.service  ILIKE $1 OR
      r."recordNumber" ILIKE $1 OR
      c.name     ILIKE $1 OR
      s.name     ILIKE $1)`,
  ];

  if (startDate && endDate) {
    where.push(
      `r."createdAt" BETWEEN $${params.length + 1} AND $${params.length + 2}`
    );
    params.push(startDate, endDate);
  } else if (startDate) {
    where.push(`r."createdAt" >= $${params.length + 1}`);
    params.push(startDate);
  } else if (endDate) {
    where.push(`r."createdAt" <= $${params.length + 1}`);
    params.push(endDate);
  }

  if (role === "supervisor") {
    const session = await auth();
    const email = session?.user?.email || "";
    const user = await getUser(email);
    const stationId = user?.stationId;
    if (stationId != null) {
      where.push(`u."stationId" = $${params.length + 1}`);
      params.push(`${stationId}`);
    }
  } else if (role === "biller") {
    const session = await auth();
    const email = session?.user?.email || "";
    const user = await getUser(email);
    const userId = user?.id;
    if (userId != null) {
      where.push(`r."userId" = $${params.length + 1}`);
      params.push(`${userId}`);
    }
  }

  sql += ` WHERE ${where.join(" AND ")}`;
  sql += `
    ORDER BY r."createdAt" DESC
    LIMIT $${params.length + 1}
    OFFSET $${params.length + 2}
  `;
  params.push(`${ITEMS_PER_PAGE}`, `${offset}`);

  const res = await pool.query<RecordRow>(sql, params);
  return res.rows;
}

interface RecordRow {
  id: number;
  ticket: string;
  recordType: string | null;
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
  role: string | null
): Promise<number> {
  const ITEMS_PER_PAGE = 10;
  const likeParam = `%${query}%`;
  const params = [likeParam];

  let countSql = `
    SELECT COUNT(*) AS total
    FROM "EditedRecord" r
    JOIN "User" u ON r."billerId" = u.id
    JOIN counters c ON u."counterId" = c.id
    JOIN shifts   s ON u."shiftId"   = s.id
  `;

  const where: string[] = [
    `(
      r.ticket        ILIKE $1 OR
      r."recordType"  ILIKE $1 OR
      r.name          ILIKE $1 OR
      r.service       ILIKE $1 OR
      r."recordNumber" ILIKE $1 OR
      c.name          ILIKE $1 OR
      s.name          ILIKE $1
    )`,
  ];

  // Date filtering
  if (startDate && endDate) {
    where.push(
      `r."createdAt" BETWEEN $${params.length + 1} AND $${params.length + 2}`
    );
    params.push(startDate, endDate);
  } else if (startDate) {
    where.push(`r."createdAt" >= $${params.length + 1}`);
    params.push(startDate);
  } else if (endDate) {
    where.push(`r."createdAt" <= $${params.length + 1}`);
    params.push(endDate);
  }

  // Status filtering for non‑billers
  if (role !== "biller") {
    where.push(`r.status = 'pending'`);
  }

  // Role‑specific scoping
  if (role === "supervisor") {
    const session = await auth();
    const email = session?.user?.email || "";
    const user = await getUser(email);
    const stationId = user?.stationId;
    if (stationId != null) {
      where.push(`u."stationId" = $${params.length + 1}`);
      params.push(`${stationId}`);
    }
  } else if (role === "biller") {
    const session = await auth();
    const email = session?.user?.email || "";
    const user = await getUser(email);
    const userId = user?.id;
    if (userId != null) {
      where.push(`r."billerId" = $${params.length + 1}`);
      params.push(`${userId}`);
    }
  }

  countSql += ` WHERE ${where.join(" AND ")}`;

  const res = await pool.query(countSql, params);
  const total = parseInt(res.rows[0].total, 10);
  return Math.ceil(total / ITEMS_PER_PAGE);
}

/** Fetch filtered & paginated edited records (only pending for non‑billers) */
export async function fetchFilteredEditedRecords(
  query: string,
  startDate: string,
  endDate: string,
  role: string | null,
  currentPage: number
): Promise<RecordRow[]> {
  const ITEMS_PER_PAGE = 10;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const likeParam = `%${query}%`;
  const params = [likeParam];

  let sql = `
    SELECT
      r.id,
      r.ticket,
      r."recordId",
      r."recordType",
      r.name,
      r.service,
      r."subService",
      r."recordNumber",
      r.value,
      c.name   AS counter,
      s.name   AS shift,
      u.name AS "billerName",
      r."createdAt"
    FROM "EditedRecord" r
    JOIN "User" u ON r."billerId" = u.id
    JOIN counters c ON u."counterId" = c.id
    JOIN shifts   s ON u."shiftId"   = s.id
  `;

  const where: string[] = [
    `(
      r.ticket        ILIKE $1 OR
      r."recordType"  ILIKE $1 OR
      r.name          ILIKE $1 OR
      r.service       ILIKE $1 OR
      r."recordNumber" ILIKE $1 OR
      c.name          ILIKE $1 OR
      s.name          ILIKE $1
    )`,
  ];

  // Date filtering
  if (startDate && endDate) {
    where.push(
      `r."createdAt" BETWEEN $${params.length + 1} AND $${params.length + 2}`
    );
    params.push(startDate, endDate);
  } else if (startDate) {
    where.push(`r."createdAt" >= $${params.length + 1}`);
    params.push(startDate);
  } else if (endDate) {
    where.push(`r."createdAt" <= $${params.length + 1}`);
    params.push(endDate);
  }

  // Status filtering for non‑billers
  if (role !== "biller") {
    where.push(`r.status = 'pending'`);
  }

  // Role‑specific scoping
  if (role === "supervisor") {
    const session = await auth();
    const email = session?.user?.email || "";
    const user = await getUser(email);
    const stationId = user?.stationId;
    if (stationId != null) {
      where.push(`u."stationId" = $${params.length + 1}`);
      params.push(`${stationId}`);
    }
  } else if (role === "biller") {
    const session = await auth();
    const email = session?.user?.email || "";
    const user = await getUser(email);
    const userId = user?.id;
    if (userId != null) {
      where.push(`r."billerId" = $${params.length + 1}`);
      params.push(`${userId}`);
    }
  }

  sql += ` WHERE ${where.join(" AND ")}`;
  sql += `
    ORDER BY r."createdAt" DESC
    LIMIT $${params.length + 1}
    OFFSET $${params.length + 2}
  `;
  params.push(`${ITEMS_PER_PAGE}`, `${offset}`);

  const res = await pool.query<RecordRow>(sql, params);
  return res.rows;
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

  // 2. Extract arrays of row‑fields
  const services = formData.getAll("service") as string[];
  const subServices = formData.getAll("subService") as string[];
  const values = formData.getAll("value") as string[];
  const recordNumbers = formData.getAll("recordNumber") as string[];

  // Must have at least one row
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
      // prefix errors with row index
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
    return {
      errors: rowErrors,
      message: "Please fix the errors below.",
    };
  }

  // 4. Lookup userId from session
  let userId: number | undefined;
  const session = await auth();
  if (session?.user?.email) {
    const usr = await getUser(session.user.email);
    if (usr) userId = usr.id;
  }
  if (!userId) {
    return { state_error: "User not authenticated." };
  }

  // 5. Insert each row
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const insertSql = `
      INSERT INTO records
        (ticket, "recordType", name, service, "subService", "recordNumber", value, "userId")
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `;

    for (const row of validRows) {
      await client.query(insertSql, [
        row.ticket,
        row.recordType ?? null,
        row.name,
        row.service,
        row.subService ?? null,
        row.recordNumber ?? null,
        row.value,
        userId,
      ]);
    }

    await client.query("COMMIT");
    revalidatePath("/records");
    return { message: "Record(s) added successfully!" };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("AddRecord error:", err);
    return { state_error: "Failed to add record(s). Please try again." };
  } finally {
    client.release();
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
    await pool.query(
      `UPDATE records
       SET ticket = $1, "recordType" = $2, name = $3, service = $4, "subService" = $5, "recordNumber" = $6, value = $7
       WHERE id = $8`,
      [ticket, recordType, name, service, subService, recordNumber, value, id]
    );

    revalidatePath("/dashboard"); // Adjust as needed

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

  // get user id
  const userSession = await auth();
  const userEmail = userSession?.user?.email || "";
  const userRes = await pool.query<{ id: number }>(
    `SELECT id
       FROM "User"
       WHERE email = $1
       LIMIT 1`,
    [userEmail]
  );
  if (userRes.rows.length === 0) {
    return { state_error: "Unknown userEmail" };
  }

  const userId = userRes.rows[0].id;

  try {
    await pool.query(
      `INSERT INTO "EditedRecord"
      ("recordId", ticket, "recordType", name, service, "subService", "recordNumber",
       value, "billerId", reason, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8, $9, $10, $11)`,
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
        "pending",
      ]
    );

    revalidatePath("/dashboard"); // Adjust as needed

    return { message: "Record updated successfully!" };
  } catch (err) {
    console.error("Update failed:", err);
    return { state_error: "Update failed. Please try again.", errors: {} };
  }
}

export async function decideEditedRecord(
  _: RecordActionState,
  formData: FormData
): Promise<RecordActionState> {
  const id = formData.get("id") as string;
  const decision = formData.get("decision") as string; // "accept" or "reject"
  const comment = (formData.get("comment") as string) || null;

  if (!id || !decision || (decision !== "accept" && decision !== "reject")) {
    return { state_error: "Invalid request" };
  }

  try {
    // Fetch the EditedRecord row
    const erRes = await pool.query<{
      recordId: number;
      ticket: string;
      recordType: string | null;
      name: string;
      service: string;
      subService: string | null;
      recordNumber: string | null;
      value: number;
    }>(
      `SELECT
         "recordId", ticket, "recordType", name, service,
         "subService", "recordNumber", value
       FROM "EditedRecord"
       WHERE id = $1`,
      [id]
    );

    if (erRes.rows.length === 0) {
      return { state_error: "Edited record not found." };
    }
    const er = erRes.rows[0];

    if (decision === "accept") {
      // 1) Apply edits to the main records table
      await pool.query(
        `UPDATE records
           SET ticket       = $1,
               "recordType" = $2,
               name         = $3,
               service      = $4,
               "subService" = $5,
               "recordNumber" = $6,
               value        = $7,
               "updatedAt"  = NOW()
         WHERE id = $8`,
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

      // 2) Mark the EditedRecord as accepted
      await pool.query(
        `UPDATE "EditedRecord"
           SET status  = 'accepted',
               comment = $2,
               "updatedAt" = NOW()
         WHERE id = $1`,
        [id, comment]
      );
    } else {
      // Reject: just mark as rejected
      await pool.query(
        `UPDATE "EditedRecord"
           SET status  = 'rejected',
               comment = $2,
               "updatedAt" = NOW()
         WHERE id = $1`,
        [id, comment]
      );
    }

    // Revalidate the notifications / records listing page
    revalidatePath("/notifications");

    return { message: `Record ${decision}ed successfully.` };
  } catch (err) {
    console.error("decideEditedRecord error:", err);
    return { state_error: "Server error, please try again." };
  }
}
