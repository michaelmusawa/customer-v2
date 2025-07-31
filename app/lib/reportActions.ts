// app/lib/reportActions.ts
"use server";

import { safeQuery } from "./db";

export async function fetchSummaryStats(
  startDate?: string,
  endDate?: string,
  station?: string
): Promise<{
  totalRecords: number;
  totalValue: number;
  totalServices: number;
  totalClients: number;
}> {
  const params: Record<string, unknown> = { startDate, endDate, station };

  const whereClauses: string[] = [];
  if (startDate && endDate) {
    whereClauses.push("r.createdAt BETWEEN @startDate AND @endDate");
  } else if (startDate) {
    whereClauses.push("r.createdAt >= @startDate");
  } else if (endDate) {
    whereClauses.push("r.createdAt <= @endDate");
  }
  if (station) {
    whereClauses.push("st.name = @station");
  }
  const whereSql = whereClauses.length
    ? `WHERE ${whereClauses.join(" AND ")}`
    : "";

  const sql = `
    SELECT
      CAST(COUNT(*) AS int) AS totalRecords,
      COALESCE(SUM(r.value),0) AS totalValue,
      CAST(COUNT(DISTINCT r.service) AS int) AS totalServices,
      CAST(COUNT(DISTINCT r.name) AS int) AS totalClients
    FROM records r
    JOIN [User] u ON u.id = r.userId
    LEFT JOIN stations st ON st.id = u.stationId
    ${whereSql};
  `;

  const { recordset } = await safeQuery<{
    totalRecords: number;
    totalValue: number;
    totalServices: number;
    totalClients: number;
  }>(sql, params);
  const r = recordset[0]!;
  return {
    totalRecords: r.totalRecords,
    totalValue: r.totalValue,
    totalServices: r.totalServices,
    totalClients: r.totalClients,
  };
}

export type RankingDataItem = {
  key: string;
  count: number;
  clients: number;
  value: number;
};
export type ShiftRankingSection = {
  shift: string;
  items: RankingDataItem[];
};

export async function fetchRankingData(
  startDate?: string,
  endDate?: string,
  station?: string,
  rankBy?: string,
  groupBy?: boolean
): Promise<RankingDataItem[] | ShiftRankingSection[]> {
  const params: Record<string, unknown> = { startDate, endDate, station };
  const metric = rankBy ? "SUM(r.value)" : "COUNT(*)";

  const filters: string[] = [];
  if (startDate && endDate)
    filters.push("r.createdAt BETWEEN @startDate AND @endDate");
  if (station) filters.push("st.name = @station");
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  if (groupBy) {
    // per shift
    const shiftSql = `SELECT name AS shift FROM shifts ORDER BY name`;
    const { recordset: shifts } = await safeQuery<{ shift: string }>(
      shiftSql,
      {}
    );
    const sections: ShiftRankingSection[] = [];
    for (const { shift } of shifts) {
      const sql = `
        SELECT
          u.name AS key,
          COUNT(*) AS count,
          COUNT(DISTINCT r.name) AS clients,
          COALESCE(SUM(r.value),0) AS value
        FROM records r
        JOIN [User] u ON r.userId = u.id
        JOIN shifts sh ON u.shiftId = sh.id
        JOIN stations st ON u.stationId = st.id
        ${where} AND sh.name = @shift
        GROUP BY u.name
        ORDER BY ${metric} DESC;
      `;
      const { recordset } = await safeQuery<RankingDataItem>(sql, {
        ...params,
        shift,
      });
      sections.push({ shift, items: recordset });
    }
    return sections;
  } else {
    const sql = `
      SELECT
        u.name AS key,
        COUNT(*) AS count,
        COUNT(DISTINCT r.name) AS clients,
        COALESCE(SUM(r.value),0) AS value
      FROM records r
      JOIN [User] u ON r.userId = u.id
      JOIN stations st ON u.stationId = st.id
      ${where}
      GROUP BY u.name
      ORDER BY ${metric} DESC;
    `;
    const { recordset } = await safeQuery<RankingDataItem>(sql, params);
    return recordset;
  }
}

export type ServiceRankingItem = {
  service: string;
  count: number;
  clients: number;
  value: number;
};
export type ShiftServiceSection = {
  shift: string;
  items: ServiceRankingItem[];
};

export async function fetchServiceRankingData(
  startDate?: string,
  endDate?: string,
  station?: string,
  rankBy?: string,
  groupByShiftFlag?: boolean
): Promise<ServiceRankingItem[] | ShiftServiceSection[]> {
  const params: Record<string, unknown> = { startDate, endDate, station };
  const metric = rankBy ? "SUM(r.value)" : "COUNT(*)";
  const filters: string[] = [];
  if (startDate && endDate)
    filters.push("r.createdAt BETWEEN @startDate AND @endDate");
  if (station) filters.push("st.name = @station");
  const whereSql = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  if (groupByShiftFlag) {
    const shiftSql = `SELECT name AS shift FROM shifts ORDER BY name`;
    const { recordset: shifts } = await safeQuery<{ shift: string }>(
      shiftSql,
      {}
    );
    const sections: ShiftServiceSection[] = [];
    for (const { shift } of shifts) {
      const sql = `
        SELECT
          r.service AS service,
          COUNT(*) AS count,
          COUNT(DISTINCT r.name) AS clients,
          COALESCE(SUM(r.value),0) AS value
        FROM records r
        JOIN [User] u ON r.userId = u.id
        JOIN shifts sh ON u.shiftId = sh.id
        JOIN stations st ON u.stationId = st.id
        ${whereSql} AND sh.name = @shift
        GROUP BY r.service
        ORDER BY ${metric} DESC;
      `;
      const { recordset } = await safeQuery<ServiceRankingItem>(sql, {
        ...params,
        shift,
      });
      sections.push({ shift, items: recordset });
    }
    return sections;
  } else {
    const sql = `
      SELECT
        r.service AS service,
        COUNT(*) AS count,
        COUNT(DISTINCT r.name) AS clients,
        COALESCE(SUM(r.value),0) AS value
      FROM records r
      JOIN [User] u ON r.userId = u.id
      JOIN stations st ON u.stationId = st.id
      ${whereSql}
      GROUP BY r.service
      ORDER BY ${metric} DESC;
    `;
    const { recordset } = await safeQuery<ServiceRankingItem>(sql, params);
    return recordset;
  }
}

export type ShiftSummaryItem = {
  shift: string;
  count: number;
  clients: number;
  value: number;
};

export async function fetchShiftSummaryData(
  startDate?: string,
  endDate?: string,
  station?: string
): Promise<ShiftSummaryItem[]> {
  const params: Record<string, unknown> = { startDate, endDate, station };
  const whereClauses: string[] = [];
  if (startDate && endDate)
    whereClauses.push("r.createdAt BETWEEN @startDate AND @endDate");
  else if (startDate) whereClauses.push("r.createdAt >= @startDate");
  else if (endDate) whereClauses.push("r.createdAt <= @endDate");
  if (station) whereClauses.push("st.name = @station");
  const whereSql = whereClauses.length
    ? `WHERE ${whereClauses.join(" AND ")}`
    : "";

  const sql = `
    SELECT
      sh.name AS shift,
      COUNT(*) AS count,
      COUNT(DISTINCT r.name) AS clients,
      COALESCE(SUM(r.value),0) AS value
    FROM records r
    JOIN [User] u ON r.userId = u.id
    JOIN shifts sh ON u.shiftId = sh.id
    JOIN stations st ON u.stationId = st.id
    ${whereSql}
    GROUP BY sh.name
    ORDER BY sh.name;
  `;

  const { recordset } = await safeQuery<ShiftSummaryItem>(sql, params);
  return recordset.map((r) => ({
    shift: r.shift,
    count: r.count,
    clients: r.clients,
    value: r.value,
  }));
}
