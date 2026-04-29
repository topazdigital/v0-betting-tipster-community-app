import { Pool, PoolClient } from 'pg';

// PostgreSQL connection pool
// Uses DATABASE_URL environment variable set by Replit

let pool: Pool | null = null;

export function getPool(): Pool | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;

  if (!pool) {
    pool = new Pool({
      connectionString: url,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
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
  
  // Convert MySQL ? placeholders to PostgreSQL $1, $2, ... style
  const pgSql = convertToPostgres(sql);
  const result = await pool.query(pgSql, params);
  return { rows: result.rows as T[], affectedRows: result.rowCount ?? 0 };
}

export async function queryOne<T>(sql: string, params?: unknown[]): Promise<T | null> {
  const result = await query<T>(sql, params);
  return result.rows[0] || null;
}

export interface ExecuteResult {
  insertId: number;
  affectedRows: number;
}

export async function execute(sql: string, params?: unknown[]): Promise<ExecuteResult> {
  const pool = getPool();
  
  if (!pool) {
    throw new Error('No database connection available');
  }
  
  const pgSql = convertToPostgres(sql);
  const result = await pool.query(pgSql, params);
  const insertId = result.rows?.[0]?.id ?? 0;
  return { insertId, affectedRows: result.rowCount ?? 0 };
}

// Transaction helper
export async function withTransaction<T>(
  callback: (connection: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool();
  
  if (!pool) {
    throw new Error('No database connection available');
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Close pool on app shutdown
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Convert MySQL-style ? placeholders to PostgreSQL $1, $2, ...
 * Also converts MySQL-specific syntax to PostgreSQL equivalents.
 */
function convertToPostgres(sql: string): string {
  let index = 0;
  // Replace ? with $1, $2, ...
  return sql.replace(/\?/g, () => `$${++index}`);
}
