import { NextRequest, NextResponse } from 'next/server';
import {
  getMatchById,
  fetchESPNSummary,
  getEspnLeagueConfigForId,
  getEspnEventIdFromMatchId,
  extractEspnOdds,
  type ESPNSummaryResponse,
} from '@/lib/api/unified-sports-api';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

interface RouteContext {
  params: Promise<{ id: string }>;
}

function americanToDecimal(american: number | string | undefined): number | undefined {
  if (american === undefined || american === null || american === '') return undefined;
  const n = typeof american === 'string' ? parseFloat(String(american).replace(/[^\d.\-+]/g, '')) : american;
  if (!Number.isFinite(n) || n === 0) return undefined;
  const decimal = n > 0 ? 1 + n / 100 : 1 + 100 / Math.abs(n);
  return Math.round(decimal * 100) / 100;
}

// Convert pickcenter providers to a sortable bookmaker odds list
function buildBookmakerOdds(summary: ESPNSummaryResponse, hasDraw: boolean) {
  const sources = [
    ...(summary.pickcenter || []),
    ...(summary.odds || []),
  ];
  const seen = new Set<string>();
  const list: Array<{
    bookmaker: string;
    home: number;
    draw?: number;
    away: number;
    spread?: { value: number; homePrice: number; awayPrice: number };
    total?: { value: number; overPrice: number; underPrice: number };
  }> = [];

  for (const o of sources) {
    const name = o.provider?.displayName || o.provider?.name;
    if (!name || seen.has(name)) continue;
    const home = americanToDecimal(o.homeTeamOdds?.moneyLine);
    const away = americanToDecimal(o.awayTeamOdds?.moneyLine);
    const draw = hasDraw ? americanToDecimal(o.drawOdds?.moneyLine) : undefined;
    if (!home || !away) continue;

    let spread: { value: number; homePrice: number; awayPrice: number } | undefined;
    if (o.spread !== undefined && o.homeTeamOdds?.spreadOdds !== undefined) {
      const homeSpread = americanToDecimal(o.homeTeamOdds.spreadOdds);
      const awaySpread = americanToDecimal(o.awayTeamOdds?.spreadOdds);
      if (homeSpread && awaySpread) spread = { value: o.spread, homePrice: homeSpread, awayPrice: awaySpread };
    }

    let total: { value: number; overPrice: number; underPrice: number } | undefined;
    if (o.overUnder !== undefined) {
      const overPrice = americanToDecimal(o.total?.over?.close?.odds || o.overOdds);
      const underPrice = americanToDecimal(o.total?.under?.close?.odds || o.underOdds);
      if (overPrice && underPrice) total = { value: o.overUnder, overPrice, underPrice };
    }

    seen.add(name);
    list.push({ bookmaker: name, home, draw, away, spread, total });
  }
  return list;
}

type RosterEntry = NonNullable<ESPNSummaryResponse['rosters']>[number];

function mapRoster(r: RosterEntry | undefined) {
  if (!r) return null;
  const players = (r.roster || []).map(p => ({
    name: p.athlete?.shortName || p.athlete?.displayName || 'Unknown',
    fullName: p.athlete?.displayName,
    position: p.position?.abbreviation || p.position?.name,
    jersey: p.jersey,
    starter: !!p.starter,
    headshot: p.athlete?.headshot,
  }));
  return {
    teamId: r.team?.id,
    teamName: r.team?.displayName,
    teamLogo: r.team?.logo,
    formation: r.formation,
    coach: r.coach?.[0] ? (r.coach[0].displayName || `${r.coach[0].firstName || ''} ${r.coach[0].lastName || ''}`.trim()) : undefined,
    starting: players.filter(p => p.starter),
    bench: players.filter(p => !p.starter),
  };
}

function buildLineups(summary: ESPNSummaryResponse) {
  if (!summary.rosters || summary.rosters.length === 0) return null;
  const home = summary.rosters.find(r => r.homeAway === 'home');
  const away = summary.rosters.find(r => r.homeAway === 'away');
  if (!home && !away) return null;
  return {
    home: mapRoster(home),
    away: mapRoster(away),
  };
}

function buildH2H(summary: ESPNSummaryResponse) {
  if (!summary.headToHeadGames || summary.headToHeadGames.length === 0) return null;
  // ESPN nests games per team — flatten unique games by date+score combination
  const seen = new Set<string>();
  const games: Array<{
    date: string;
    league?: string;
    home: { name: string; logo?: string; score?: number };
    away: { name: string; logo?: string; score?: number };
  }> = [];
  for (const teamGroup of summary.headToHeadGames) {
    for (const g of (teamGroup.games || [])) {
      const home = g.homeTeam;
      const away = g.awayTeam;
      if (!home || !away) continue;
      const key = `${g.gameDate}_${home.displayName}_${away.displayName}_${home.score}_${away.score}`;
      if (seen.has(key)) continue;
      seen.add(key);
      games.push({
        date: g.gameDate || '',
        league: g.league?.abbreviation,
        home: {
          name: home.displayName,
          logo: home.logo,
          score: home.score !== undefined ? parseInt(String(home.score), 10) : undefined,
        },
        away: {
          name: away.displayName,
          logo: away.logo,
          score: away.score !== undefined ? parseInt(String(away.score), 10) : undefined,
        },
      });
    }
  }
  // Sort by date desc
  games.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return games.slice(0, 10);
}

function buildStandings(summary: ESPNSummaryResponse) {
  if (!summary.standings?.groups || summary.standings.groups.length === 0) return null;
  const groups = summary.standings.groups.map(g => ({
    header: g.header,
    rows: (g.standings?.entries || []).map((e: unknown) => {
      const ent = e as { team?: unknown; id?: string; logo?: string; stats?: Array<{ name?: string; abbreviation?: string; value?: number; displayValue?: string }> };
      // ESPN sometimes returns team as a string (displayName), sometimes as an object
      const teamObj = typeof ent.team === 'object' && ent.team !== null ? ent.team as { id?: string; displayName?: string; logo?: string } : null;
      const teamName = teamObj?.displayName || (typeof ent.team === 'string' ? ent.team : '');
      const teamId = teamObj?.id || ent.id;
      const teamLogo = teamObj?.logo || ent.logo;
      const stat = (key: string) => ent.stats?.find(s => s.name === key || s.abbreviation === key);
      return {
        teamId,
        teamName,
        teamLogo,
        played: stat('gamesPlayed')?.value ?? stat('GP')?.value ?? 0,
        won: stat('wins')?.value ?? stat('W')?.value ?? 0,
        drawn: stat('ties')?.value ?? stat('D')?.value ?? 0,
        lost: stat('losses')?.value ?? stat('L')?.value ?? 0,
        goalsFor: stat('pointsFor')?.value ?? stat('GF')?.value,
        goalsAgainst: stat('pointsAgainst')?.value ?? stat('GA')?.value,
        goalDifference: stat('pointDifferential')?.value ?? stat('GD')?.value,
        points: stat('points')?.value ?? stat('PTS')?.value ?? 0,
        position: stat('rank')?.value,
      };
    }),
  }));
  return groups.filter(g => g.rows.length > 0);
}

function buildHeader(summary: ESPNSummaryResponse) {
  const competition = summary.header?.competitions?.[0];
  if (!competition) return null;
  const home = competition.competitors?.find(c => c.homeAway === 'home');
  const away = competition.competitors?.find(c => c.homeAway === 'away');
  return {
    home: home ? {
      id: home.team?.id,
      name: home.team?.displayName,
      logo: home.team?.logo,
      score: home.score,
      record: home.record?.find(r => r.type === 'total')?.summary,
      form: home.form,
    } : null,
    away: away ? {
      id: away.team?.id,
      name: away.team?.displayName,
      logo: away.team?.logo,
      score: away.score,
      record: away.record?.find(r => r.type === 'total')?.summary,
      form: away.form,
    } : null,
  };
}

function buildNews(summary: ESPNSummaryResponse) {
  if (!summary.news?.articles) return [];
  return summary.news.articles.slice(0, 8).map(a => ({
    headline: a.headline,
    description: a.description,
    published: a.published,
    image: a.images?.[0]?.url,
    link: a.links?.web?.href,
  }));
}

function buildLeaders(summary: ESPNSummaryResponse) {
  if (!summary.leaders) return [];
  return summary.leaders.flatMap(team =>
    (team.leaders || []).flatMap(category =>
      (category.leaders || []).slice(0, 1).map(l => ({
        team: team.team?.displayName,
        category: category.displayName || category.name,
        athlete: l.athlete?.displayName || l.athlete?.shortName,
        headshot: l.athlete?.headshot,
        value: l.displayValue,
      }))
    )
  );
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  try {
    const match = await getMatchById(id);
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const cfg = getEspnLeagueConfigForId(id);
    const eventId = getEspnEventIdFromMatchId(id);

    let summary: ESPNSummaryResponse | null = null;
    if (cfg && eventId) {
      summary = await fetchESPNSummary(cfg.sport, cfg.league, eventId);
    }

    const noDrawSports = ['basketball', 'baseball', 'mma', 'tennis', 'golf', 'racing'];
    const hasDraw = !noDrawSports.includes(cfg?.sportType || 'soccer');

    // Prefer richer pickcenter odds from summary if available; fall back to scoreboard odds already on match
    const summaryOddsList = [...(summary?.pickcenter || []), ...(summary?.odds || [])];
    const { odds: summaryOdds, markets: summaryMarkets } = extractEspnOdds(summaryOddsList, hasDraw);
    const finalOdds = summaryOdds || match.odds;
    const finalMarkets = summaryMarkets && summaryMarkets.length > 0 ? summaryMarkets : match.markets;

    const bookmakerOdds = summary ? buildBookmakerOdds(summary, hasDraw) : [];
    const lineups = summary ? buildLineups(summary) : null;
    const h2h = summary ? buildH2H(summary) : null;
    const standings = summary ? buildStandings(summary) : null;
    const news = summary ? buildNews(summary) : [];
    const leaders = summary ? buildLeaders(summary) : [];
    const header = summary ? buildHeader(summary) : null;

    const venue =
      summary?.gameInfo?.venue?.fullName ||
      match.venue ||
      undefined;
    const venueCity = summary?.gameInfo?.venue?.address?.city;
    const venueCountry = summary?.gameInfo?.venue?.address?.country;
    const attendance = summary?.gameInfo?.attendance;
    const broadcasts = (summary?.broadcasts || [])
      .map(b => b.media?.shortName)
      .filter((x): x is string => !!x);

    return NextResponse.json({
      match: {
        id: match.id,
        sportId: match.sportId,
        leagueId: match.leagueId,
        homeTeam: {
          ...match.homeTeam,
          form: header?.home?.form,
          record: header?.home?.record,
        },
        awayTeam: {
          ...match.awayTeam,
          form: header?.away?.form,
          record: header?.away?.record,
        },
        kickoffTime: new Date(match.kickoffTime).toISOString(),
        status: match.status,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        minute: match.minute,
        period: match.period,
        league: match.league,
        sport: match.sport,
        odds: finalOdds,
        markets: finalMarkets,
        venue,
        venueCity,
        venueCountry,
        attendance,
        broadcasts,
        source: match.source,
      },
      bookmakerOdds,
      lineups,
      h2h,
      standings,
      news,
      leaders,
      hasRealOdds: !!finalOdds,
      hasLineups: !!lineups,
      hasStandings: !!standings,
      hasH2H: !!h2h && h2h.length > 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Match details] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch match details' }, { status: 500 });
  }
}
