// app/lib/dashboardActions.ts
"use server";

import { safeQuery } from "./db";
import { auth } from "@/auth";
import { getUser } from "./loginActions";

type BaseFilters = {
  startDate?: string;
  endDate?: string;
  station?: string;
  userId?: number;
};

/** Injects role-based station/userId filters */
async function injectRoleFilters(
  filters: BaseFilters,
  params: Record<string, unknown>
) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return;
  const me = await getUser(email);
  if (!me) return;
  if (me.role === "supervisor") {
    filters.station = me.station;
    params.station = me.station;
  } else if (me.role === "biller") {
    filters.userId = me.id;
    params.userId = me.id;
  }
}

/** Build WHERE clauses */
function buildWhere(
  filters: BaseFilters,
  params: Record<string, unknown>
): string {
  const clauses: string[] = [];
  if (filters.startDate && filters.endDate) {
    clauses.push("r.createdAt BETWEEN @startDate AND @endDate");
    params.startDate = filters.startDate;
    params.endDate = filters.endDate;
  } else if (filters.startDate) {
    clauses.push("r.createdAt >= @startDate");
    params.startDate = filters.startDate;
  } else if (filters.endDate) {
    clauses.push("r.createdAt <= @endDate");
    params.endDate = filters.endDate;
  }
  if (filters.station) clauses.push("st.name = @station");
  if (filters.userId != null) clauses.push("r.userId = @userId");
  return clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
}

export type DashboardSummary = {
  totalRecords: number;
  totalValue: number;
  totalClients: number;
  errorRate: number;
};

export async function fetchSummaryStats(
  startDate?: string,
  endDate?: string,
  station?: string
): Promise<DashboardSummary> {
  const filters: BaseFilters = { startDate, endDate, station };
  const params: Record<string, unknown> = {};
  await injectRoleFilters(filters, params);
  const whereSql = buildWhere(filters, params);

  const sql = `
    WITH base AS (
      SELECT r.id, r.value, r.name AS client
      FROM records r
      JOIN [User] u ON u.id = r.userId
      LEFT JOIN stations st ON st.id = u.stationId
      ${whereSql}
    ),
    errors AS (
      SELECT DISTINCT er.recordId AS id
      FROM EditedRecord er
      WHERE er.recordId IN (SELECT id FROM base)
    )
    SELECT
      COUNT(*) AS totalRecords,
      COALESCE(SUM(value),0) AS totalValue,
      COUNT(DISTINCT client) AS totalClients,
      CASE WHEN COUNT(*)=0 THEN 0 ELSE
        ROUND(CAST(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM base),0) AS decimal(5,2)),2)
      END AS errorRate
    FROM base b
    LEFT JOIN errors e ON e.id = b.id;
  `;

  const { recordset } = await safeQuery<{
    totalRecords: number;
    totalValue: number;
    totalClients: number;
    errorRate: number;
  }>(sql, params);
  const r = recordset[0]!;
  return {
    totalRecords: r.totalRecords,
    totalValue: r.totalValue,
    totalClients: r.totalClients,
    errorRate: r.errorRate,
  };
}

export type TimePoint = { date: string; count: number };
export async function fetchTimeSeries(
  startDate?: string,
  endDate?: string,
  station?: string
): Promise<TimePoint[]> {
  const filters: BaseFilters = { startDate, endDate, station };
  const params: Record<string, unknown> = {};
  await injectRoleFilters(filters, params);
  const whereSql = buildWhere(filters, params);

  const sql = `
    SELECT
      FORMAT(r.createdAt, 'yyyy-MM-dd') AS date,
      COUNT(*) AS count
    FROM records r
    JOIN [User] u ON u.id = r.userId
    LEFT JOIN stations st ON st.id = u.stationId
    ${whereSql}
    GROUP BY FORMAT(r.createdAt,'yyyy-MM-dd')
    ORDER BY date;
  `;
  const { recordset } = await safeQuery<TimePoint>(sql, params);
  return recordset;
}

export type Breakdown = { name: string; value: number };
export async function fetchServiceBreakdown(
  startDate?: string,
  endDate?: string,
  station?: string
): Promise<Breakdown[]> {
  const filters: BaseFilters = { startDate, endDate, station };
  const params: Record<string, unknown> = {};
  await injectRoleFilters(filters, params);
  const whereSql = buildWhere(filters, params);

  const sql = `
    SELECT
      r.service AS name,
      COUNT(*) AS value
    FROM records r
    JOIN [User] u ON u.id = r.userId
    LEFT JOIN stations st ON st.id = u.stationId
    ${whereSql}
    GROUP BY r.service
    ORDER BY value DESC;
  `;
  const { recordset } = await safeQuery<Breakdown>(sql, params);
  return recordset;
}

export type ShiftBreakdown = { name: string; value: number };
export async function fetchShiftDistribution(
  startDate?: string,
  endDate?: string,
  station?: string
): Promise<ShiftBreakdown[]> {
  const filters: BaseFilters = { startDate, endDate, station };
  const params: Record<string, unknown> = {};
  await injectRoleFilters(filters, params);
  const whereSql = buildWhere(filters, params);

  const sql = `
    SELECT
      sh.name AS name,
      COUNT(*) AS value
    FROM records r
    JOIN [User] u ON u.id = r.userId
    LEFT JOIN stations st ON st.id = u.stationId
    LEFT JOIN shifts sh ON sh.id = u.shiftId
    ${whereSql}
    GROUP BY sh.name
    ORDER BY value DESC;
  `;
  const { recordset } = await safeQuery<ShiftBreakdown>(sql, params);
  return recordset;
}

export type TopPerformer = {
  userId: number;
  name: string;
  count: number;
  value: number;
};

/**
 * Fetch top billers, scoped by role.
 */
export async function fetchTopBillers(
  startDate?: string,
  endDate?: string,
  station?: string
): Promise<TopPerformer[]> {
  const session = await auth();
  const email = session?.user?.email;
  const me = email ? await getUser(email) : null;
  const role = me?.role;

  const params: Record<string, unknown> = { startDate, endDate, station };
  const clauses: string[] = [];
  if (startDate && endDate)
    clauses.push("r.createdAt BETWEEN @startDate AND @endDate");
  if (station) clauses.push("st.name = @station");
  if (role === "supervisor" || role === "biller") {
    if (me?.stationId) {
      clauses.push("u.stationId = @stationId");
      params.stationId = me.stationId;
    }
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const sql = `
    SELECT
      u.id AS userId,
      u.name AS name,
      COUNT(*) AS count,
      COALESCE(SUM(r.value),0) AS value
    FROM records r
    JOIN [User] u ON u.id = r.userId
    LEFT JOIN stations st ON st.id = u.stationId
    ${where}
    GROUP BY u.id, u.name
    ORDER BY count DESC;
  `;
  const { recordset } = await safeQuery<TopPerformer>(sql, params);
  const leaderboard = recordset;

  // Non-billers see top 5
  if (role !== "biller" || !me) {
    return leaderboard.slice(0, 5);
  }
  // Biller sees ±2 around themselves
  const idx = leaderboard.findIndex((p) => p.userId === me.id);
  if (idx < 0) return leaderboard.slice(0, 5);
  const start = Math.max(0, idx - 2);
  const end = Math.min(leaderboard.length, idx + 3);
  const slice = leaderboard.slice(start, end);
  if (start === 0 && slice.length < 5)
    return leaderboard.slice(0, Math.min(5, leaderboard.length));
  return slice;
}

export type TopService = { name: string; count: number; value: number };

/**
 * Fetch top services.
 */
export async function fetchTopServices(
  startDate?: string,
  endDate?: string,
  station?: string
): Promise<TopService[]> {
  const filters: BaseFilters = { startDate, endDate, station };
  const params: Record<string, unknown> = {};
  await injectRoleFilters(filters, params);
  const whereSql = buildWhere(filters, params);

  const sql = `
    SELECT
      r.service AS name,
      COUNT(*) AS count,
      COALESCE(SUM(r.value),0) AS value
    FROM records r
    JOIN [User] u ON u.id = r.userId
    LEFT JOIN stations st ON st.id = u.stationId
    ${whereSql}
    GROUP BY r.service
    ORDER BY count DESC
    OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY;
  `;
  const { recordset } = await safeQuery<TopService>(sql, params);
  return recordset;
}
