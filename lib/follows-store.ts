import { query } from './db';

export interface FollowedTeam {
  teamId: string;
  teamName: string;
  teamLogo?: string | null;
  leagueId?: number | null;
  leagueSlug?: string | null;
  leagueName?: string | null;
  sportSlug?: string | null;
  countryCode?: string | null;
  followedAt: string;
}

export interface FollowedTipster {
  tipsterId: number;
  followedAt: string;
}

interface Stores {
  teams: Map<number, Map<string, FollowedTeam>>;
  tipsters: Map<number, Set<number>>;
}

const g = globalThis as { __followsStore?: Stores };
g.__followsStore = g.__followsStore || {
  teams: new Map(),
  tipsters: new Map(),
};
const stores = g.__followsStore;

function hasDb(): boolean {
  return !!process.env.DATABASE_URL;
}

// ─── TEAMS ───────────────────────────────────────
export async function listFollowedTeams(userId: number): Promise<FollowedTeam[]> {
  if (hasDb()) {
    try {
      const r = await query<FollowedTeam & { followed_at: string }>(
        `SELECT team_id AS teamId, team_name AS teamName, team_logo AS teamLogo,
                league_id AS leagueId, league_slug AS leagueSlug, league_name AS leagueName,
                sport_slug AS sportSlug, country_code AS countryCode,
                created_at AS followedAt
         FROM team_follows WHERE user_id = ? ORDER BY created_at DESC`,
        [userId]
      );
      if (r.rows.length > 0) return r.rows;
    } catch (e) {
      console.warn('[follows] db read failed, falling back to memory:', e);
    }
  }
  const m = stores.teams.get(userId);
  return m ? Array.from(m.values()).sort((a, b) => b.followedAt.localeCompare(a.followedAt)) : [];
}

export async function followTeam(userId: number, team: Omit<FollowedTeam, 'followedAt'>): Promise<FollowedTeam> {
  const entry: FollowedTeam = { ...team, followedAt: new Date().toISOString() };
  if (hasDb()) {
    try {
      await query(
        `INSERT INTO team_follows
         (user_id, team_id, team_name, team_logo, league_id, league_slug, league_name, sport_slug, country_code, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE team_name = VALUES(team_name), team_logo = VALUES(team_logo)`,
        [
          userId,
          entry.teamId,
          entry.teamName,
          entry.teamLogo || null,
          entry.leagueId || null,
          entry.leagueSlug || null,
          entry.leagueName || null,
          entry.sportSlug || null,
          entry.countryCode || null,
        ]
      );
    } catch (e) {
      console.warn('[follows] db write failed:', e);
    }
  }
  if (!stores.teams.has(userId)) stores.teams.set(userId, new Map());
  stores.teams.get(userId)!.set(entry.teamId, entry);
  return entry;
}

export async function unfollowTeam(userId: number, teamId: string): Promise<void> {
  if (hasDb()) {
    try {
      await query(`DELETE FROM team_follows WHERE user_id = ? AND team_id = ?`, [userId, teamId]);
    } catch (e) {
      console.warn('[follows] db delete failed:', e);
    }
  }
  stores.teams.get(userId)?.delete(teamId);
}

export async function isFollowingTeam(userId: number, teamId: string): Promise<boolean> {
  if (hasDb()) {
    try {
      const r = await query<{ c: number }>(
        `SELECT COUNT(*) AS c FROM team_follows WHERE user_id = ? AND team_id = ?`,
        [userId, teamId]
      );
      if (r.rows[0]?.c) return true;
    } catch {}
  }
  return stores.teams.get(userId)?.has(teamId) ?? false;
}

// ─── TIPSTERS ─────────────────────────────────────
export async function followTipster(userId: number, tipsterId: number): Promise<void> {
  if (hasDb()) {
    try {
      await query(
        `INSERT IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)`,
        [userId, tipsterId]
      );
    } catch (e) {
      console.warn('[follows tipster] db write failed:', e);
    }
  }
  if (!stores.tipsters.has(userId)) stores.tipsters.set(userId, new Set());
  stores.tipsters.get(userId)!.add(tipsterId);
}

export async function unfollowTipster(userId: number, tipsterId: number): Promise<void> {
  if (hasDb()) {
    try {
      await query(
        `DELETE FROM follows WHERE follower_id = ? AND following_id = ?`,
        [userId, tipsterId]
      );
    } catch {}
  }
  stores.tipsters.get(userId)?.delete(tipsterId);
}

export async function isFollowingTipster(userId: number, tipsterId: number): Promise<boolean> {
  if (hasDb()) {
    try {
      const r = await query<{ c: number }>(
        `SELECT COUNT(*) AS c FROM follows WHERE follower_id = ? AND following_id = ?`,
        [userId, tipsterId]
      );
      if (r.rows[0]?.c) return true;
    } catch {}
  }
  return stores.tipsters.get(userId)?.has(tipsterId) ?? false;
}

export async function listFollowedTipsters(userId: number): Promise<number[]> {
  if (hasDb()) {
    try {
      const r = await query<{ following_id: number }>(
        `SELECT following_id FROM follows WHERE follower_id = ?`,
        [userId]
      );
      if (r.rows.length > 0) return r.rows.map(x => x.following_id);
    } catch {}
  }
  return Array.from(stores.tipsters.get(userId) || []);
}
