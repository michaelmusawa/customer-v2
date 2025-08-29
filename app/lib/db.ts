// lib/db.ts
import { ConnectionPool, config as MSSQLConfig } from "mssql";

export class DatabaseError extends Error {
  constructor(message = "Database is unreachable") {
    super(message);
    this.name = "DatabaseError";
  }
}

/**
 * Build pool config from env vars.
 */
const poolConfig: MSSQLConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true", // set true for Azure
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT === "true", // dev: true, prod: false ideally
  },
};

const pool = new ConnectionPool(poolConfig);
const poolConnect = pool.connect().catch((err) => {
  console.error("MSSQL pool connection failed:", err);
  throw new DatabaseError();
});

pool.on("error", (err) => {
  console.error("Unexpected MSSQL pool error", err);
});

/**
 * A simple safeQuery wrapper:
 * - `text` should be valid T-SQL (use @param names in SQL)
 * - `params` may be either:
 *    • an object of named params: { id: 1, name: "x" } → binds @id, @name
 *    • an array of positional values: [v1, v2] → binds @p1, @p2 ...
 *
 * Example (named):
 *   await safeQuery("SELECT * FROM Users WHERE id = @id", { id: 5 });
 *
 * Example (positional):
 *   await safeQuery("SELECT * FROM Users WHERE id = @p1 AND status = @p2", [5, 'active']);
 */
export async function safeQuery<T = any>(
  text: string,
  params: Record<string, unknown> | unknown[] = {}
): Promise<{ rows: T[] }> {
  try {
    await poolConnect;
    const request = pool.request();

    if (Array.isArray(params)) {
      params.forEach((value, i) => {
        request.input(`p${i + 1}`, value as any);
      });
    } else {
      for (const [key, value] of Object.entries(params)) {
        // allow callers to pass either "id" or "@id" as the key
        const paramName = key.startsWith("@") ? key.slice(1) : key;
        request.input(paramName, value as any);
      }
    }

    const result = await request.query(text);
    return { rows: (result.recordset || []) as T[] };
  } catch (err: unknown) {
    console.error("DB query failed:", err);
    throw new DatabaseError();
  }
}

export default pool;
