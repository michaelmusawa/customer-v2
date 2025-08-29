// app/lib/userActions.ts
"use server";

import { auth } from "@/auth";
import { getUser } from "./loginActions";
import { safeQuery } from "./db";
import type { User } from "./definitions";

const ITEMS_PER_PAGE = 10;

async function injectSupervisorFilter(
  params: Record<string, unknown>
): Promise<void> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return;
  const me = await getUser(email);
  if (me?.role === "supervisor" && me.stationId) {
    params.stationId = me.stationId;
  }
}

/**
 * Fetch the total number of pages of users matching the filters.
 */
export async function fetchUsersPages(
  query: string,
  startDate: string,
  endDate: string,
  role: string | null,
  showArchived: boolean = false
): Promise<number> {
  const params: Record<string, unknown> = {
    queryParam: `%${query}%`,
    startDate,
    endDate,
    showArchived,
  };
  await injectSupervisorFilter(params);

  const statusFilter = showArchived
    ? "u.status = 'archived'"
    : "(u.status IS NULL OR u.status = '')";

  const whereClauses = [
    `(
      u.name LIKE @queryParam OR
      u.email LIKE @queryParam
    )`,
    statusFilter,
  ];

  if (startDate && endDate) {
    whereClauses.push("u.createdAt BETWEEN @startDate AND @endDate");
  }
  if (role) {
    whereClauses.push("u.role = @role");
    params.role = role;
  }
  if (params.stationId) {
    whereClauses.push("u.stationId = @stationId");
  }

  const sql = `
    SELECT COUNT(*) AS total
    FROM [User] u
    LEFT JOIN shifts s ON u.shiftId = s.id
    LEFT JOIN stations st ON u.stationId = st.id
    LEFT JOIN counters c ON u.counterId = c.id
    WHERE ${whereClauses.join(" AND ")}
  `;
  const { recordset } = await safeQuery<{ total: number }>(sql, params);
  const total = recordset[0]?.total ?? 0;
  return Math.ceil(total / ITEMS_PER_PAGE);
}

/**
 * Fetch a page of users matching the filters.
 */
export async function fetchFilteredUsers(
  query: string,
  startDate: string,
  endDate: string,
  role: string | null,
  currentPage: number,
  showArchived: boolean = false
): Promise<User[]> {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const params: Record<string, unknown> = {
    queryParam: `%${query}%`,
    startDate,
    endDate,
    showArchived,
    limit: ITEMS_PER_PAGE,
    offset,
  };
  await injectSupervisorFilter(params);

  const statusFilter = showArchived
    ? "u.status = 'archived'"
    : "(u.status IS NULL OR u.status = '')";

  const whereClauses = [
    `(
      u.name LIKE @queryParam OR
      u.email LIKE @queryParam
    )`,
    statusFilter,
  ];

  if (startDate && endDate) {
    whereClauses.push("u.createdAt BETWEEN @startDate AND @endDate");
  }

  // Only add the clause AND declare the param when `role` is provided
  if (role) {
    whereClauses.push("u.role = @role");
    params.role = role;
  }

  // injectSupervisorFilter may set params.stationId
  if (params.stationId) {
    whereClauses.push("u.stationId = @stationId");
  }

  const whereSql = whereClauses.length
    ? `WHERE ${whereClauses.join(" AND ")}`
    : "";

  const sql = `
    WITH ordered AS (
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.status,
        u.image,
        s.name AS shift,
        st.name AS station,
        c.name AS counter,
        u.createdAt,
        ROW_NUMBER() OVER (ORDER BY u.createdAt ASC, u.id ASC) AS rn
      FROM [User] u
      LEFT JOIN shifts s ON u.shiftId = s.id
      LEFT JOIN stations st ON u.stationId = st.id
      LEFT JOIN counters c ON u.counterId = c.id
      ${whereSql}
    )
    SELECT
      id,
      name,
      email,
      role,
      status,
      image,
      shift,
      station,
      counter,
      createdAt
    FROM ordered
    WHERE rn BETWEEN (@offset + 1) AND (@offset + @limit)
    ORDER BY rn;
  `;

  const { recordset } = await safeQuery<User>(sql, params);
  return recordset;
}
