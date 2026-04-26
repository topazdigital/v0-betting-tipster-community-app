import mysql from 'mysql2/promise';

// MySQL connection pool
// Connects whenever DATABASE_URL is set, regardless of NODE_ENV.
// Without a DATABASE_URL the app gracefully falls back to mock data.

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool | null {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return null;
  }

  if (!pool) {
    pool = mysql.createPool({
      uri: dbUrl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }

  return pool;
}

export interface QueryResult<T> {
  rows: T[];
  affectedRows?: number;
}

export async function query<T>(sql: string, params?: unknown[]): Promise<QueryResult<T>> {
  const pool = getPool();
  
  if (!pool) {
    console.warn('No database connection, returning empty result');
    return { rows: [] };
  }
  
  const [rows] = await pool.execute(sql, params);
  return { rows: rows as T[] };
}

export async function queryOne<T>(sql: string, params?: unknown[]): Promise<T | null> {
  const result = await query<T>(sql, params);
  return result.rows[0] || null;
}

export async function execute(sql: string, params?: unknown[]): Promise<mysql.ResultSetHeader> {
  const pool = getPool();
  
  if (!pool) {
    throw new Error('No database connection available');
  }
  
  const [result] = await pool.execute(sql, params);
  return result as mysql.ResultSetHeader;
}

// Transaction helper
export async function withTransaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const pool = getPool();
  
  if (!pool) {
    throw new Error('No database connection available');
  }
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Close pool on app shutdown
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
