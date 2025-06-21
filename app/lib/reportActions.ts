// app/lib/reportActions.ts
"use server";
import pool from "./db";

export async function fetchSummaryStats(
  startDate: string,
  endDate: string,
  station: string
): Promise<{
  totalRecords: number;
  totalValue: number;
  totalServices: number;
  totalClients: number;
}> {
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  // 1) Date range filter
  if (startDate && endDate) {
    clauses.push(
      `r."createdAt" BETWEEN $${params.length + 1} AND $${params.length + 2}`
    );
    params.push(startDate, endDate);
  } else if (startDate) {
    clauses.push(`r."createdAt" >= $${params.length + 1}`);
    params.push(startDate);
  } else if (endDate) {
    clauses.push(`r."createdAt" <= $${params.length + 1}`);
    params.push(endDate);
  }

  // 2) Station filter via user→station join
  if (station) {
    clauses.push(`st.name = $${params.length + 1}`);
    params.push(station);
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const sql = `
    SELECT
      COUNT(*)::int              AS "totalRecords",
      COALESCE(SUM(r.value),0)::int  AS "totalValue",
      COUNT(DISTINCT r.service)::int AS "totalServices",
      COUNT(DISTINCT r.name)::int    AS "totalClients"
    FROM records r
    JOIN "User" u ON u.id = r."userId"
    LEFT JOIN stations st  ON u."stationId" = st.id
    ${whereSql};
  `;

  const { rows } = await pool.query<{
    totalRecords: number;
    totalValue: number;
    totalServices: number;
    totalClients: number;
  }>(sql, params);

  return rows[0];
}

export type RankingDataItem = {
  key: string; // biller name
  count: number; // total records
  clients: number; // distinct customer names
  value: number; // sum of values
};

export type ShiftRankingSection = {
  shift: string;
  items: RankingDataItem[];
};

/**
 * Fetches ranking data, optionally grouping by shift.
 * Now returns for each biller: { key, count, clients, value }
 */
export async function fetchRankingData(
  startDate: string,
  endDate: string,
  station: string,
  rankBy: string,
  groupBy: boolean
): Promise<RankingDataItem[] | ShiftRankingSection[]> {
  const metric = rankBy ? `SUM(r.value)` : `COUNT(*)`;

  // Build filters
  const filters: string[] = [];
  const params: (string | number)[] = [];
  if (startDate && endDate) {
    filters.push(
      `r."createdAt" BETWEEN $${params.length + 1} AND $${params.length + 2}`
    );
    params.push(startDate, endDate);
  }
  if (station) {
    filters.push(`st.name = $${params.length + 1}`);
    params.push(station);
  }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  if (groupBy) {
    // Grouped by each shift
    const shifts = await pool.query<{ shift: string }>(
      `SELECT name AS shift FROM shifts ORDER BY name`
    );

    const sections: ShiftRankingSection[] = [];
    for (const { shift } of shifts.rows) {
      const sql = `
        SELECT
          u.name                     AS key,
          COUNT(*)                   AS count,
          COUNT(DISTINCT r.name)     AS clients,
          COALESCE(SUM(r.value),0)   AS value
        FROM records r
        JOIN "User" u    ON r."userId" = u.id
        JOIN shifts sh   ON u."shiftId" = sh.id
        JOIN stations st ON u."stationId" = st.id
        ${where} AND sh.name = $${params.length + 1}
        GROUP BY u.name
        ORDER BY ${metric} DESC
      `;
      const res = await pool.query<RankingDataItem>(sql, [...params, shift]);
      sections.push({ shift, items: res.rows });
    }
    return sections;
  } else {
    // Flat ranking
    const sql = `
      SELECT
        u.name                     AS key,
        COUNT(*)                   AS count,
        COUNT(DISTINCT r.name)     AS clients,
        COALESCE(SUM(r.value),0)   AS value
      FROM records r
      JOIN "User" u    ON r."userId" = u.id
      JOIN stations st ON u."stationId" = st.id
      ${where}
      GROUP BY u.name
      ORDER BY ${metric} DESC
    `;
    const res = await pool.query<RankingDataItem>(sql, params);
    return res.rows;
  }
}

// app/lib/reportActions.ts

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
  startDate: string,
  endDate: string,
  station: string,
  rankBy: string,
  groupByShiftFlag: boolean
): Promise<ServiceRankingItem[] | ShiftServiceSection[]> {
  const metric = rankBy ? `SUM(r.value)` : `COUNT(*)`;

  // Build filters
  const filters: string[] = [];
  const params: (string | number)[] = [];

  if (startDate && endDate) {
    filters.push(
      `r."createdAt" BETWEEN $${params.length + 1} AND $${params.length + 2}`
    );
    params.push(startDate, endDate);
  }
  if (station) {
    filters.push(`st.name = $${params.length + 1}`);
    params.push(station);
  }
  const whereSql = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  if (groupByShiftFlag) {
    // Per‐shift sections
    const shiftsRes = await pool.query<{ shift: string }>(
      `SELECT name AS shift FROM shifts ORDER BY name`
    );
    const sections: ShiftServiceSection[] = [];

    for (const { shift } of shiftsRes.rows) {
      const sql = `
        SELECT 
          r.service             AS service,
          COUNT(*)               AS count,
          COUNT(DISTINCT r.name) AS clients,
          COALESCE(SUM(r.value),0) AS value
        FROM records r
        JOIN "User" u    ON r."userId" = u.id
        JOIN shifts sh   ON u."shiftId" = sh.id
        JOIN stations st ON u."stationId" = st.id
        ${whereSql} AND sh.name = $${params.length + 1}
        GROUP BY r.service
        ORDER BY ${metric} DESC
      `;
      const res = await pool.query<ServiceRankingItem>(sql, [...params, shift]);
      sections.push({ shift, items: res.rows });
    }
    return sections;
  } else {
    // Flat ranking
    const sql = `
      SELECT 
        r.service             AS service,
        COUNT(*)               AS count,
        COUNT(DISTINCT r.name) AS clients,
        COALESCE(SUM(r.value),0) AS value
      FROM records r
      JOIN "User" u    ON r."userId" = u.id
      JOIN stations st ON u."stationId" = st.id
      ${whereSql}
      GROUP BY r.service
      ORDER BY ${metric} DESC
    `;
    const res = await pool.query<ServiceRankingItem>(sql, params);
    return res.rows;
  }
}

export type ShiftSummaryItem = {
  shift: string;
  count: number;
  clients: number;
  value: number;
};

/**
 * Returns for each shift:
 *  - shift name
 *  - number of records (count)
 *  - number of distinct clients served
 *  - total value
 */
export async function fetchShiftSummaryData(
  startDate: string,
  endDate: string,
  station: string
): Promise<ShiftSummaryItem[]> {
  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (startDate && endDate) {
    clauses.push(
      `r."createdAt" BETWEEN $${params.length + 1} AND $${params.length + 2}`
    );
    params.push(startDate, endDate);
  } else if (startDate) {
    clauses.push(`r."createdAt" >= $${params.length + 1}`);
    params.push(startDate);
  } else if (endDate) {
    clauses.push(`r."createdAt" <= $${params.length + 1}`);
    params.push(endDate);
  }

  if (station) {
    clauses.push(`st.name = $${params.length + 1}`);
    params.push(station);
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const sql = `
    SELECT
      sh.name                 AS shift,
      COUNT(*)                AS count,
      COUNT(DISTINCT r.name)  AS clients,
      COALESCE(SUM(r.value),0) AS value
    FROM records r
    JOIN "User" u      ON r."userId" = u.id
    JOIN shifts sh     ON u."shiftId" = sh.id
    JOIN stations st   ON u."stationId" = st.id
    ${whereSql}
    GROUP BY sh.name
    ORDER BY sh.name;
  `;

  const { rows } = await pool.query<ShiftSummaryItem>(sql, params);

  return rows.map((r) => ({
    shift: r.shift,
    count: Number(r.count),
    clients: Number(r.clients),
    value: Number(r.value),
  }));
}
