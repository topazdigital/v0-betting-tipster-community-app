import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

// MySQL connection pool
// Priority: DATABASE_URL env var > admin panel config file > no connection (mock data fallback)

const DB_CONFIG_PATH = path.join(process.cwd(), '.db-config.json');

interface DbFileConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: boolean;
}

function getConnectionUrl(): string | null {
  if (process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL;
    // Only use if it's a MySQL URL
    if (url.startsWith('mysql://') || url.startsWith('mysql2://')) return url;
    // Skip PostgreSQL URLs silently
    if (url.startsWith('postgres')) return null;
    return url;
  }

  try {
    if (fs.existsSync(DB_CONFIG_PATH)) {
      const cfg: DbFileConfig = JSON.parse(fs.readFileSync(DB_CONFIG_PATH, 'utf8'));
      if (cfg.host && cfg.user && cfg.database) {
        const auth = cfg.password
          ? `${encodeURIComponent(cfg.user)}:${encodeURIComponent(cfg.password)}`
          : encodeURIComponent(cfg.user);
        const sslSuffix = cfg.ssl ? '?ssl=true' : '';
        return `mysql://${auth}@${cfg.host}:${cfg.port || 3306}/${cfg.database}${sslSuffix}`;
      }
    }
  } catch {}

  return null;
}

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool | null {
  const url = getConnectionUrl();
  if (!url) return null;

  if (!pool) {
    pool = mysql.createPool({
      uri: url,
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
