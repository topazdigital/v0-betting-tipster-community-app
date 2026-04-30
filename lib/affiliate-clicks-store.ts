// ─────────────────────────────────────────────────────────────────────
// Affiliate clicks store — captures every outbound click on a bookmaker
// link (with the surrounding sport/league/match/placement context) so the
// admin dashboard can show which placements actually convert.
//
// Persistence: JSON file at .local/state/affiliate-clicks.json. Same
// pattern as bookmakers-store.ts — survives restarts, no DB required.
// ─────────────────────────────────────────────────────────────────────

import fs from 'node:fs';
import path from 'node:path';

export interface AffiliateClick {
  id: number;
  ts: number;                 // unix ms
  bookmakerId: number;
  bookmakerSlug: string;
  bookmakerName: string;
  placement: string;          // 'odds-table' | 'sidebar' | 'bookmakers-page' | 'match-tip' | 'unknown'
  sport?: string;             // e.g. 'football'
  league?: string;            // e.g. 'premier-league'
  matchId?: string;           // string to handle external IDs from sportsgameodds
  matchLabel?: string;        // 'Arsenal vs Chelsea'
  market?: string;            // optional market context (e.g. '1x2')
  selection?: string;         // optional selection context (e.g. 'home')
  userId?: number;            // logged-in user (if any)
  country?: string;           // request country (header)
  device: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  referer?: string;
}

const STORE_DIR = path.join(process.cwd(), '.local', 'state');
const STORE_FILE = path.join(STORE_DIR, 'affiliate-clicks.json');
const MAX_CLICKS = 50_000; // hard cap so the JSON file doesn't grow unbounded

interface ClicksFile {
  nextId: number;
  clicks: AffiliateClick[];
}

function ensureDir() {
  try { fs.mkdirSync(STORE_DIR, { recursive: true }); } catch { /* ignore */ }
}

function load(): ClicksFile {
  ensureDir();
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as ClicksFile;
      if (parsed && Array.isArray(parsed.clicks)) {
        return { nextId: parsed.nextId || (parsed.clicks.length + 1), clicks: parsed.clicks };
      }
    }
  } catch (e) {
    console.warn('[affiliate-clicks] failed to read store:', e);
  }
  return { nextId: 1, clicks: [] };
}

function persist(state: ClicksFile) {
  ensureDir();
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) {
    console.error('[affiliate-clicks] failed to write store:', e);
  }
}

const g = globalThis as { __affiliateClicksCache?: ClicksFile };
function cache(): ClicksFile {
  if (!g.__affiliateClicksCache) g.__affiliateClicksCache = load();
  return g.__affiliateClicksCache!;
}

export function recordClick(input: Omit<AffiliateClick, 'id' | 'ts'>): AffiliateClick {
  const state = cache();
  const click: AffiliateClick = {
    id: state.nextId++,
    ts: Date.now(),
    ...input,
  };
  state.clicks.push(click);
  // Trim oldest if we go over the cap.
  if (state.clicks.length > MAX_CLICKS) {
    state.clicks.splice(0, state.clicks.length - MAX_CLICKS);
  }
  persist(state);
  return click;
}

export interface ClickStats {
  total: number;
  last24h: number;
  last7d: number;
  byBookmaker: Array<{ bookmakerId: number; bookmakerName: string; bookmakerSlug: string; clicks: number; last24h: number }>;
  bySport: Array<{ sport: string; clicks: number }>;
  byLeague: Array<{ league: string; clicks: number }>;
  byMatch: Array<{ matchId: string; matchLabel: string; clicks: number }>;
  byPlacement: Array<{ placement: string; clicks: number }>;
  byDevice: Array<{ device: string; clicks: number }>;
  byDay: Array<{ date: string; clicks: number }>;
  recent: AffiliateClick[];
}

export function getStats(opts: { days?: number } = {}): ClickStats {
  const state = cache();
  const now = Date.now();
  const days = opts.days ?? 30;
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  const dayMs = 24 * 60 * 60 * 1000;

  const inWindow = state.clicks.filter(c => c.ts >= cutoff);

  function topBy<K extends string>(keyFn: (c: AffiliateClick) => string | undefined, labelFn: (key: string, sample: AffiliateClick) => Record<K, string | number>): Array<Record<K, string | number> & { clicks: number }> {
    const map = new Map<string, { sample: AffiliateClick; count: number }>();
    for (const c of inWindow) {
      const k = keyFn(c);
      if (!k) continue;
      const cur = map.get(k);
      if (cur) cur.count++;
      else map.set(k, { sample: c, count: 1 });
    }
    return [...map.entries()]
      .map(([k, v]) => ({ ...labelFn(k, v.sample), clicks: v.count }))
      .sort((a, b) => b.clicks - a.clicks);
  }

  // Per bookmaker (also compute last-24h)
  const byBookMap = new Map<number, { name: string; slug: string; total: number; last24h: number }>();
  for (const c of inWindow) {
    const cur = byBookMap.get(c.bookmakerId) || { name: c.bookmakerName, slug: c.bookmakerSlug, total: 0, last24h: 0 };
    cur.total++;
    if (c.ts >= now - dayMs) cur.last24h++;
    byBookMap.set(c.bookmakerId, cur);
  }
  const byBookmaker = [...byBookMap.entries()]
    .map(([id, v]) => ({ bookmakerId: id, bookmakerName: v.name, bookmakerSlug: v.slug, clicks: v.total, last24h: v.last24h }))
    .sort((a, b) => b.clicks - a.clicks);

  // Per day (oldest -> newest)
  const dayMap = new Map<string, number>();
  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(now - d * dayMs).toISOString().slice(0, 10);
    dayMap.set(date, 0);
  }
  for (const c of inWindow) {
    const date = new Date(c.ts).toISOString().slice(0, 10);
    if (dayMap.has(date)) dayMap.set(date, (dayMap.get(date) || 0) + 1);
  }
  const byDay = [...dayMap.entries()].map(([date, clicks]) => ({ date, clicks }));

  return {
    total: state.clicks.length,
    last24h: state.clicks.filter(c => c.ts >= now - dayMs).length,
    last7d: state.clicks.filter(c => c.ts >= now - 7 * dayMs).length,
    byBookmaker,
    bySport: topBy<'sport'>(c => c.sport, (k) => ({ sport: k })) as Array<{ sport: string; clicks: number }>,
    byLeague: topBy<'league'>(c => c.league, (k) => ({ league: k })) as Array<{ league: string; clicks: number }>,
    byMatch: topBy<'matchId' | 'matchLabel'>(
      c => (c.matchId ? c.matchId : undefined),
      (k, sample) => ({ matchId: k, matchLabel: sample.matchLabel || k }),
    ).slice(0, 50) as Array<{ matchId: string; matchLabel: string; clicks: number }>,
    byPlacement: topBy<'placement'>(c => c.placement || 'unknown', (k) => ({ placement: k })) as Array<{ placement: string; clicks: number }>,
    byDevice: topBy<'device'>(c => c.device || 'unknown', (k) => ({ device: k })) as Array<{ device: string; clicks: number }>,
    byDay,
    recent: [...inWindow].sort((a, b) => b.ts - a.ts).slice(0, 50),
  };
}

export function clearAll(): void {
  const state = cache();
  state.clicks = [];
  state.nextId = 1;
  persist(state);
}
