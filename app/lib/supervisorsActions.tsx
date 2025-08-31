"use server";

import { auth } from "@/auth";
import { safeQuery } from "./db";
import type { User } from "./definitions";
import { getUser } from "./loginActions";

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
  const ITEMS_PER_PAGE = 10;
  const likeParam = `%${query}%`;
  const params: Array<string> = [likeParam];

  let countSql = `
    SELECT COUNT(*) AS total
    FROM [User] u
      LEFT JOIN shifts    s ON u.shiftId   = s.id
      LEFT JOIN stations st ON u.stationId = st.id
      LEFT JOIN counters c  ON u.counterId = c.id
    WHERE (
      u.name   LIKE $1 OR
      u.email  LIKE $1 OR
      s.name   LIKE $1 OR
      st.name  LIKE $1 OR
      c.name   LIKE $1
    )
  `;

  if (showArchived) {
    countSql += ` AND u.status = 'archived'`;
  } else {
    countSql += ` AND (u.status IS NULL OR u.status = '')`;
  }

  if (startDate && endDate) {
    countSql += ` AND u.createdAt BETWEEN $${params.length + 1} AND $${
      params.length + 2
    }`;
    params.push(startDate, endDate);
  } else if (startDate) {
    countSql += ` AND u.createdAt >= $${params.length + 1}`;
    params.push(startDate);
  } else if (endDate) {
    countSql += ` AND u.createdAt <= $${params.length + 1}`;
    params.push(endDate);
  }

  const session = await auth();
  const userEmail = session?.user?.email || "";
  const user = await getUser(userEmail);
  const userRole = user?.role || "";

  if (userRole === "supervisor" && user) {
    countSql += ` AND u.stationId = $${params.length + 1}`;
    params.push(`${user.stationId}`);
  }

  if (role) {
    countSql += ` AND u.role = $${params.length + 1}`;
    params.push(role);
  }

  const countRes = await safeQuery<{ total: number }>(countSql, params);
  const total = parseInt(countRes.rows[0]?.total.toString() || "0", 10);
  return Math.ceil(total / ITEMS_PER_PAGE);
}

/**
 * Compatible pagination using ROW_NUMBER() for older MSSQL
 */
export async function fetchFilteredUsers(
  query: string,
  startDate: string,
  endDate: string,
  role: string | null,
  currentPage: number,
  showArchived: boolean = false
): Promise<User[]> {
  const ITEMS_PER_PAGE = 10;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const likeParam = `%${query}%`;
  const params: Array<string | number> = [likeParam];

  // Inner query assigns row numbers for manual pagination
  let sql = `
    WITH UserResults AS (
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.status,
        u.image,
        s.name   AS shift,
        st.name  AS station,
        c.name   AS counter,
        u.createdAt,
        ROW_NUMBER() OVER (ORDER BY u.createdAt ASC) AS RowNum
      FROM [User] u
        LEFT JOIN shifts    s ON u.shiftId   = s.id
        LEFT JOIN stations st ON u.stationId = st.id
        LEFT JOIN counters c  ON u.counterId = c.id
      WHERE (
        u.name   LIKE $1 OR
        u.email  LIKE $1 OR
        s.name   LIKE $1 OR
        st.name  LIKE $1 OR
        c.name   LIKE $1
      )
  `;

  if (showArchived) {
    sql += ` AND u.status = 'archived'`;
  } else {
    sql += ` AND (u.status IS NULL OR u.status = '')`;
  }

  if (startDate && endDate) {
    sql += ` AND u.createdAt BETWEEN $${params.length + 1} AND $${
      params.length + 2
    }`;
    params.push(startDate, endDate);
  } else if (startDate) {
    sql += ` AND u.createdAt >= $${params.length + 1}`;
    params.push(startDate);
  } else if (endDate) {
    sql += ` AND u.createdAt <= $${params.length + 1}`;
    params.push(endDate);
  }

  if (role) {
    sql += ` AND u.role = $${params.length + 1}`;
    params.push(role);
  }

  const session = await auth();
  const userEmail = session?.user?.email || "";
  const user = await getUser(userEmail);
  const userRole = user?.role || "";

  if (userRole === "supervisor" && user) {
    sql += ` AND u.stationId = $${params.length + 1}`;
    params.push(`${user.stationId}`);
  }

  sql += ` )
    SELECT *
    FROM UserResults
    WHERE RowNum BETWEEN $${params.length + 1} AND $${params.length + 2}
    ORDER BY RowNum
  `;

  // Add pagination bounds
  params.push(offset + 1, offset + ITEMS_PER_PAGE);

  const result = await safeQuery<User>(sql, params);
  return result.rows;
}
