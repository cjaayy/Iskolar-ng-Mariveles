/**
 * database/connection.ts
 * MySQL connection pool using mysql2/promise.
 * A single pool instance is cached in the Node.js module cache so that
 * hot-reloads in Next.js dev mode don't exhaust connections.
 */
import mysql, { Pool, PoolOptions } from "mysql2/promise";

const poolConfig: PoolOptions = {
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASS ?? "",
  database: process.env.DB_NAME ?? "scholarship_system",
  // Pool sizing
  connectionLimit: Number(process.env.DB_POOL_MAX ?? 10),
  // Keep idle connections alive
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // Automatically parse dates into JS Date objects
  dateStrings: false,
  // Return JS native types instead of strings where possible
  typeCast: true,
  // Prevent SQL injection via named placeholders
  namedPlaceholders: true,
  // Timeout (ms) for establishing a connection
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT ?? 10_000),
  // Timezone: UTC stored, localised on the client side
  timezone: "+00:00",
};

// ----- Singleton pool (survives HMR in dev) -----
declare global {
  // eslint-disable-next-line no-var
  var __mysqlPool: Pool | undefined;
}

function getPool(): Pool {
  if (!global.__mysqlPool) {
    global.__mysqlPool = mysql.createPool(poolConfig);

    // Surface pool-level errors to the console so they are not swallowed
    global.__mysqlPool.on("connection", (conn: mysql.Connection) => {
      conn.on("error", (err: NodeJS.ErrnoException) => {
        console.error("[DB] Connection error:", err.message);
      });
    });
  }
  return global.__mysqlPool;
}

export const pool = getPool();

// ---- Convenience wrappers -----------------------------------------------

/**
 * Run a parameterised query and return typed rows.
 *
 * @example
 *   const users = await query<User>('SELECT * FROM users WHERE id = :id', { id: 1 });
 */
export async function query<T = unknown>(
  sql: string,
  params?: Record<string, unknown> | unknown[],
): Promise<T[]> {
  // mysql2's execute() TypeScript overloads don't expose namedPlaceholders
  // as a separate type — casting via QueryOptions is the idiomatic workaround.
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(
    { sql, namedPlaceholders: true } as mysql.QueryOptions,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params as any,
  );
  return rows as T[];
}

/**
 * Run an INSERT / UPDATE / DELETE and return the result metadata.
 */
export async function execute(
  sql: string,
  params?: Record<string, unknown> | unknown[],
): Promise<mysql.ResultSetHeader> {
  const [result] = await pool.execute<mysql.ResultSetHeader>(
    { sql, namedPlaceholders: true } as mysql.QueryOptions,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params as any,
  );
  return result;
}

/**
 * Quick connection check — throws if the database is unreachable.
 */
export async function testConnection(): Promise<void> {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
}
