// lib/db.ts
import sql from "mssql";

export class DatabaseError extends Error {
  constructor(message = "Database is unreachable") {
    super(message);
    this.name = "DatabaseError";
  }
}

const pool = new sql.ConnectionPool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER as string,
  database: process.env.DB_NAME,
  options: {
    encrypt: false, // set true if using Azure or SSL
    trustServerCertificate: true, // allow self-signed certs in dev
  },
});

const poolConnect = pool.connect().catch((err) => {
  console.error("Database connection failed:", err);
  throw new DatabaseError();
});

// Safe query wrapper (same shape as before)
export async function safeQuery<T = any>(
  text: string,
  params: unknown[] = []
): Promise<{ rows: T[] }> {
  try {
    await poolConnect;

    const request = pool.request();
    params.forEach((param, i) => {
      request.input(`p${i + 1}`, param as any);
    });

    const result = await request.query<T>(
      text.replace(/\$(\d+)/g, (_, i) => `@p${i}`) // convert $1, $2 → @p1, @p2
    );

    return { rows: result.recordset };
  } catch (err: unknown) {
    console.error("DB query failed:", err);
    throw new DatabaseError();
  }
}

export default pool;
