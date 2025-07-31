// app/lib/recordQueries.ts
"use server";

import { auth } from "@/auth";
import { getUser } from "./loginActions";
import { safeQuery } from "./db";
import { RecordRow } from "./definitions";

const ITEMS_PER_PAGE = 10;

async function injectRoleFilters(
  role: string | null,
  params: Record<string, unknown>
): Promise<void> {
  if (!role) return;
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return;
  const me = await getUser(email);
  if (!me) return;

  if (role === "supervisor") {
    params.stationId = me.stationId;
  } else if (role === "biller") {
    params.userId = me.id;
  }
}

/** Get total pages of records matching filters and role */
export async function fetchRecordsPages(
  query: string,
  startDate: string,
  endDate: string,
  role: string | null
): Promise<number> {
  const params: Record<string, unknown> = {
    queryParam: `%${query}%`,
    startDate,
    endDate,
  };
  await injectRoleFilters(role, params);

  const whereClauses: string[] = [
    `(
    r.ticket LIKE @queryParam OR
    r.recordType LIKE @queryParam OR
    r.name LIKE @queryParam OR
    r.service LIKE @queryParam OR
    r.recordNumber LIKE @queryParam
  )`,
  ];

  if (startDate && endDate)
    whereClauses.push(`r.createdAt BETWEEN @startDate AND @endDate`);
  else if (startDate) whereClauses.push(`r.createdAt >= @startDate`);
  else if (endDate) whereClauses.push(`r.createdAt <= @endDate`);

  if (params.stationId != null) whereClauses.push(`u.stationId = @stationId`);
  if (params.userId != null) whereClauses.push(`r.userId = @userId`);

  const sql = `
    SELECT COUNT(*) AS total
    FROM records r
    JOIN [User] u ON r.userId = u.id
    JOIN counters c ON u.counterId = c.id
    JOIN shifts s ON u.shiftId = s.id
    WHERE ${whereClauses.join(" AND ")}
  `;

  const { recordset } = await safeQuery<{ total: number }>(sql, params);
  const total = recordset[0]?.total ?? 0;
  return Math.ceil(total / ITEMS_PER_PAGE);
}

/** Fetch one page of records matching filters and role */
export async function fetchFilteredRecords(
  query: string,
  startDate: string,
  endDate: string,
  role: string | null,
  currentPage: number,
  itemsPerPage: number = ITEMS_PER_PAGE
): Promise<RecordRow[]> {
  const offset = (currentPage - 1) * itemsPerPage;
  const params: Record<string, unknown> = {
    queryParam: `%${query}%`,
    startDate,
    endDate,
    limit: itemsPerPage,
    offset,
  };
  await injectRoleFilters(role, params);

  const whereClauses: string[] = [
    `(
    r.ticket LIKE @queryParam OR
    r.recordType LIKE @queryParam OR
    r.name LIKE @queryParam OR
    r.service LIKE @queryParam OR
    r.recordNumber LIKE @queryParam
  )`,
  ];

  if (startDate && endDate)
    whereClauses.push(`r.createdAt BETWEEN @startDate AND @endDate`);
  else if (startDate) whereClauses.push(`r.createdAt >= @startDate`);
  else if (endDate) whereClauses.push(`r.createdAt <= @endDate`);

  if (params.stationId != null) whereClauses.push(`u.stationId = @stationId`);
  if (params.userId != null) whereClauses.push(`r.userId = @userId`);

  const sql = `
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
      ) THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END AS hasEdits
    FROM records r
    JOIN [User] u ON r.userId = u.id
    JOIN counters c ON u.counterId = c.id
    JOIN shifts s ON u.shiftId = s.id
    WHERE ${whereClauses.join(" AND ")}
    ORDER BY r.createdAt DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
  `;

  const { recordset } = await safeQuery<RecordRow>(sql, params);
  return recordset;
}
