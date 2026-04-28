import { NextRequest, NextResponse } from 'next/server';
import { ALL_LEAGUES, ALL_SPORTS } from '@/lib/sports-data';
import { getAllMatches } from '@/lib/api/unified-sports-api';
import { query } from '@/lib/db';
import { teamHref } from '@/lib/utils/slug';

// Unified search endpoint backing the header typeahead.
// Returns up to ~5 hits per category for: leagues, matches, teams, tipsters.
// Designed to stay snappy (<200ms warm) — leagues/sports are searched
// in-memory; matches reuse the cached unified feed; tipsters fall back to []
// when the DB is unreachable so the UI doesn't break in local/dev.
export const dynamic = 'force-dynamic';
export const revalidate = 30;
export const runtime = 'nodejs';

type SearchHit =
  | { type: 'league'; id: string; title: string; subtitle: string; href: string; logoUrl?: string; sportSlug?: string }
  | { type: 'team'; id: string; title: string; subtitle: string; href: string; logoUrl?: string; sportSlug?: string }
  | { type: 'match'; id: string; title: string; subtitle: string; href: string; status: string; kickoffIso?: string }
  | { type: 'tipster'; id: string; title: string; subtitle: string; href: string; avatar?: string | null; verified?: boolean };

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

// Common abbreviations / nicknames so users can type "PSG", "MUFC", "Spurs"
// and still get the right team. Keys must already be normalised (lowercase,
// accents stripped). Multiple aliases for the same team are fine.
const TEAM_ALIASES: Record<string, string[]> = {
  'paris saint-germain': ['psg'],
  'paris saint germain': ['psg'],
  'manchester united': ['mufc', 'man u', 'man utd', 'united'],
  'manchester city': ['mcfc', 'man city', 'city'],
  'tottenham hotspur': ['spurs', 'thfc'],
  'tottenham': ['spurs', 'thfc'],
  'arsenal': ['afc', 'gunners'],
  'chelsea': ['cfc', 'blues'],
  'liverpool': ['lfc', 'reds'],
  'newcastle united': ['nufc', 'magpies'],
  'real madrid': ['rma', 'madrid'],
  'atletico madrid': ['atleti', 'atm'],
  'fc barcelona': ['barca', 'fcb'],
  'barcelona': ['barca', 'fcb'],
  'bayern munich': ['bayern', 'fcb', 'bmu'],
  'borussia dortmund': ['bvb', 'dortmund'],
  'juventus': ['juve'],
  'internazionale': ['inter'],
  'inter milan': ['inter'],
  'ac milan': ['milan'],
  'olympique de marseille': ['om', 'marseille'],
  'olympique lyonnais': ['ol', 'lyon'],
  'ajax amsterdam': ['ajax'],
  'paris fc': ['pfc'],
};

// Build an `alias → canonical-name` reverse lookup once at module load.
const ALIAS_LOOKUP: Map<string, Set<string>> = (() => {
  const m = new Map<string, Set<string>>();
  for (const [canonical, aliases] of Object.entries(TEAM_ALIASES)) {
    for (const a of aliases) {
      const key = norm(a);
      if (!m.has(key)) m.set(key, new Set());
      m.get(key)!.add(norm(canonical));
    }
  }
  return m;
})();

// Squads we never want clogging the team typeahead — women's, youth and
// reserve sides. The user's main interest is the senior men's team and the
// duplicate clutter (Marseille, Marseille W, Marseille U23, Marseille U19,
// Marseille B…) was making the picker unusable.
const TEAM_NOISE_PATTERNS = [
  /\bwomen('s)?\b/i,
  /\bw(?:omen)?fc\b/i,
  /\bféminin(es)?\b/i,
  /\bfemenin[ao]s?\b/i,
  /\bfeminin[ao]s?\b/i,
  /\bdamen\b/i,
  /\bladies\b/i,
  /\(w\)\s*$/i,
  /\bu-?(15|16|17|18|19|20|21|23)\b/i,
  /\b(reserves?|reserve|ii|iii|b)\s*$/i,
  /\byouth\b/i,
];

function isNoisyTeamName(name: string): boolean {
  return TEAM_NOISE_PATTERNS.some(rx => rx.test(name));
}

// Tiny scorer so "man u" beats "Manchester City" for matches starting with the query.
// Also checks aliases — typing "PSG" should score Paris Saint-Germain as if
// the user typed the canonical name directly.
function scoreMatch(q: string, candidate: string): number {
  const c = norm(candidate);
  // Direct text matches first.
  let best = -1;
  if (c === q) best = 100;
  else if (c.startsWith(q)) best = 80;
  else if (c.split(/\s+/).some(w => w.startsWith(q))) best = 60;
  else if (c.includes(q)) best = 30;

  // Alias matches — if any of the candidate's aliases equals or starts with
  // the query, treat that as a strong hit too.
  const canonicals = ALIAS_LOOKUP.get(q);
  if (canonicals && canonicals.has(c)) best = Math.max(best, 95);

  // Reverse: if the candidate has aliases that include the query, score it.
  const candAliases = TEAM_ALIASES[c];
  if (candAliases) {
    for (const a of candAliases) {
      const an = norm(a);
      if (an === q) { best = Math.max(best, 95); break; }
      if (an.startsWith(q)) { best = Math.max(best, 70); }
    }
  }

  return best;
}

interface DbTipsterRow {
  user_id: number;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  followers_count: number | null;
  is_verified: number | null;
  is_pro: number | null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawQ = (searchParams.get('q') || '').trim();
  const limitPerKind = Math.min(10, Math.max(1, parseInt(searchParams.get('limit') || '5', 10) || 5));

  if (rawQ.length < 2) {
    return NextResponse.json({ q: rawQ, hits: [] satisfies SearchHit[] });
  }

  const q = norm(rawQ);

  // ── 1. Leagues (in-memory, cheap) ────────────────────────────────────
  const leagueHits: SearchHit[] = ALL_LEAGUES
    .map(l => ({ league: l, score: scoreMatch(q, l.name) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score || a.league.tier - b.league.tier)
    .slice(0, limitPerKind)
    .map(({ league }) => {
      const sport = ALL_SPORTS.find(s => s.id === league.sportId);
      return {
        type: 'league',
        id: `league-${league.slug}`,
        title: league.name,
        subtitle: `${sport?.name ?? 'Sport'} • ${league.country}`,
        href: `/leagues/${league.slug}`,
        sportSlug: sport?.slug,
      };
    });

  // ── 2. Matches + teams (from unified feed; cached upstream) ──────────
  // We run team derivation off the same fetch so we only hit ESPN once.
  const matchHits: SearchHit[] = [];
  const teamMap = new Map<string, SearchHit>();
  try {
    const allMatches = await getAllMatches();
    for (const m of allMatches) {
      const homeS = scoreMatch(q, m.homeTeam.name);
      const awayS = scoreMatch(q, m.awayTeam.name);
      const matchScore = Math.max(homeS, awayS);

      // Team hits — dedupe by team id, keep best scoring instance, surface both teams.
      // Skip noisy variants (women's, U-teams, reserves) so the senior side
      // surfaces cleanly when a user searches "Marseille" / "Liverpool" etc.
      for (const t of [m.homeTeam, m.awayTeam]) {
        if (isNoisyTeamName(t.name)) continue;
        const ts = scoreMatch(q, t.name);
        if (ts <= 0) continue;
        if (!teamMap.has(t.id)) {
          teamMap.set(t.id, {
            type: 'team',
            id: t.id,
            title: t.name,
            subtitle: `${m.league.name} • ${m.league.country}`,
            href: teamHref(t.name, t.id),
            logoUrl: t.logo,
            sportSlug: m.sport?.slug,
          });
        }
      }

      if (matchScore > 0) {
        matchHits.push({
          type: 'match',
          id: m.id,
          title: `${m.homeTeam.name} vs ${m.awayTeam.name}`,
          subtitle: `${m.league.name}${m.status === 'live' ? ' • LIVE' : ''}`,
          href: `/matches/${m.id}`,
          status: m.status,
          kickoffIso: m.kickoffTime instanceof Date ? m.kickoffTime.toISOString() : new Date(m.kickoffTime).toISOString(),
        });
      }
    }
  } catch (err) {
    // Swallow — search should degrade, not crash.
    console.error('[search] match feed failed:', (err as Error).message);
  }

  matchHits.sort((a, b) => {
    // Live first, then soonest kickoff.
    if (a.type !== 'match' || b.type !== 'match') return 0;
    if (a.status === 'live' && b.status !== 'live') return -1;
    if (b.status === 'live' && a.status !== 'live') return 1;
    return (a.kickoffIso || '').localeCompare(b.kickoffIso || '');
  });

  const teamHits = Array.from(teamMap.values()).slice(0, limitPerKind);
  const trimmedMatches = matchHits.slice(0, limitPerKind);

  // ── 3. Tipsters (DB; gracefully empty if no DB) ──────────────────────
  let tipsterHits: SearchHit[] = [];
  try {
    const list = await query<DbTipsterRow>(
      `SELECT u.id AS user_id, u.username, u.display_name, u.avatar_url, u.is_verified,
              t.followers_count, t.is_pro
         FROM users u
         LEFT JOIN tipster_profiles t ON t.user_id = u.id
         WHERE u.role IN ('tipster','admin')
           AND (u.username LIKE ? OR u.display_name LIKE ?)
         ORDER BY t.followers_count DESC
         LIMIT ?`,
      [`%${rawQ}%`, `%${rawQ}%`, limitPerKind],
    );
    const rows = (list as unknown as { rows?: DbTipsterRow[] }).rows ?? (list as unknown as DbTipsterRow[]);
    tipsterHits = (rows || []).map(r => ({
      type: 'tipster' as const,
      id: String(r.user_id),
      title: r.display_name || r.username,
      subtitle: `@${r.username}${r.is_pro ? ' • PRO' : ''}`,
      href: `/tipsters/${r.user_id}`,
      avatar: r.avatar_url,
      verified: !!r.is_verified,
    }));
  } catch {
    tipsterHits = [];
  }

  const hits: SearchHit[] = [
    ...trimmedMatches,
    ...leagueHits,
    ...teamHits,
    ...tipsterHits,
  ];

  return NextResponse.json({ q: rawQ, hits });
}
