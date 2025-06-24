"use server";

import pool from "./db";
import type { User } from "./definitions";

/**
 * Fetch the total number of pages of users matching the filters.
 */
export async function fetchUsersPages(
  query: string,
  startDate: string,
  endDate: string,
  role: string | null,
  showArchived: boolean = false // Add this parameter
): Promise<number> {
  const ITEMS_PER_PAGE = 10;
  const likeParam = `%${query}%`;
  const params: Array<string> = [likeParam];

  let countSql = `
    SELECT COUNT(*) AS total
    FROM "User" u
      LEFT JOIN shifts    s ON u."shiftId"   = s.id
      LEFT JOIN stations st ON u."stationId" = st.id
      LEFT JOIN counters c ON u."counterId" = c.id
    WHERE (
      u.name   ILIKE $1 OR
      u.email  ILIKE $1 OR
      s.name   ILIKE $1 OR
      st.name  ILIKE $1 OR
      c.name   ILIKE $1
    )
  `;

  // Archived filter
  if (showArchived) {
    countSql += ` AND u.status = 'archived'`;
  } else {
    countSql += ` AND (u.status IS NULL OR u.status = '')`;
  }

  // Date filtering
  if (startDate && endDate) {
    countSql += ` AND u."createdAt" BETWEEN $${params.length + 1} AND $${
      params.length + 2
    }`;
    params.push(startDate, endDate);
  } else if (startDate) {
    countSql += ` AND u."createdAt" >= $${params.length + 1}`;
    params.push(startDate);
  } else if (endDate) {
    countSql += ` AND u."createdAt" <= $${params.length + 1}`;
    params.push(endDate);
  }

  // Role filtering
  if (role) {
    countSql += ` AND u.role = $${params.length + 1}`;
    params.push(role);
  }

  const countRes = await pool.query(countSql, params);
  const total = parseInt(countRes.rows[0].total, 10);
  return Math.ceil(total / ITEMS_PER_PAGE);
}

/**
 * Fetch a page of users matching the filters, including their shift/station/counter names.
 */
export async function fetchFilteredUsers(
  query: string,
  startDate: string,
  endDate: string,
  role: string | null,
  currentPage: number,
  showArchived: boolean = false // Add this parameter
): Promise<User[]> {
  const ITEMS_PER_PAGE = 10;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const likeParam = `%${query}%`;
  const params: Array<string | number> = [likeParam];

  let sql = `
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
      u."createdAt"
    FROM "User" u
      LEFT JOIN shifts    s ON u."shiftId"   = s.id
      LEFT JOIN stations st ON u."stationId" = st.id
      LEFT JOIN counters c ON u."counterId" = c.id
    WHERE (
      u.name   ILIKE $1 OR
      u.email  ILIKE $1 OR
      s.name   ILIKE $1 OR
      st.name  ILIKE $1 OR
      c.name   ILIKE $1
    )
  `;

  // Archived filter
  if (showArchived) {
    sql += ` AND u.status = 'archived'`;
  } else {
    sql += ` AND (u.status IS NULL OR u.status = '')`;
  }

  // Date filtering
  if (startDate && endDate) {
    sql += ` AND u."createdAt" BETWEEN $${params.length + 1} AND $${
      params.length + 2
    }`;
    params.push(startDate, endDate);
  } else if (startDate) {
    sql += ` AND u."createdAt" >= $${params.length + 1}`;
    params.push(startDate);
  } else if (endDate) {
    sql += ` AND u."createdAt" <= $${params.length + 1}`;
    params.push(endDate);
  }

  // Role filtering
  if (role) {
    sql += ` AND u.role = $${params.length + 1}`;
    params.push(role);
  }

  // Ordering, pagination
  sql += `
    ORDER BY u."createdAt" ASC
    LIMIT $${params.length + 1}
    OFFSET $${params.length + 2}
  `;
  params.push(ITEMS_PER_PAGE, offset);

  const result = await pool.query<User>(sql, params);
  return result.rows;
}
