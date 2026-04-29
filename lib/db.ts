import { Pool } from 'pg';

// PostgreSQL connection pool
// Uses DATABASE_URL environment variable (set automatically by Replit)

let pool: Pool | null = null;

export function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
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
  const p = getPool();

  if (!p) {
    console.warn('No database connection, returning empty result');
    return { rows: [] };
  }

  // Convert MySQL-style ? placeholders to PostgreSQL $1, $2, etc.
  let pgSql = sql;
  let paramIndex = 1;
  pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);

  const result = await p.query(pgSql, params as unknown[]);
  return { rows: result.rows as T[], affectedRows: result.rowCount ?? undefined };
}

export async function queryOne<T>(sql: string, params?: unknown[]): Promise<T | null> {
  const result = await query<T>(sql, params);
  return result.rows[0] || null;
}

export async function execute(sql: string, params?: unknown[]): Promise<{ affectedRows: number; insertId: number }> {
  const p = getPool();

  if (!p) {
    throw new Error('No database connection available');
  }

  // Convert MySQL-style ? placeholders to PostgreSQL $1, $2, etc.
  let pgSql = sql;
  let paramIndex = 1;
  pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);

  const result = await p.query(pgSql, params as unknown[]);
  return {
    affectedRows: result.rowCount ?? 0,
    insertId: result.rows[0]?.id ?? 0,
  };
}

// Transaction helper
export async function withTransaction<T>(
  callback: (client: import('pg').PoolClient) => Promise<T>
): Promise<T> {
  const p = getPool();

  if (!p) {
    throw new Error('No database connection available');
  }

  const client = await p.connect();

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
