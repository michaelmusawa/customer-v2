// lib/db.ts
import { Pool, QueryResultRow } from "pg";

export class DatabaseError extends Error {
  constructor(message = "Database is unreachable") {
    super(message);
    this.name = "DatabaseError";
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Listen for any idle‐client errors (just in case)
pool.on("error", (err) => {
  console.error("Unexpected idle client error", err);
});

/**
 * A drop‑in replacement for pool.query, but throws DatabaseError
 * instead of letting pg errors bubble up raw.
 */

export async function safeQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<{ rows: T[] }> {
  try {
    return await pool.query<T>(text, params);
  } catch (err: unknown) {
    console.error("DB query failed:", err);
    throw new DatabaseError();
  }
}

export default pool;
