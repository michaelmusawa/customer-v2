// app/lib/reportActions.ts
"use server";
// app/lib/dashboardActions.ts
import pool from "./db";

export type DashboardSummary = {
  totalRecords: number;
  totalValue: number; // sum of r.value
  totalServices: number; // distinct r.service
  errorRate: number; // % of records with edits
};

/**
 * Fetch summary metrics for the dashboard.
 * - totalRecords: count of records
 * - totalValue: sum of value
 * - totalServices: distinct count of service field
 * - errorRate: percent of records that appear in EditedRecord
 */
export async function fetchSummaryStats(
  startDate: string,
  endDate: string,
  station: string
): Promise<DashboardSummary> {
  const params: string[] = [];
  const where: string[] = [];

  // Date range filter
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

  // Station filter
  if (station) {
    params.push(station);
    where.push(`st.name = $${params.length}`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const sql = `
    WITH base AS (
      SELECT r.id, r.value, r.service
      FROM records r
      JOIN "User" u ON u.id = r."userId"
      LEFT JOIN stations st ON st.id = u."stationId"
      ${whereClause}
    ),
    errors AS (
      SELECT DISTINCT er."recordId" AS id
      FROM "EditedRecord" er
      WHERE er."recordId" IN (SELECT id FROM base)
    )
    SELECT
      (SELECT COUNT(*) FROM base)::int                AS "totalRecords",
      COALESCE((SELECT SUM(value) FROM base), 0)::bigint AS "totalValue",
      (SELECT COUNT(DISTINCT service) FROM base)::int  AS "totalServices",
      CASE
        WHEN (SELECT COUNT(*) FROM base) = 0 THEN 0
        ELSE ROUND(
          (SELECT COUNT(*) FROM errors)::decimal
          / (SELECT COUNT(*) FROM base)
          * 100
          , 2
        )
      END::float                                        AS "errorRate"
  `;

  const { rows } = await pool.query<{
    totalRecords: number;
    totalValue: number;
    totalServices: number;
    errorRate: number;
  }>(sql, params);

  const row = rows[0];
  return {
    totalRecords: row.totalRecords,
    totalValue: Number(row.totalValue),
    totalServices: row.totalServices,
    errorRate: Number(row.errorRate),
  };
}

export type TimePoint = {
  date: string; // "YYYY-MM-DD"
  count: number;
};

/**
 * Fetch number of records per day over the given date range and station.
 */
export async function fetchTimeSeries(
  startDate: string,
  endDate: string,
  station: string
): Promise<TimePoint[]> {
  const params: string[] = [];
  const where: string[] = [];

  // Date range filter
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

  // Station filter
  if (station) {
    params.push(station);
    where.push(`st.name = $${params.length}`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const sql = `
      SELECT
        to_char(date_trunc('day', r."createdAt"), 'YYYY-MM-DD') AS date,
        COUNT(*)::int AS count
      FROM records r
      JOIN "User" u ON u.id = r."userId"
      LEFT JOIN stations st ON st.id = u."stationId"
      ${whereClause}
      GROUP BY date
      ORDER BY date
    `;

  const { rows } = await pool.query<{ date: string; count: number }>(
    sql,
    params
  );

  return rows.map((r) => ({
    date: r.date,
    count: r.count,
  }));
}

export type Breakdown = {
  name: string;
  value: number;
};

/**
 * Fetch the count of records per service category over the given date range and station.
 */
export async function fetchServiceBreakdown(
  startDate: string,
  endDate: string,
  station: string
): Promise<Breakdown[]> {
  const params: string[] = [];
  const where: string[] = [];

  // Date range filter
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

  // Station filter
  if (station) {
    params.push(station);
    where.push(`st.name = $${params.length}`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const sql = `
      SELECT
        r.service     AS name,
        COUNT(*)::int AS value
      FROM records r
      JOIN "User" u ON u.id = r."userId"
      LEFT JOIN stations st ON st.id = u."stationId"
      ${whereClause}
      GROUP BY r.service
      ORDER BY value DESC
    `;

  const { rows } = await pool.query<{ name: string; value: number }>(
    sql,
    params
  );

  return rows.map((r) => ({
    name: r.name,
    value: r.value,
  }));
}

export type ShiftBreakdown = {
  name: string; // shift name
  value: number; // count of records
};

/**
 * Fetch the count of records per shift over the given date range and station.
 */
export async function fetchShiftDistribution(
  startDate: string,
  endDate: string,
  station: string
): Promise<ShiftBreakdown[]> {
  const params: string[] = [];
  const where: string[] = [];

  // Date range filter
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

  // Station filter
  if (station) {
    params.push(station);
    where.push(`st.name = $${params.length}`);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const sql = `
      SELECT
        sh.name     AS name,
        COUNT(*)::int AS value
      FROM records r
      JOIN "User" u ON u.id = r."userId"
      LEFT JOIN stations st ON st.id = u."stationId"
      LEFT JOIN shifts sh ON sh.id = u."shiftId"
      ${whereClause}
      GROUP BY sh.name
      ORDER BY value DESC
    `;

  const { rows } = await pool.query<{ name: string; value: number }>(
    sql,
    params
  );

  return rows.map((r) => ({
    name: r.name,
    value: r.value,
  }));
}

export type TopPerformer = {
  name: string;
  count: number;
  value: number;
};

/**
 * Fetch the top 5 billers by record count (and total value) over the given date range and station.
 */
export async function fetchTopBillers(
  startDate: string,
  endDate: string,
  station: string
): Promise<TopPerformer[]> {
  const params: string[] = [];
  const where: string[] = [];

  // Date range filter
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

  // Station filter
  if (station) {
    params.push(station);
    where.push(`st.name = $${params.length}`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const sql = `
      SELECT
        u.name,
        COUNT(r.*)::int          AS count,
        COALESCE(SUM(r.value),0)::bigint AS value
      FROM records r
      JOIN "User" u ON u.id = r."userId"
      LEFT JOIN stations st ON st.id = u."stationId"
      ${whereClause}
      GROUP BY u.name
      ORDER BY count DESC
      LIMIT 5
    `;

  const { rows } = await pool.query<{
    name: string;
    count: number;
    value: number;
  }>(sql, params);

  return rows.map((r) => ({
    name: r.name,
    count: r.count,
    value: r.value,
  }));
}

export type TopService = {
  name: string;
  count: number;
  value: number;
};

/**
 * Fetch the top 5 services by record count (and total value)
 * over the given date range and station.
 */
export async function fetchTopServices(
  startDate: string,
  endDate: string,
  station: string
): Promise<TopService[]> {
  const params: string[] = [];
  const where: string[] = [];

  // Date range filter
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

  // Station filter
  if (station) {
    params.push(station);
    where.push(`st.name = $${params.length}`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const sql = `
      SELECT
        r.service     AS name,
        COUNT(*)::int AS count,
        COALESCE(SUM(r.value),0)::bigint AS value
      FROM records r
      JOIN "User" u ON u.id = r."userId"
      LEFT JOIN stations st ON st.id = u."stationId"
      ${whereClause}
      GROUP BY r.service
      ORDER BY count DESC
      LIMIT 5
    `;

  const { rows } = await pool.query<{
    name: string;
    count: number;
    value: number;
  }>(sql, params);

  return rows.map((r) => ({
    name: r.name,
    count: r.count,
    value: r.value,
  }));
}
