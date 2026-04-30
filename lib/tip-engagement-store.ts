// Tip engagement store: per-tip likes + comments.
// Uses MySQL when DATABASE_URL is set, otherwise falls back to in-memory
// global state (consistent with the rest of the codebase).

import { query, execute } from './db';

export interface TipComment {
  id: string;
  tipId: string;
  userId: number;
  authorName: string;
  authorAvatar?: string | null;
  content: string;
  createdAt: string;
}

interface Stores {
  // tipId → set of userIds who liked it
  likes: Map<string, Set<number>>;
  // tipId → list of comments
  comments: Map<string, TipComment[]>;
  // baseline like count seeded from auto-tips so the UI keeps the original number
  baseline: Map<string, number>;
}

const g = globalThis as { __tipEngagementStore?: Stores };
g.__tipEngagementStore = g.__tipEngagementStore || {
  likes: new Map(),
  comments: new Map(),
  baseline: new Map(),
};
const s = g.__tipEngagementStore;

const hasDb = () => !!process.env.DATABASE_URL;

function makeId(): string {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── LIKES ───────────────────────────────────────────────────────────

export function setBaselineLikes(tipId: string, count: number) {
  s.baseline.set(tipId, Math.max(0, count));
}

export async function getLikeCount(tipId: string, viewerId?: number | null): Promise<{ count: number; liked: boolean }> {
  const baseline = s.baseline.get(tipId) || 0;
  if (hasDb()) {
    try {
      const r = await query<{ c: number }>(`SELECT COUNT(*) as c FROM tip_likes WHERE tip_id = ?`, [tipId]);
      const dbCount = Number(r.rows[0]?.c || 0);
      let liked = false;
      if (viewerId) {
        const lr = await query<{ user_id: number }>(`SELECT user_id FROM tip_likes WHERE tip_id = ? AND user_id = ? LIMIT 1`, [tipId, viewerId]);
        liked = lr.rows.length > 0;
      }
      return { count: baseline + dbCount, liked };
    } catch { /* fall through */ }
  }
  const set = s.likes.get(tipId);
  const count = baseline + (set?.size || 0);
  const liked = !!(viewerId && set?.has(viewerId));
  return { count, liked };
}

export async function likeTip(tipId: string, userId: number): Promise<{ count: number; liked: boolean }> {
  if (hasDb()) {
    try {
      await execute(`INSERT IGNORE INTO tip_likes (tip_id, user_id, created_at) VALUES (?, ?, NOW())`, [tipId, userId]);
      return getLikeCount(tipId, userId);
    } catch { /* fall through */ }
  }
  const set = s.likes.get(tipId) || new Set<number>();
  set.add(userId);
  s.likes.set(tipId, set);
  return getLikeCount(tipId, userId);
}

export async function unlikeTip(tipId: string, userId: number): Promise<{ count: number; liked: boolean }> {
  if (hasDb()) {
    try {
      await execute(`DELETE FROM tip_likes WHERE tip_id = ? AND user_id = ?`, [tipId, userId]);
      return getLikeCount(tipId, userId);
    } catch { /* fall through */ }
  }
  const set = s.likes.get(tipId);
  if (set) set.delete(userId);
  return getLikeCount(tipId, userId);
}

// ─── COMMENTS ─────────────────────────────────────────────────────────

export async function listComments(tipId: string, limit = 50): Promise<TipComment[]> {
  if (hasDb()) {
    try {
      const r = await query<{ id: string; tip_id: string; user_id: number; author_name: string; author_avatar: string | null; content: string; created_at: string | Date }>(
        `SELECT id, tip_id, user_id, author_name, author_avatar, content, created_at
         FROM tip_comments WHERE tip_id = ? ORDER BY created_at ASC LIMIT ?`,
        [tipId, limit],
      );
      return r.rows.map(x => ({
        id: x.id,
        tipId: x.tip_id,
        userId: x.user_id,
        authorName: x.author_name,
        authorAvatar: x.author_avatar,
        content: x.content,
        createdAt: typeof x.created_at === 'string' ? x.created_at : x.created_at.toISOString(),
      }));
    } catch { /* fall through */ }
  }
  return (s.comments.get(tipId) || []).slice(0, limit);
}

export async function addComment(input: {
  tipId: string;
  userId: number;
  authorName: string;
  authorAvatar?: string | null;
  content: string;
}): Promise<TipComment> {
  const id = makeId();
  const createdAt = new Date().toISOString();
  if (hasDb()) {
    try {
      await execute(
        `INSERT INTO tip_comments (id, tip_id, user_id, author_name, author_avatar, content, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [id, input.tipId, input.userId, input.authorName, input.authorAvatar || null, input.content],
      );
      return { id, tipId: input.tipId, userId: input.userId, authorName: input.authorName, authorAvatar: input.authorAvatar, content: input.content, createdAt };
    } catch { /* fall through */ }
  }
  const list = s.comments.get(input.tipId) || [];
  const c: TipComment = { id, tipId: input.tipId, userId: input.userId, authorName: input.authorName, authorAvatar: input.authorAvatar, content: input.content, createdAt };
  list.push(c);
  s.comments.set(input.tipId, list);
  return c;
}

export async function getCommentCount(tipId: string): Promise<number> {
  if (hasDb()) {
    try {
      const r = await query<{ c: number }>(`SELECT COUNT(*) as c FROM tip_comments WHERE tip_id = ?`, [tipId]);
      return Number(r.rows[0]?.c || 0);
    } catch { /* fall through */ }
  }
  return (s.comments.get(tipId) || []).length;
}
