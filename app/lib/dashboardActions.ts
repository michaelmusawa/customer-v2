// app/lib/dashboardActions.ts
"use server";

import pool from "./db";
import { auth } from "@/auth";
import { getUser } from "./loginActions";

type BaseFilters = {
  startDate?: string;
  endDate?: string;
  station?: string;
  userId?: number;
};

/**
 * Builds a SQL WHERE clause from provided filters, pushing any
 * parameters into `params` in order.
 */
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

/**
 * Reads the current session, looks up the user record, and
 * injects either station or userId into the base filters
 * depending on role.
 */
async function injectRoleFilters(base: BaseFilters): Promise<BaseFilters> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return base;

  const me = await getUser(email);
  if (!me) return base;

  if (me.role === "supervisor") {
    // constrain to my station
    return { ...base, station: me.station };
  }

  if (me.role === "biller") {
    // only my own records
    return { ...base, userId: me.id };
  }

  // admins/others
  return base;
}

export type DashboardSummary = {
  totalRecords: number;
  totalValue: number;
  totalClients: number;
  errorRate: number;
};

/**
 * Overall summary: count, sum, distinct clients, error rate.
 */
export async function fetchSummaryStats(
  startDate?: string,
  endDate?: string,
  station?: string
): Promise<DashboardSummary> {
  let filters: BaseFilters = { startDate, endDate, station };
  filters = await injectRoleFilters(filters);

  const params: (string | number)[] = [];
  const where = buildWhereClause(filters, params);

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
        ELSE ROUND(
          (SELECT COUNT(*) FROM errors)::decimal
          / (SELECT COUNT(*) FROM base)
          * 100
        , 2)
      END::float                                         AS "errorRate"
  `;

  const { rows } = await pool.query<{
    totalRecords: number;
    totalValue: number;
    totalClients: number;
    errorRate: number;
  }>(sql, params);

  const r = rows[0]!;
  return {
    totalRecords: r.totalRecords,
    totalValue: Number(r.totalValue),
    totalClients: r.totalClients,
    errorRate: Number(r.errorRate),
  };
}

export type TimePoint = { date: string; count: number };

/**
 * Time series of record counts per day.
 */
export async function fetchTimeSeries(
  startDate?: string,
  endDate?: string,
  station?: string
): Promise<TimePoint[]> {
  let filters: BaseFilters = { startDate, endDate, station };
  filters = await injectRoleFilters(filters);

  const params: (string | number)[] = [];
  const where = buildWhereClause(filters, params);

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

/**
 * Breakdown by service name.
 */
export async function fetchServiceBreakdown(
  startDate?: string,
  endDate?: string,
  station?: string
): Promise<Breakdown[]> {
  let filters: BaseFilters = { startDate, endDate, station };
  filters = await injectRoleFilters(filters);

  const params: (string | number)[] = [];
  const where = buildWhereClause(filters, params);

  const sql = `
    SELECT
      r.service     AS name,
      COUNT(*)::int AS value
    FROM records r
    JOIN "User" u ON u.id = r."userId"
    LEFT JOIN stations st ON st.id = u."stationId"
    ${where}
    GROUP BY r.service
    ORDER BY value DESC
  `;

  return (await pool.query<{ name: string; value: number }>(sql, params)).rows;
}

export type ShiftBreakdown = { name: string; value: number };

/**
 * Distribution across shifts.
 */
export async function fetchShiftDistribution(
  startDate?: string,
  endDate?: string,
  station?: string
): Promise<ShiftBreakdown[]> {
  let filters: BaseFilters = { startDate, endDate, station };
  filters = await injectRoleFilters(filters);

  const params: (string | number)[] = [];
  const where = buildWhereClause(filters, params);

  const sql = `
    SELECT
      sh.name        AS name,
      COUNT(*)::int  AS value
    FROM records r
    JOIN "User" u  ON u.id = r."userId"
    LEFT JOIN stations st ON st.id = u."stationId"
    LEFT JOIN shifts sh   ON sh.id = u."shiftId"
    ${where}
    GROUP BY sh.name
    ORDER BY value DESC
  `;

  return (await pool.query<{ name: string; value: number }>(sql, params)).rows;
}

export type TopPerformer = {
  userId: number;
  name: string;
  count: number;
  value: number;
};

/**
 * If you’re a biller, see yourself ±2 places.
 * If you’re a supervisor, see only your station’s billers (then top 5 or ±2 around you if you’re also a biller).
 * Otherwise (e.g. admin), see top 5 global.
 */
export async function fetchTopBillers(
  startDate?: string,
  endDate?: string,
  station?: string
): Promise<TopPerformer[]> {
  // 1) Identify caller
  const session = await auth();
  const email = session?.user?.email;
  const me = email ? await getUser(email) : null;
  const role = me?.role;
  const amBiller = role === "biller";
  const amSupervisor = role === "supervisor";

  // 2) Build WHERE filters
  const params: (string | number)[] = [];
  const whereClauses: string[] = [];

  if (startDate && endDate) {
    params.push(startDate, endDate);
    whereClauses.push(
      `r."createdAt" BETWEEN $${params.length - 1} AND $${params.length}`
    );
  } else if (startDate) {
    params.push(startDate);
    whereClauses.push(`r."createdAt" >= $${params.length}`);
  } else if (endDate) {
    params.push(endDate);
    whereClauses.push(`r."createdAt" <= $${params.length}`);
  }

  // optional station‐wide filter (e.g. admin UI)
  if (station) {
    params.push(station);
    whereClauses.push(`st.name = $${params.length}`);
  }

  // supervisor: restrict to their own station
  if ((amSupervisor || amBiller) && me?.stationId != null) {
    params.push(me.stationId);
    whereClauses.push(`u."stationId" = $${params.length}`);
  }

  const where =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  // 3) Fetch the leaderboard
  const sql = `
    SELECT
      u.id         AS "userId",
      u.name       AS name,
      COUNT(*)::int           AS count,
      COALESCE(SUM(r.value),0)::bigint AS value
    FROM records r
    JOIN "User" u    ON u.id = r."userId"
    LEFT JOIN stations st ON st.id = u."stationId"
    ${where}
    GROUP BY u.id, u.name
    ORDER BY count DESC
  `;

  const { rows } = await pool.query<{
    userId: number;
    name: string;
    count: number;
    value: string;
  }>(sql, params);

  const leaderboard: TopPerformer[] = rows.map((r) => ({
    userId: r.userId,
    name: r.name,
    count: r.count,
    value: Number(r.value),
  }));

  // 4) Non‑biller users (including supervisors & admins) get top 5 by default
  if (!amBiller || !me) {
    return leaderboard.slice(0, 5);
  }

  // 5) Biller: find your position ±2
  const myIndex = leaderboard.findIndex((p) => p.userId === me.id);
  if (myIndex < 0) return leaderboard.slice(0, 5);

  const start = Math.max(0, myIndex - 2);
  const end = Math.min(leaderboard.length, myIndex + 3);
  const window = leaderboard.slice(start, end);

  // 6) If you’re at the very top, pad up to 5
  if (start === 0 && window.length < 5) {
    return leaderboard.slice(0, Math.min(5, leaderboard.length));
  }

  return window;
}
export type TopService = {
  name: string;
  count: number;
  value: number;
};

/**
 * Top services by count (and sum of value).
 */
export async function fetchTopServices(
  startDate?: string,
  endDate?: string,
  station?: string
): Promise<TopService[]> {
  let filters: BaseFilters = { startDate, endDate, station };
  filters = await injectRoleFilters(filters);

  const params: (string | number)[] = [];
  const where = buildWhereClause(filters, params);

  const sql = `
    SELECT
      r.service          AS name,
      COUNT(*)::int      AS count,
      COALESCE(SUM(r.value),0)::bigint AS value
    FROM records r
    JOIN "User" u      ON u.id = r."userId"
    LEFT JOIN stations st ON st.id = u."stationId"
    ${where}
    GROUP BY r.service
    ORDER BY count DESC
    LIMIT 5
  `;

  return (
    await pool.query<{ name: string; count: number; value: string }>(
      sql,
      params
    )
  ).rows.map((r) => ({
    name: r.name,
    count: r.count,
    value: Number(r.value),
  }));
}
