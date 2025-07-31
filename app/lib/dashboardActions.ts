// app/lib/dashboardActions.ts
"use server";

import { safeQuery } from "./db";
import { auth } from "@/auth";
import { getUser } from "./loginActions";

// Parameter bag
interface BaseFilters {
  startDate?: string;
  endDate?: string;
  station?: string;
  userId?: number;
}

/**
 * Builds a T-SQL WHERE clause using named parameters.
 */
function buildWhereClause(
  filters: BaseFilters,
  params: Record<string, unknown>
): string {
  const clauses: string[] = [];

  if (filters.startDate && filters.endDate) {
    clauses.push(`r.createdAt BETWEEN @startDate AND @endDate`);
  } else if (filters.startDate) {
    clauses.push(`r.createdAt >= @startDate`);
  } else if (filters.endDate) {
    clauses.push(`r.createdAt <= @endDate`);
  }

  if (filters.station) {
    clauses.push(`st.name = @station`);
  }

  if (filters.userId != null) {
    clauses.push(`r.userId = @userId`);
  }

  return clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
}

/**
 * Inject role-based filters into the BaseFilters.
 */
async function injectRoleFilters(base: BaseFilters): Promise<BaseFilters> {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return base;

  const me = await getUser(email);
  if (!me) return base;

  if (me.role === "supervisor") {
    return { ...base, station: me.station };
  }

  if (me.role === "biller") {
    return { ...base, userId: me.id };
  }

  return base;
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
  let filters: BaseFilters = { startDate, endDate, station };
  filters = await injectRoleFilters(filters);

  const params: Record<string, unknown> = {
    startDate: filters.startDate,
    endDate: filters.endDate,
    station: filters.station,
    userId: filters.userId,
  };

  const where = buildWhereClause(filters, params);
  const sql = `
    WITH base AS (
      SELECT r.id, r.value, r.name AS client
      FROM records r
      JOIN [User] u ON u.id = r.userId
      LEFT JOIN stations st ON st.id = u.stationId
      ${where}
    ),
    errors AS (
      SELECT DISTINCT er.recordId AS id
      FROM EditedRecord er
      WHERE er.recordId IN (SELECT id FROM base)
    )
    SELECT
      COUNT(*)        AS totalRecords,
      COALESCE(SUM(r.value),0) AS totalValue,
      COUNT(DISTINCT client) AS totalClients,
      CASE WHEN COUNT(*) = 0 THEN 0
           ELSE CAST(ROUND(CAST(COUNT(DISTINCT errors.id) AS decimal(10,2)) / COUNT(*) * 100, 2) AS float)
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
    totalValue: Number(r.totalValue),
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
  let filters: BaseFilters = { startDate, endDate, station };
  filters = await injectRoleFilters(filters);

  const params: Record<string, unknown> = {
    startDate: filters.startDate,
    endDate: filters.endDate,
    station: filters.station,
    userId: filters.userId,
  };

  const where = buildWhereClause(filters, params);
  const sql = `
    SELECT
      FORMAT(r.createdAt, 'yyyy-MM-dd') AS date,
      COUNT(*) AS count
    FROM records r
    JOIN [User] u ON u.id = r.userId
    LEFT JOIN stations st ON st.id = u.stationId
    ${where}
    GROUP BY FORMAT(r.createdAt, 'yyyy-MM-dd')
    ORDER BY date;
  `;

  const { recordset } = await safeQuery<{ date: string; count: number }>(
    sql,
    params
  );
  return recordset;
}

export type Breakdown = { name: string; value: number };

export async function fetchServiceBreakdown(
  startDate?: string,
  endDate?: string,
  station?: string
): Promise<Breakdown[]> {
  let filters: BaseFilters = { startDate, endDate, station };
  filters = await injectRoleFilters(filters);

  const params: Record<string, unknown> = {
    startDate: filters.startDate,
    endDate: filters.endDate,
    station: filters.station,
    userId: filters.userId,
  };

  const where = buildWhereClause(filters, params);
  const sql = `
    SELECT
      r.service AS name,
      COUNT(*) AS value
    FROM records r
    JOIN [User] u ON u.id = r.userId
    LEFT JOIN stations st ON st.id = u.stationId
    ${where}
    GROUP BY r.service
    ORDER BY value DESC;
  `;

  const { recordset } = await safeQuery<{ name: string; value: number }>(
    sql,
    params
  );
  return recordset;
}

export type ShiftBreakdown = { name: string; value: number };

export async function fetchShiftDistribution(
  startDate?: string,
  endDate?: string,
  station?: string
): Promise<ShiftBreakdown[]> {
  let filters: BaseFilters = { startDate, endDate, station };
  filters = await injectRoleFilters(filters);

  const params: Record<string, unknown> = {
    startDate: filters.startDate,
    endDate: filters.endDate,
    station: filters.station,
    userId: filters.userId,
  };

  const where = buildWhereClause(filters, params);
  const sql = `
    SELECT
      sh.name AS name,
      COUNT(*) AS value
    FROM records r
    JOIN [User] u ON u.id = r.userId
    LEFT JOIN stations st ON st.id = u.stationId
    LEFT JOIN shifts sh ON sh.id = u.shiftId
    ${where}
    GROUP BY sh.name
    ORDER BY value DESC;
  `;

  const { recordset } = await safeQuery<{ name: string; value: number }>(
    sql,
    params
  );
  return recordset;
}

export type TopPerformer = {
  userId: number;
  name: string;
  count: number;
  value: number;
};

export async function fetchTopBillers(
  startDate?: string,
  endDate?: string,
  station?: string
): Promise<TopPerformer[]> {
  const session = await auth();
  const email = session?.user?.email;
  const me = email ? await getUser(email) : null;
  const role = me?.role;
  const amBiller = role === "biller";
  const amSupervisor = role === "supervisor";

  let filters: BaseFilters = { startDate, endDate, station };
  if (amSupervisor || amBiller) {
    filters = { ...filters };
    if (me?.station) filters.station = me.station;
    if (amBiller && me?.id) filters.userId = me.id;
  }
  filters = await injectRoleFilters(filters);

  const params: Record<string, unknown> = {
    startDate: filters.startDate,
    endDate: filters.endDate,
    station: filters.station,
    userId: filters.userId,
  };

  const where = buildWhereClause(filters, params);
  const sql = `
    SELECT
      u.id AS userId,
      u.name,
      COUNT(*) AS count,
      COALESCE(SUM(r.value),0) AS value
    FROM records r
    JOIN [User] u ON u.id = r.userId
    LEFT JOIN stations st ON st.id = u.stationId
    ${where}
    GROUP BY u.id, u.name
    ORDER BY count DESC;
  `;

  const { recordset } = await safeQuery<{
    userId: number;
    name: string;
    count: number;
    value: number;
  }>(sql, params);
  const leaderboard = recordset;

  if (!amBiller || !me) return leaderboard.slice(0, 5);

  const myIndex = leaderboard.findIndex((p) => p.userId === me.id);
  if (myIndex < 0) return leaderboard.slice(0, 5);

  const start = Math.max(0, myIndex - 2);
  const end = Math.min(leaderboard.length, myIndex + 3);
  const window = leaderboard.slice(start, end);

  if (start === 0 && window.length < 5) {
    return leaderboard.slice(0, 5);
  }
  return window;
}

export type TopService = { name: string; count: number; value: number };

export async function fetchTopServices(
  startDate?: string,
  endDate?: string,
  station?: string
): Promise<TopService[]> {
  let filters: BaseFilters = { startDate, endDate, station };
  filters = await injectRoleFilters(filters);

  const params: Record<string, unknown> = {
    startDate: filters.startDate,
    endDate: filters.endDate,
    station: filters.station,
    userId: filters.userId,
  };

  const where = buildWhereClause(filters, params);
  const sql = `
    SELECT
      r.service AS name,
      COUNT(*) AS count,
      COALESCE(SUM(r.value),0) AS value
    FROM records r
    JOIN [User] u ON u.id = r.userId
    LEFT JOIN stations st ON st.id = u.stationId
    ${where}
    GROUP BY r.service
    ORDER BY count DESC
    OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY;
  `;

  const { recordset } = await safeQuery<{
    name: string;
    count: number;
    value: number;
  }>(sql, params);
  return recordset;
}
