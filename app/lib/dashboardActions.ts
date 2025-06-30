// app/lib/dashboardActions.ts
"use server";

import pool from "./db";

type BaseFilters = {
  startDate?: string;
  endDate?: string;
  station?: string;
  userId?: number;
};

function buildWhereClause(
  filters: BaseFilters,
  params: (string | number)[]
): string {
  const clauses: string[] = [];

  if (filters.startDate && filters.endDate) {
    params.push(filters.startDate, filters.endDate);
    clauses.push(
      `r."createdAt" BETWEEN $${params.length - 1} AND $${params.length}`
    );
  } else if (filters.startDate) {
    params.push(filters.startDate);
    clauses.push(`r."createdAt" >= $${params.length}`);
  } else if (filters.endDate) {
    params.push(filters.endDate);
    clauses.push(`r."createdAt" <= $${params.length}`);
  }

  if (filters.station) {
    params.push(filters.station);
    clauses.push(`st.name = $${params.length}`);
  }

  if (filters.userId != null) {
    params.push(filters.userId);
    clauses.push(`r."userId" = $${params.length}`);
  }

  return clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
}

export type DashboardSummary = {
  totalRecords: number;
  totalValue: number;
  totalClients: number;
  errorRate: number;
};

export async function fetchSummaryStats(
  startDate: string,
  endDate: string,
  station: string,
  userId?: number
): Promise<DashboardSummary> {
  const params: (string | number)[] = [];
  const where = buildWhereClause(
    { startDate, endDate, station, userId },
    params
  );

  const sql = `
    WITH base AS (
      SELECT r.id, r.value, r.name AS client
      FROM records r
      JOIN "User" u ON u.id = r."userId"
      LEFT JOIN stations st ON st.id = u."stationId"
      ${where}
    ),
    errors AS (
      SELECT DISTINCT er."recordId" AS id
      FROM "EditedRecord" er
      WHERE er."recordId" IN (SELECT id FROM base)
    )
    SELECT
      (SELECT COUNT(*) FROM base)::int                   AS "totalRecords",
      COALESCE((SELECT SUM(value) FROM base), 0)::bigint AS "totalValue",
      (SELECT COUNT(DISTINCT client) FROM base)::int     AS "totalClients",
      CASE
        WHEN (SELECT COUNT(*) FROM base)=0 THEN 0
        ELSE ROUND((SELECT COUNT(*) FROM errors)::decimal 
               / (SELECT COUNT(*) FROM base)*100,2)
      END::float                                         AS "errorRate"
  `;

  const { rows } = await pool.query<{
    totalRecords: number;
    totalValue: number;
    totalClients: number;
    errorRate: number;
  }>(sql, params);

  const r = rows[0];
  return {
    totalRecords: r.totalRecords,
    totalValue: Number(r.totalValue),
    totalClients: r.totalClients,
    errorRate: Number(r.errorRate),
  };
}

export type TimePoint = { date: string; count: number };

export async function fetchTimeSeries(
  startDate: string,
  endDate: string,
  station: string,
  userId?: number
): Promise<TimePoint[]> {
  const params: (string | number)[] = [];
  const where = buildWhereClause(
    { startDate, endDate, station, userId },
    params
  );

  const sql = `
    SELECT
      to_char(date_trunc('day', r."createdAt"), 'YYYY-MM-DD') AS date,
      COUNT(*)::int AS count
    FROM records r
    JOIN "User" u ON u.id = r."userId"
    LEFT JOIN stations st ON st.id = u."stationId"
    ${where}
    GROUP BY date
    ORDER BY date
  `;

  const { rows } = await pool.query<{ date: string; count: number }>(
    sql,
    params
  );

  return rows.map((r) => ({ date: r.date, count: r.count }));
}

export type Breakdown = { name: string; value: number };

export async function fetchServiceBreakdown(
  startDate: string,
  endDate: string,
  station: string,
  userId?: number
): Promise<Breakdown[]> {
  const params: (string | number)[] = [];
  const where = buildWhereClause(
    { startDate, endDate, station, userId },
    params
  );

  const sql = `
    SELECT r.service AS name,
           COUNT(*)::int AS value
    FROM records r
    JOIN "User" u ON u.id = r."userId"
    LEFT JOIN stations st ON st.id = u."stationId"
    ${where}
    GROUP BY r.service
    ORDER BY value DESC
  `;

  const { rows } = await pool.query<{ name: string; value: number }>(
    sql,
    params
  );
  return rows;
}

export type ShiftBreakdown = { name: string; value: number };

export async function fetchShiftDistribution(
  startDate: string,
  endDate: string,
  station: string,
  userId?: number
): Promise<ShiftBreakdown[]> {
  const params: (string | number)[] = [];
  const where = buildWhereClause(
    { startDate, endDate, station, userId },
    params
  );

  const sql = `
    SELECT sh.name   AS name,
           COUNT(*)::int AS value
    FROM records r
    JOIN "User" u ON u.id = r."userId"
    LEFT JOIN stations st ON st.id = u."stationId"
    LEFT JOIN shifts sh ON sh.id = u."shiftId"
    ${where}
    GROUP BY sh.name
    ORDER BY value DESC
  `;

  const { rows } = await pool.query<{ name: string; value: number }>(
    sql,
    params
  );
  return rows;
}

export type TopPerformer = {
  name: string;
  count: number;
  value: number;
};

export async function fetchTopBillers(
  startDate: string,
  endDate: string,
  station: string
): Promise<TopPerformer[]> {
  const params: (string | number)[] = [];
  const where: string[] = [];

  if (startDate && endDate) {
    params.push(startDate, endDate);
    where.push(
      `r."createdAt" BETWEEN $${params.length - 1} AND $${params.length}`
    );
  } else if (startDate) {
    params.push(startDate);
    where.push(`r."createdAt" >= $${params.length}`);
  } else if (endDate) {
    params.push(endDate);
    where.push(`r."createdAt" <= $${params.length}`);
  }

  if (station) {
    params.push(station);
    where.push(`st.name = $${params.length}`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const sql = `
    SELECT
      u.name          AS name,
      COUNT(*)::int   AS count,
      COALESCE(SUM(r.value),0)::bigint AS value
    FROM records r
    JOIN "User" u    ON u.id = r."userId"
    LEFT JOIN stations st ON st.id = u."stationId"
    ${whereClause}
    GROUP BY u.name
    ORDER BY count DESC
    -- optionally: LIMIT 100
  `;

  const { rows } = await pool.query<{
    name: string;
    count: number;
    value: number;
  }>(sql, params);
  return rows.map((r) => ({
    name: r.name,
    count: r.count,
    value: Number(r.value),
  }));
}

/**
 * Given a userId, return just their name.
 */
export async function fetchUserNameById(
  userId: number
): Promise<string | null> {
  const { rows } = await pool.query<{ name: string }>(
    `SELECT name FROM "User" WHERE id = $1`,
    [userId]
  );
  return rows[0]?.name ?? null;
}

export type TopService = { name: string; count: number; value: string };

export async function fetchTopServices(
  startDate: string,
  endDate: string,
  station: string,
  userId?: number
): Promise<TopService[]> {
  const params: (string | number)[] = [];
  const where = buildWhereClause(
    { startDate, endDate, station, userId },
    params
  );

  const sql = `
    SELECT r.service AS name,
           COUNT(*)::int AS count,
           COALESCE(SUM(r.value),0)::bigint AS value
    FROM records r
    JOIN "User" u ON u.id = r."userId"
    LEFT JOIN stations st ON st.id = u."stationId"
    ${where}
    GROUP BY r.service
    ORDER BY count DESC
    LIMIT 5
  `;

  return (await pool.query(sql, params)).rows;
}
