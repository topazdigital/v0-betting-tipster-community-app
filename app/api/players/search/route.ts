import { NextRequest, NextResponse } from 'next/server';

// Player-only search — backs the Compare Players picker so users get athletes,
// not teams. We hit ESPN's public site search and filter to athlete results.
//
// ESPN endpoint shape (public, no key):
//   https://site.web.api.espn.com/apis/common/v3/search?query=mbappe&type=player&limit=10
// The response groups results into an array of "results" with a `type` and
// nested `contents` items. We normalise to a flat list the UI understands.

export const dynamic = 'force-dynamic';
export const revalidate = 30;
export const runtime = 'nodejs';

interface EspnContent {
  uid?: string;
  id?: string;
  type?: string;
  displayName?: string;
  name?: string;
  shortName?: string;
  defaultLeague?: { name?: string };
  defaultTeam?: { displayName?: string; logo?: string; logos?: { href?: string }[] };
  position?: { displayName?: string; abbreviation?: string };
  image?: { default?: string; href?: string };
  link?: { web?: { href?: string } };
}

interface EspnSearchResult {
  type?: string;
  contents?: EspnContent[];
}

interface EspnSearchResponse {
  results?: EspnSearchResult[];
}

interface PlayerHit {
  id: string;
  name: string;
  position?: string;
  team?: string;
  teamLogo?: string;
  headshot?: string;
  href: string;
}

function pickHeadshot(c: EspnContent): string | undefined {
  return c.image?.default || c.image?.href || undefined;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') || '10', 10) || 10));

  if (q.length < 2) {
    return NextResponse.json({ q, hits: [] as PlayerHit[] });
  }

  // ESPN's search supports `type=player` to narrow to athletes. We also call
  // with no `type` and filter client-side, because some sports return players
  // grouped under different result-set types.
  const url = `https://site.web.api.espn.com/apis/common/v3/search?query=${encodeURIComponent(q)}&type=player&limit=${limit * 2}`;

  let payload: EspnSearchResponse | null = null;
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'BetTipsPro/1.0 (+https://bettipspro.com)' },
      next: { revalidate: 30 },
    });
    if (r.ok) payload = (await r.json()) as EspnSearchResponse;
  } catch (err) {
    console.warn('[players/search] ESPN fetch failed:', (err as Error).message);
  }

  const hits: PlayerHit[] = [];
  const seen = new Set<string>();

  for (const result of payload?.results || []) {
    const tag = (result.type || '').toLowerCase();
    if (tag && !tag.includes('player') && !tag.includes('athlete')) continue;
    for (const c of result.contents || []) {
      const id = String(c.id || c.uid || '').replace(/^.*~a:/, '');
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const name = c.displayName || c.name || c.shortName;
      if (!name) continue;
      hits.push({
        id,
        name,
        position: c.position?.displayName || c.position?.abbreviation,
        team: c.defaultTeam?.displayName,
        teamLogo: c.defaultTeam?.logo || c.defaultTeam?.logos?.[0]?.href,
        headshot: pickHeadshot(c),
        href: `/players/${id}`,
      });
      if (hits.length >= limit) break;
    }
    if (hits.length >= limit) break;
  }

  return NextResponse.json({ q, hits });
}
