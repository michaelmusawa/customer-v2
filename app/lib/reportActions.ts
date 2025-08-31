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
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (startDate && endDate) {
    clauses.push(
      `r.createdAt BETWEEN $${params.length + 1} AND $${params.length + 2}`
    );
    params.push(startDate, endDate);
  } else if (startDate) {
    clauses.push(`r.createdAt >= $${params.length + 1}`);
    params.push(startDate);
  } else if (endDate) {
    clauses.push(`r.createdAt <= $${params.length + 1}`);
    params.push(endDate);
  }

  if (station) {
    clauses.push(`st.[name] = $${params.length + 1}`);
    params.push(station);
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const sql = `
    SELECT
      CAST(COUNT(*) AS int)                        AS totalRecords,
      CAST(COALESCE(SUM(r.[value]),0) AS int)      AS totalValue,
      CAST(COUNT(DISTINCT r.service) AS int)       AS totalServices,
      CAST(COUNT(DISTINCT r.[name]) AS int)        AS totalClients
    FROM records r
    JOIN [User] u ON u.id = r.userId
    LEFT JOIN stations st ON u.stationId = st.id
    ${whereSql};
  `;

  const { rows } = await safeQuery(sql, params);
  return rows[0] as {
    totalRecords: number;
    totalValue: number;
    totalServices: number;
    totalClients: number;
  };
}

export async function fetchRankingData(
  startDate?: string,
  endDate?: string,
  station?: string,
  rankBy?: string,
  groupBy?: boolean
): Promise<RankingDataItem[] | ShiftRankingSection[]> {
  const metric = rankBy ? `SUM(r.[value])` : `COUNT(*)`;

  const filters: string[] = [];
  const params: (string | number)[] = [];

  if (startDate && endDate) {
    filters.push(
      `r.createdAt BETWEEN $${params.length + 1} AND $${params.length + 2}`
    );
    params.push(startDate, endDate);
  }
  if (station) {
    filters.push(`st.[name] = $${params.length + 1}`);
    params.push(station);
  }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  if (groupBy) {
    const { rows: shifts } = await safeQuery<{ shift: string }>(
      `SELECT [name] AS shift FROM shifts ORDER BY [name]`
    );

    const sections: ShiftRankingSection[] = [];
    for (const { shift } of shifts) {
      const sql = `
        SELECT
          u.[name]                 AS [key],
          COUNT(*)                 AS count,
          COUNT(DISTINCT r.[name]) AS clients,
          COALESCE(SUM(r.[value]),0) AS [value]
        FROM records r
        JOIN [User] u    ON r.userId = u.id
        JOIN shifts sh   ON u.shiftId = sh.id
        JOIN stations st ON u.stationId = st.id
        ${where} AND sh.[name] = $${params.length + 1}
        GROUP BY u.[name]
        ORDER BY ${metric} DESC
      `;
      const { rows } = await safeQuery<RankingDataItem>(sql, [
        ...params,
        shift,
      ]);
      sections.push({ shift, items: rows });
    }
    return sections;
  } else {
    const sql = `
      SELECT
        u.[name]                 AS [key],
        COUNT(*)                 AS count,
        COUNT(DISTINCT r.[name]) AS clients,
        COALESCE(SUM(r.[value]),0) AS [value]
      FROM records r
      JOIN [User] u    ON r.userId = u.id
      JOIN stations st ON u.stationId = st.id
      ${where}
      GROUP BY u.[name]
      ORDER BY ${metric} DESC
    `;
    const { rows } = await safeQuery<RankingDataItem>(sql, params);
    return rows;
  }
}

export async function fetchServiceRankingData(
  startDate?: string,
  endDate?: string,
  station?: string,
  rankBy?: string,
  groupByShiftFlag?: boolean
): Promise<ServiceRankingItem[] | ShiftServiceSection[]> {
  const metric = rankBy ? `SUM(r.[value])` : `COUNT(*)`;

  const filters: string[] = [];
  const params: (string | number)[] = [];

  if (startDate && endDate) {
    filters.push(
      `r.createdAt BETWEEN $${params.length + 1} AND $${params.length + 2}`
    );
    params.push(startDate, endDate);
  }
  if (station) {
    filters.push(`st.[name] = $${params.length + 1}`);
    params.push(station);
  }
  const whereSql = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  if (groupByShiftFlag) {
    const { rows: shifts } = await safeQuery<{ shift: string }>(
      `SELECT [name] AS shift FROM shifts ORDER BY [name]`
    );
    const sections: ShiftServiceSection[] = [];

    for (const { shift } of shifts) {
      const sql = `
        SELECT 
          r.service                 AS service,
          COUNT(*)                  AS count,
          COUNT(DISTINCT r.[name])  AS clients,
          COALESCE(SUM(r.[value]),0) AS [value]
        FROM records r
        JOIN [User] u    ON r.userId = u.id
        JOIN shifts sh   ON u.shiftId = sh.id
        JOIN stations st ON u.stationId = st.id
        ${whereSql} AND sh.[name] = $${params.length + 1}
        GROUP BY r.service
        ORDER BY ${metric} DESC
      `;
      const { rows } = await safeQuery<ServiceRankingItem>(sql, [
        ...params,
        shift,
      ]);
      sections.push({ shift, items: rows });
    }
    return sections;
  } else {
    const sql = `
      SELECT 
        r.service                 AS service,
        COUNT(*)                  AS count,
        COUNT(DISTINCT r.[name])  AS clients,
        COALESCE(SUM(r.[value]),0) AS [value]
      FROM records r
      JOIN [User] u    ON r.userId = u.id
      JOIN stations st ON u.stationId = st.id
      ${whereSql}
      GROUP BY r.service
      ORDER BY ${metric} DESC
    `;
    const { rows } = await safeQuery<ServiceRankingItem>(sql, params);
    return rows;
  }
}

export async function fetchShiftSummaryData(
  startDate?: string,
  endDate?: string,
  station?: string
): Promise<ShiftSummaryItem[]> {
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (startDate && endDate) {
    clauses.push(
      `r.createdAt BETWEEN $${params.length + 1} AND $${params.length + 2}`
    );
    params.push(startDate, endDate);
  } else if (startDate) {
    clauses.push(`r.createdAt >= $${params.length + 1}`);
    params.push(startDate);
  } else if (endDate) {
    clauses.push(`r.createdAt <= $${params.length + 1}`);
    params.push(endDate);
  }

  if (station) {
    clauses.push(`st.[name] = $${params.length + 1}`);
    params.push(station);
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const sql = `
    SELECT
      sh.[name]                AS shift,
      COUNT(*)                 AS count,
      COUNT(DISTINCT r.[name]) AS clients,
      COALESCE(SUM(r.[value]),0) AS [value]
    FROM records r
    JOIN [User] u    ON r.userId = u.id
    JOIN shifts sh   ON u.shiftId = sh.id
    JOIN stations st ON u.stationId = st.id
    ${whereSql}
    GROUP BY sh.[name]
    ORDER BY sh.[name];
  `;

  const { rows } = await safeQuery<ShiftSummaryItem>(sql, params);
  return rows.map((r) => ({
    shift: r.shift,
    count: Number(r.count),
    clients: Number(r.clients),
    value: Number(r.value),
  }));
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

export type ShiftSummaryItem = {
  shift: string;
  count: number;
  clients: number;
  value: number;
};
