import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

const CONFIG_PATH = path.join(process.cwd(), '.db-config.json')

export interface DbConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
  ssl: boolean
}

function readConfig(): DbConfig | null {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf8')
      return JSON.parse(raw)
    }
  } catch {}
  return null
}

function writeConfig(cfg: DbConfig): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8')
}

function maskPassword(cfg: DbConfig): DbConfig {
  return { ...cfg, password: cfg.password ? '•'.repeat(12) : '' }
}

function buildConnectionUrl(cfg: DbConfig): string {
  const auth = cfg.password
    ? `${encodeURIComponent(cfg.user)}:${encodeURIComponent(cfg.password)}`
    : encodeURIComponent(cfg.user)
  const sslSuffix = cfg.ssl ? '?ssl=true' : ''
  return `mysql://${auth}@${cfg.host}:${cfg.port}/${cfg.database}${sslSuffix}`
}

export async function GET() {
  try {
    const session = await getCurrentUser()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const envUrl = process.env.DATABASE_URL
    const fileCfg = readConfig()

    // Determine source: env var takes priority
    const source: 'env' | 'file' | 'none' = envUrl ? 'env' : fileCfg ? 'file' : 'none'

    return NextResponse.json({
      source,
      hasEnvVar: !!envUrl,
      config: fileCfg ? maskPassword(fileCfg) : null,
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getCurrentUser()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: DbConfig = await req.json()

    if (!body.host || !body.database || !body.user) {
      return NextResponse.json({ error: 'host, user, and database are required' }, { status: 400 })
    }

    // If password is all bullets, keep existing password
    const existing = readConfig()
    const isMasked = body.password && /^•+$/.test(body.password)
    if (isMasked && existing) {
      body.password = existing.password
    }

    writeConfig({
      host: body.host.trim(),
      port: body.port || 3306,
      user: body.user.trim(),
      password: body.password || '',
      database: body.database.trim(),
      ssl: !!body.ssl,
    })

    return NextResponse.json({ success: true, connectionUrl: buildConnectionUrl(body) })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getCurrentUser()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (fs.existsSync(CONFIG_PATH)) {
      fs.unlinkSync(CONFIG_PATH)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await req.json()

    if (action === 'test') {
      const envUrl = process.env.DATABASE_URL
      const fileCfg = readConfig()

      let connectionUrl: string | null = envUrl || null
      if (!connectionUrl && fileCfg) {
        connectionUrl = buildConnectionUrl(fileCfg)
      }

      if (!connectionUrl) {
        return NextResponse.json({ success: false, message: 'No database configuration found.' })
      }

      try {
        const mysql = await import('mysql2/promise')
        const conn = await mysql.createConnection(connectionUrl)
        await conn.query('SELECT 1')
        await conn.end()
        return NextResponse.json({ success: true, message: 'Connection successful!' })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        return NextResponse.json({ success: false, message: `Connection failed: ${msg}` })
      }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
