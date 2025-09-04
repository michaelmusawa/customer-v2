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
  recordType?: "invoice" | "receipt";
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
      `r.createdAt BETWEEN @p${params.length - 1} AND @p${params.length}`
    );
  } else if (filters.startDate) {
    params.push(filters.startDate);
    clauses.push(`r.createdAt >= @p${params.length}`);
  } else if (filters.endDate) {
    params.push(filters.endDate);
    clauses.push(`r.createdAt <= @p${params.length}`);
  }

  if (filters.station) {
    params.push(filters.station);
    clauses.push(`st.name = @p${params.length}`);
  }

  if (filters.userId != null) {
    params.push(filters.userId);
    clauses.push(`r.userId = @p${params.length}`);
  }

  if (filters.recordType) {
    params.push(filters.recordType);
    clauses.push(`r.recordType = @p${params.length}`);
  }

  return clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
}

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
  station?: string,
  recordType?: "invoice" | "receipt"
): Promise<DashboardSummary> {
  let filters: BaseFilters = { startDate, endDate, station, recordType };
  filters = await injectRoleFilters(filters);

  const params: (string | number)[] = [];
  const where = buildWhereClause(filters, params);

  const sql = `
    WITH base AS (
      SELECT r.id, r.value, r.recordType, r.name AS client
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
      CAST((SELECT COUNT(*) FROM base) AS INT) AS totalRecords,
      CAST(COALESCE((SELECT SUM(value) FROM base), 0) AS BIGINT) AS totalValue,
      CAST((SELECT COUNT(DISTINCT client) FROM base) AS INT) AS totalClients,
      CASE
        WHEN (SELECT COUNT(*) FROM base)=0 THEN 0
        ELSE CAST(ROUND(
          CAST((SELECT COUNT(*) FROM errors) AS DECIMAL) /
          CAST((SELECT COUNT(*) FROM base) AS DECIMAL) * 100, 2
        ) AS FLOAT)
      END AS errorRate
  `;

  const { rows } = await safeQuery<DashboardSummary>(sql, params);
  const r = rows[0]!;
  return {
    totalRecords: r.totalRecords,
    totalValue: Number(r.totalValue),
    totalClients: r.totalClients,
    errorRate: Number(r.errorRate),
  };
}

export type TimePoint = { date: string; count: number };

export async function fetchTimeSeries(
  startDate?: string,
  endDate?: string,
  station?: string,
  recordType?: "invoice" | "receipt"
): Promise<TimePoint[]> {
  let filters: BaseFilters = { startDate, endDate, station, recordType };
  filters = await injectRoleFilters(filters);

  const params: (string | number)[] = [];
  const where = buildWhereClause(filters, params);

  const sql = `
    SELECT
      CONVERT(VARCHAR(10), r.createdAt, 23) AS date, -- yyyy-MM-dd
      CAST(COUNT(*) AS INT) AS count, r.recordType
    FROM records r
    JOIN [User] u ON u.id = r.userId
    LEFT JOIN stations st ON st.id = u.stationId
    ${where}
    GROUP BY CONVERT(VARCHAR(10), r.createdAt, 23), r.recordType
    ORDER BY date
  `;

  const { rows } = await safeQuery<TimePoint>(sql, params);
  return rows;
}

export type Breakdown = { name: string; value: number };

export async function fetchServiceBreakdown(
  startDate?: string,
  endDate?: string,
  station?: string,
  recordType?: "invoice" | "receipt"
): Promise<Breakdown[]> {
  let filters: BaseFilters = { startDate, endDate, station, recordType };
  filters = await injectRoleFilters(filters);

  const params: (string | number)[] = [];
  const where = buildWhereClause(filters, params);

  const sql = `
    SELECT
      r.service AS name,
      CAST(COUNT(*) AS INT) AS value,
      r.recordType
    FROM records r
    JOIN [User] u ON u.id = r.userId
    LEFT JOIN stations st ON st.id = u.stationId
    ${where}
    GROUP BY r.service,
    r.recordType
    ORDER BY value DESC
  `;

  const { rows } = await safeQuery<Breakdown>(sql, params);
  return rows;
}

export type ShiftBreakdown = { name: string; value: number };

export async function fetchShiftDistribution(
  startDate?: string,
  endDate?: string,
  station?: string,
  recordType?: "invoice" | "receipt"
): Promise<ShiftBreakdown[]> {
  let filters: BaseFilters = { startDate, endDate, station, recordType };
  filters = await injectRoleFilters(filters);

  const params: (string | number)[] = [];
  const where = buildWhereClause(filters, params);

  const sql = `
    SELECT
      sh.name AS name,
      CAST(COUNT(*) AS INT) AS value,
      r.recordType
    FROM records r
    JOIN [User] u ON u.id = r.userId
    LEFT JOIN stations st ON st.id = u.stationId
    LEFT JOIN shifts sh ON sh.id = u.shiftId
    ${where}
    GROUP BY sh.name, r.recordType
    ORDER BY value DESC
  `;

  const { rows } = await safeQuery<ShiftBreakdown>(sql, params);
  return rows;
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
  station?: string,
  recordType?: "invoice" | "receipt"
): Promise<TopPerformer[]> {
  console.log("Fetching top billers...", recordType);

  const session = await auth();
  const email = session?.user?.email;
  const me = email ? await getUser(email) : null;
  const role = me?.role;
  const amBiller = role === "biller";
  const amSupervisor = role === "supervisor";

  const params: (string | number)[] = [];
  const whereClauses: string[] = [];

  if (startDate && endDate) {
    params.push(startDate, endDate);
    whereClauses.push(
      `r.createdAt BETWEEN @p${params.length - 1} AND @p${params.length}`
    );
  } else if (startDate) {
    params.push(startDate);
    whereClauses.push(`r.createdAt >= @p${params.length}`);
  } else if (endDate) {
    params.push(endDate);
    whereClauses.push(`r.createdAt <= @p${params.length}`);
  }

  if (station) {
    params.push(station);
    whereClauses.push(`st.name = @p${params.length}`);
  }

  if (recordType) {
    params.push(recordType);
    whereClauses.push(`r.RecordType = @p${params.length}`);
  }

  if ((amSupervisor || amBiller) && me?.stationId != null) {
    params.push(me.stationId);
    whereClauses.push(`u.stationId = @p${params.length}`);
  }

  const where =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const sql = `
    SELECT
      u.id AS userId,
      u.name AS name,
      r.recordType,
      CAST(COUNT(*) AS INT) AS count,
      CAST(COALESCE(SUM(r.value),0) AS BIGINT) AS value
    FROM records r
    JOIN [User] u ON u.id = r.userId
    LEFT JOIN stations st ON st.id = u.stationId
    ${where}
    GROUP BY u.id, u.name, r.recordType
    ORDER BY count DESC
  `;

  const { rows } = await safeQuery<{
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

  if (!amBiller || !me) {
    return leaderboard.slice(0, 5);
  }

  const myIndex = leaderboard.findIndex((p) => p.userId === me.id);
  if (myIndex < 0) return leaderboard.slice(0, 5);

  const start = Math.max(0, myIndex - 2);
  const end = Math.min(leaderboard.length, myIndex + 3);
  const window = leaderboard.slice(start, end);

  if (start === 0 && window.length < 5) {
    return leaderboard.slice(0, Math.min(5, leaderboard.length));
  }

  return window;
}

export type TopService = { name: string; count: number; value: number };

export async function fetchTopServices(
  startDate?: string,
  endDate?: string,
  station?: string,
  recordType?: "invoice" | "receipt"
): Promise<TopService[]> {
  let filters: BaseFilters = { startDate, endDate, station, recordType };
  filters = await injectRoleFilters(filters);

  const params: (string | number)[] = [];
  const where = buildWhereClause(filters, params);

  const sql = `
    SELECT TOP 5
      r.service AS name,
      CAST(COUNT(*) AS INT) AS count,
      CAST(COALESCE(SUM(r.value),0) AS BIGINT) AS value,
      r.recordType
    FROM records r
    JOIN [User] u ON u.id = r.userId
    LEFT JOIN stations st ON st.id = u.stationId
    ${where}
    GROUP BY r.service, r.recordType
    ORDER BY count DESC
  `;

  const { rows } = await safeQuery<{
    name: string;
    count: number;
    value: string;
  }>(sql, params);
  return rows.map((r) => ({
    name: r.name,
    count: r.count,
    value: Number(r.value),
  }));
}
