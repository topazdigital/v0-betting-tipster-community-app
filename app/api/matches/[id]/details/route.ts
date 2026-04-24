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
export const revalidate = 30;

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
  games.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return games.slice(0, 10);
}

function buildStandings(summary: ESPNSummaryResponse) {
  if (!summary.standings?.groups || summary.standings.groups.length === 0) return null;
  const groups = summary.standings.groups.map(g => ({
    header: g.header,
    rows: (g.standings?.entries || []).map((e: unknown) => {
      const ent = e as { team?: unknown; id?: string; logo?: string; stats?: Array<{ name?: string; abbreviation?: string; value?: number; displayValue?: string }> };
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

// ─── Sport-specific period / set / round / inning breakdown ──────────────────
// ESPN exposes `linescores[].value` per competitor for every game segment.
// Different sports have different segment counts and labels — basketball has
// quarters (Q1..Q4 + OT), football has innings (T1..T9), hockey has periods
// (P1..P3 + OT/SO), tennis has sets (S1..S5), MMA has rounds (R1..R5), etc.
// We compute readable labels here so the UI can render a single grid widget
// for any sport without conditional logic.
// ESPN can use either `value` (number) or `displayValue` (string) on linescores.
type LineScores = Array<{ value?: number; displayValue?: string }> | undefined;

interface SportSegmentBreakdown {
  variant: 'quarters' | 'periods' | 'innings' | 'sets' | 'rounds' | 'generic';
  labels: string[];
  home: number[];
  away: number[];
  totals?: { home: number; away: number };
}

function pickSegmentVariant(sportType: string): SportSegmentBreakdown['variant'] {
  switch (sportType) {
    case 'basketball':
    case 'american-football':
    case 'football': // ESPN sometimes labels American football "football"
      return 'quarters';
    case 'hockey':
    case 'ice-hockey':
      return 'periods';
    case 'baseball':
    case 'cricket':
      return 'innings';
    case 'tennis':
    case 'volleyball':
    case 'table-tennis':
      return 'sets';
    case 'mma':
    case 'boxing':
      return 'rounds';
    default:
      return 'generic';
  }
}

function makeSegmentLabels(variant: SportSegmentBreakdown['variant'], n: number, sportType: string): string[] {
  const labels: string[] = [];
  for (let i = 0; i < n; i++) {
    switch (variant) {
      case 'quarters': {
        // Basketball normally has 4 quarters then OT; American football is also 4 + OT.
        if (i < 4) labels.push(`Q${i + 1}`);
        else labels.push(n - i === 1 ? 'OT' : `OT${i - 3}`);
        break;
      }
      case 'periods': {
        if (i < 3) labels.push(`P${i + 1}`);
        else labels.push(i === 3 ? 'OT' : 'SO');
        break;
      }
      case 'innings': {
        // Baseball regulation = 9 innings; cricket usually 2.
        const max = sportType === 'cricket' ? 2 : 9;
        if (i < max) labels.push(`${i + 1}`);
        else labels.push(`${i + 1}`);
        break;
      }
      case 'sets':
        labels.push(`S${i + 1}`);
        break;
      case 'rounds':
        labels.push(`R${i + 1}`);
        break;
      default:
        labels.push(`${i + 1}`);
    }
  }
  return labels;
}

function buildSegmentBreakdown(summary: ESPNSummaryResponse, sportType: string): SportSegmentBreakdown | null {
  const competition = summary.header?.competitions?.[0];
  if (!competition) return null;
  const home = competition.competitors?.find(c => c.homeAway === 'home');
  const away = competition.competitors?.find(c => c.homeAway === 'away');
  const homeLs: LineScores = home?.linescores;
  const awayLs: LineScores = away?.linescores;
  if (!homeLs?.length && !awayLs?.length) return null;

  const len = Math.max(homeLs?.length || 0, awayLs?.length || 0);
  const variant = pickSegmentVariant(sportType);
  const labels = makeSegmentLabels(variant, len, sportType);
  const readVal = (ls: LineScores, i: number): number => {
    const slot = ls?.[i];
    if (!slot) return 0;
    if (typeof slot.value === 'number') return slot.value;
    if (slot.displayValue !== undefined) {
      const n = Number(String(slot.displayValue).replace(/[^\d-]/g, ''));
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };
  const homeArr = Array.from({ length: len }, (_, i) => readVal(homeLs, i));
  const awayArr = Array.from({ length: len }, (_, i) => readVal(awayLs, i));

  const homeTotal = home?.score ? Number(home.score) : homeArr.reduce((a, b) => a + b, 0);
  const awayTotal = away?.score ? Number(away.score) : awayArr.reduce((a, b) => a + b, 0);

  return {
    variant,
    labels,
    home: homeArr,
    away: awayArr,
    totals: { home: homeTotal, away: awayTotal },
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

export type MatchEventType = 'goal' | 'own_goal' | 'penalty_goal' | 'yellow_card' | 'red_card' | 'yellow_red_card' | 'substitution' | 'var' | 'other';

export interface MatchEvent {
  id: string;
  minute: string;
  type: MatchEventType;
  side: 'home' | 'away';
  playerName?: string;
  playerOut?: string;
  assistName?: string;
  homeScore?: number;
  awayScore?: number;
  description?: string;
  period?: number;
}

function parseClockMinute(clock?: { displayValue?: string; value?: number }): string {
  if (!clock) return '';
  if (clock.displayValue) {
    const parts = clock.displayValue.split(':');
    const mins = parseInt(parts[0] || '0', 10);
    return `${mins}'`;
  }
  if (clock.value !== undefined) {
    const mins = Math.floor(clock.value / 60);
    return `${mins}'`;
  }
  return '';
}

function detectEventType(typeText: string): MatchEventType {
  const t = (typeText || '').toLowerCase();
  if (t.includes('own goal') || t.includes('own-goal')) return 'own_goal';
  if (t.includes('penalty') && (t.includes('goal') || t.includes('score'))) return 'penalty_goal';
  if (t.includes('goal') || t.includes('score') || t.includes('touchdown') || t.includes('basket')) return 'goal';
  if (t.includes('red card') || t.includes('red-card') || t.includes('ejection') || t.includes('sent off')) return 'red_card';
  if (t.includes('yellow red') || t.includes('second yellow')) return 'yellow_red_card';
  if (t.includes('yellow card') || t.includes('yellow-card') || t.includes('caution') || t.includes('booking')) return 'yellow_card';
  if (t.includes('substitut') || t.includes('sub ') || t.includes('subs ')) return 'substitution';
  if (t.includes('var') || t.includes('review')) return 'var';
  return 'other';
}

function buildMatchEvents(summary: ESPNSummaryResponse, homeTeamId?: string, awayTeamId?: string): MatchEvent[] {
  const events: MatchEvent[] = [];
  const seen = new Set<string>();

  const getTeamSide = (teamId?: string): 'home' | 'away' => {
    if (!teamId) return 'home';
    if (homeTeamId && teamId === homeTeamId) return 'home';
    if (awayTeamId && teamId === awayTeamId) return 'away';
    return 'home';
  };

  // Process scoring plays first (goals)
  if (summary.scoringPlays) {
    for (const play of summary.scoringPlays) {
      const id = play.id || `sp-${events.length}`;
      if (seen.has(id)) continue;
      seen.add(id);

      const typeText = play.type?.text || play.type?.abbreviation || '';
      const eventType = detectEventType(typeText);
      const scorer = play.participants?.find(p => p.type?.name === 'scorer' || p.type?.name === 'athlete');
      const assister = play.participants?.find(p => p.type?.name === 'assister' || p.type?.name === 'assist');
      const side = getTeamSide(play.team?.id);
      const minute = parseClockMinute(play.clock);

      events.push({
        id,
        minute: minute || `${play.period?.number || 1}P`,
        type: eventType === 'other' ? 'goal' : eventType,
        side,
        playerName: scorer?.athlete?.displayName || scorer?.athlete?.shortName,
        assistName: assister?.athlete?.displayName || assister?.athlete?.shortName,
        homeScore: play.homeScore,
        awayScore: play.awayScore,
        description: play.text,
        period: play.period?.number,
      });
    }
  }

  // Process all plays for cards and substitutions
  if (summary.plays) {
    for (const play of summary.plays) {
      const id = play.id || `p-${events.length}`;
      if (seen.has(id)) continue;

      const typeText = play.type?.text || play.type?.abbreviation || '';
      const eventType = detectEventType(typeText);

      if (eventType === 'other' || eventType === 'goal' || eventType === 'penalty_goal' || eventType === 'own_goal') continue;

      seen.add(id);
      const side = getTeamSide(play.team?.id);
      const minute = parseClockMinute(play.clock);

      if (eventType === 'substitution') {
        const playerIn = play.participants?.[0];
        const playerOut = play.participants?.[1];
        events.push({
          id,
          minute: minute || `${play.period?.number || 1}P`,
          type: 'substitution',
          side,
          playerName: playerIn?.athlete?.displayName || playerIn?.athlete?.shortName,
          playerOut: playerOut?.athlete?.displayName || playerOut?.athlete?.shortName,
          homeScore: play.homeScore,
          awayScore: play.awayScore,
          period: play.period?.number,
        });
      } else {
        const player = play.participants?.[0];
        events.push({
          id,
          minute: minute || `${play.period?.number || 1}P`,
          type: eventType,
          side,
          playerName: player?.athlete?.displayName || player?.athlete?.shortName,
          homeScore: play.homeScore,
          awayScore: play.awayScore,
          period: play.period?.number,
        });
      }
    }
  }

  // Sort by minute numerically
  events.sort((a, b) => {
    const mA = parseInt(a.minute) || 0;
    const mB = parseInt(b.minute) || 0;
    return mA - mB;
  });

  return events;
}

function generateComputedOdds(homeTeamName: string, awayTeamName: string, sportType = 'soccer') {
  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };
  const matchHash = hashCode(homeTeamName + awayTeamName);
  const seed = (matchHash % 1000) / 1000;
  const noDrawSports = ['basketball', 'baseball', 'mma', 'tennis', 'golf', 'racing'];
  const homeAdv = sportType === 'basketball' ? 0.55 : sportType === 'soccer' ? 0.45 : 0.52;
  let homeProb = homeAdv + (seed - 0.5) * 0.3;
  const hasDraw = !noDrawSports.includes(sportType);
  let drawProb: number | undefined;
  let awayProb: number;
  if (hasDraw) {
    drawProb = 0.25 + (seed * 0.1);
    homeProb = Math.max(0.2, Math.min(0.55, homeProb));
    awayProb = 1 - homeProb - drawProb;
  } else {
    awayProb = 1 - homeProb;
  }
  const margin = 1.06;
  return {
    home: Math.round(Math.max(1.15, Math.min((margin / homeProb), 6.0)) * 100) / 100,
    draw: drawProb ? Math.round(Math.max(2.8, Math.min((margin / drawProb), 5.5)) * 100) / 100 : undefined,
    away: Math.round(Math.max(1.15, Math.min((margin / awayProb), 8.0)) * 100) / 100,
    bookmaker: 'Estimated',
    isComputed: true,
  };
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

    const summaryOddsList = [...(summary?.pickcenter || []), ...(summary?.odds || [])];
    const { odds: summaryOdds, markets: summaryMarkets } = extractEspnOdds(summaryOddsList, hasDraw);
    const realOdds = summaryOdds || match.odds;
    const finalMarkets = summaryMarkets && summaryMarkets.length > 0 ? summaryMarkets : match.markets;

    // Always ensure odds are present — fall back to computed estimates
    const finalOdds = realOdds || generateComputedOdds(
      match.homeTeam.name,
      match.awayTeam.name,
      cfg?.sportType || 'soccer'
    );

    const bookmakerOdds = summary ? buildBookmakerOdds(summary, hasDraw) : [];
    const lineups = summary ? buildLineups(summary) : null;
    const h2h = summary ? buildH2H(summary) : null;
    const standings = summary ? buildStandings(summary) : null;
    const news = summary ? buildNews(summary) : [];
    const leaders = summary ? buildLeaders(summary) : [];
    const header = summary ? buildHeader(summary) : null;

    // Extract home/away team IDs from header competitors for event attribution
    const competition = summary?.header?.competitions?.[0];
    const homeComp = competition?.competitors?.find(c => c.homeAway === 'home');
    const awayComp = competition?.competitors?.find(c => c.homeAway === 'away');
    const matchEvents = summary ? buildMatchEvents(summary, homeComp?.team?.id, awayComp?.team?.id) : [];
    const segmentBreakdown = summary ? buildSegmentBreakdown(summary, cfg?.sportType || 'soccer') : null;

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
          // espnId used to build team profile URL
          espnTeamId: match.homeTeam.id,
          leagueSlug: cfg?.league?.replace(/[^a-z0-9]/gi, '') || '',
        },
        awayTeam: {
          ...match.awayTeam,
          form: header?.away?.form,
          record: header?.away?.record,
          espnTeamId: match.awayTeam.id,
          leagueSlug: cfg?.league?.replace(/[^a-z0-9]/gi, '') || '',
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
        oddsIsComputed: !realOdds,
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
      matchEvents,
      segmentBreakdown,
      hasRealOdds: !!realOdds,
      hasLineups: !!lineups,
      hasStandings: !!standings,
      hasH2H: !!h2h && h2h.length > 0,
      hasEvents: matchEvents.length > 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Match details] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch match details' }, { status: 500 });
  }
}
