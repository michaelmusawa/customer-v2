// lib/db.ts
import { ConnectionPool, config as MSSQLConfig, IResult } from "mssql";

export class DatabaseError extends Error {
  constructor(message = "Database is unreachable") {
    super(message);
    this.name = "DatabaseError";
  }
}

const poolConfig: MSSQLConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || "localhost", // e.g. "localhost"
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
  port: parseInt(process.env.DB_PORT || "1433", 10),
};

let pool: ConnectionPool;

async function getPool(): Promise<ConnectionPool> {
  if (pool && pool.connected) return pool;
  try {
    pool = await new ConnectionPool(poolConfig).connect();
    pool.on("error", (err) => {
      console.error("MSSQL idle client error", err);
    });
    return pool;
  } catch (err) {
    console.error("Failed to connect to MSSQL:", err);
    throw new DatabaseError();
  }
}

/**
 * A drop‑in replacement for pool.query, but throws DatabaseError
 */
export async function safeQuery<T = any>(
  text: string,
  params: Record<string, unknown> = {}
): Promise<{ recordset: T[] }> {
  try {
    const p = await getPool();
    const req = p.request();
    // bind parameters by name
    for (const [key, value] of Object.entries(params)) {
      req.input(key, value as any);
    }
    const result: IResult<T> = await req.query(text);
    return { recordset: result.recordset };
  } catch (err: unknown) {
    console.error("DB query failed:", err);
    throw new DatabaseError();
  }
}

export default getPool;
