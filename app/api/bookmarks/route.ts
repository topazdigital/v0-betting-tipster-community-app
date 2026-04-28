import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { execute, query, getPool } from "@/lib/db";

async function ensureTable(): Promise<boolean> {
  if (!getPool()) return false;
  try {
    await execute(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        user_id INT NOT NULL,
        match_id VARCHAR(191) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, match_id),
        INDEX idx_user_created (user_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ bookmarks: [] }, { status: 401 });
  const ok = await ensureTable();
  if (!ok) return NextResponse.json({ bookmarks: [] });
  const result = await query<{ match_id: string }>(
    "SELECT match_id FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC LIMIT 200",
    [user.userId]
  );
  return NextResponse.json({
    bookmarks: (result.rows || []).map(r => r.match_id),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const matchId = String(body?.matchId || "").slice(0, 190);
  if (!matchId) return NextResponse.json({ error: "matchId required" }, { status: 400 });
  const ok = await ensureTable();
  if (!ok) return NextResponse.json({ ok: true, persisted: false });
  await execute(
    "INSERT IGNORE INTO bookmarks (user_id, match_id) VALUES (?, ?)",
    [user.userId, matchId]
  );
  return NextResponse.json({ ok: true, persisted: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const matchId = String(body?.matchId || "").slice(0, 190);
  if (!matchId) return NextResponse.json({ error: "matchId required" }, { status: 400 });
  const ok = await ensureTable();
  if (!ok) return NextResponse.json({ ok: true, persisted: false });
  await execute(
    "DELETE FROM bookmarks WHERE user_id = ? AND match_id = ?",
    [user.userId, matchId]
  );
  return NextResponse.json({ ok: true, persisted: true });
}
