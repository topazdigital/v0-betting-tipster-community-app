import { NextRequest, NextResponse } from 'next/server';
import { getEspnLeagueConfigForId } from '@/lib/api/unified-sports-api';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

function parseTeamId(teamId: string): { sport: string; league: string; espnTeamId: string } | null {
  const m = teamId.match(/^espn_([a-z0-9]+)_(\d+)$/i);
  if (!m) return null;
  const leagueSlug = m[1];
  const espnTeamId = m[2];
  const fake = `espn_${leagueSlug}_999999`;
  const cfg = getEspnLeagueConfigForId(fake);
  if (!cfg) return null;
  return { sport: cfg.sport, league: cfg.league, espnTeamId };
}

async function fetchTeamInfo(sport: string, league: string, teamId: string) {
  const url = `${ESPN_BASE}/${sport}/${league}/teams/${teamId}`;
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' }, next: { revalidate: 300 } });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

async function fetchTeamSchedule(sport: string, league: string, teamId: string) {
  const url = `${ESPN_BASE}/${sport}/${league}/teams/${teamId}/schedule`;
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' }, next: { revalidate: 300 } });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

async function fetchTeamRoster(sport: string, league: string, teamId: string) {
  const url = `${ESPN_BASE}/${sport}/${league}/teams/${teamId}/roster`;
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' }, next: { revalidate: 600 } });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

async function fetchTeamInjuries(sport: string, league: string, teamId: string) {
  const url = `${ESPN_BASE}/${sport}/${league}/teams/${teamId}/injuries`;
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' }, next: { revalidate: 600 } });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

function mapStatus(state: string, completed: boolean): string {
  if (state === 'in') return 'live';
  if (completed || state === 'post') return 'finished';
  return 'scheduled';
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = parseTeamId(id);
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid team ID format' }, { status: 400 });
  }

  const { sport, league, espnTeamId } = parsed;

  const [teamData, scheduleData, rosterData, injuriesData] = await Promise.all([
    fetchTeamInfo(sport, league, espnTeamId),
    fetchTeamSchedule(sport, league, espnTeamId),
    fetchTeamRoster(sport, league, espnTeamId),
    fetchTeamInjuries(sport, league, espnTeamId),
  ]);

  if (!teamData?.team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  const t = teamData.team;
  const team = {
    id: t.id,
    name: t.displayName || t.name,
    shortName: t.abbreviation,
    nickname: t.nickname || t.shortDisplayName,
    logo: t.logos?.[0]?.href,
    color: t.color ? `#${t.color}` : undefined,
    alternateColor: t.alternateColor ? `#${t.alternateColor}` : undefined,
    location: t.location,
    venue: t.franchise?.venue?.fullName || t.venue?.fullName,
    venueCity: t.franchise?.venue?.address?.city || t.venue?.address?.city,
    founded: t.franchise?.yearFounded,
    record: t.record?.items?.find((r: { type?: string }) => r.type === 'total')?.summary,
    standing: {
      position: t.standingSummary,
    },
    links: {
      espn: t.links?.find((l: { rel?: string[] }) => l.rel?.includes('clubhouse'))?.href,
    },
  };

  // ESPN's team /schedule endpoint nests status, score, and logo deeply,
  // and the score field is an object `{ value, displayValue }` — not a string.
  // We normalise everything here so the team page always sees rich, real data.
  type CompTeam = { id: string; displayName?: string; abbreviation?: string; logo?: string; logos?: Array<{ href?: string; rel?: string[] }> };
  type CompScore = string | number | { value?: number; displayValue?: string };
  type Competitor = {
    homeAway: string;
    team?: CompTeam;
    score?: CompScore;
    winner?: boolean;
    records?: Array<{ type?: string; summary?: string }>;
  };
  type RawEvent = {
    id: string;
    date: string;
    name?: string;
    shortName?: string;
    status?: { type?: { state?: string; completed?: boolean } };
    competitions?: Array<{
      status?: { type?: { state?: string; completed?: boolean } };
      competitors?: Competitor[];
      odds?: Array<{
        details?: string;
        moneyline?: { home?: { close?: { odds?: string } }; away?: { close?: { odds?: string } }; draw?: { close?: { odds?: string } } };
        homeTeamOdds?: { moneyLine?: number };
        awayTeamOdds?: { moneyLine?: number };
        drawOdds?: { moneyLine?: number };
        provider?: { displayName?: string };
      }>;
      venue?: { fullName?: string };
    }>;
  };

  const readScore = (s: CompScore | undefined): number | null => {
    if (s === undefined || s === null) return null;
    if (typeof s === 'number') return s;
    if (typeof s === 'string') {
      const n = parseInt(s, 10);
      return Number.isFinite(n) ? n : null;
    }
    if (typeof s.value === 'number') return s.value;
    if (s.displayValue) {
      const n = parseInt(s.displayValue, 10);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const pickLogo = (t?: CompTeam): string | undefined => {
    if (!t) return undefined;
    if (t.logo) return t.logo;
    return t.logos?.find(l => l.rel?.includes('default') || l.rel?.includes('full'))?.href || t.logos?.[0]?.href;
  };

  const events = (scheduleData?.events || []).map((ev: RawEvent) => {
    const comp = ev.competitions?.[0];
    const home = comp?.competitors?.find(c => c.homeAway === 'home');
    const away = comp?.competitors?.find(c => c.homeAway === 'away');
    // Status lives on `competitions[0].status` (rich) but ESPN may also leave
    // a partial copy on the event itself. Try competition first.
    const statusType = comp?.status?.type || ev.status?.type;
    const statusState = statusType?.state || 'pre';
    const statusCompleted = !!statusType?.completed;
    const isHome = home?.team?.id === espnTeamId;
    const opponent = isHome ? away : home;
    const teamComp = isHome ? home : away;
    const opponentComp = isHome ? away : home;

    // Extract odds
    const rawOdds = comp?.odds?.[0];
    let odds: { home?: number; draw?: number; away?: number } | undefined;
    if (rawOdds) {
      const parseAmerican = (v?: string | number) => {
        if (v === undefined || v === null || v === '') return undefined;
        const n = typeof v === 'string' ? parseFloat(v.replace(/[^\d.\-+]/g, '')) : v;
        if (!isFinite(n) || n === 0) return undefined;
        const d = n > 0 ? 1 + n / 100 : 1 + 100 / Math.abs(n);
        return Math.round(d * 100) / 100;
      };
      const h = parseAmerican(rawOdds.moneyline?.home?.close?.odds ?? rawOdds.homeTeamOdds?.moneyLine);
      const a = parseAmerican(rawOdds.moneyline?.away?.close?.odds ?? rawOdds.awayTeamOdds?.moneyLine);
      const d = parseAmerican(rawOdds.moneyline?.draw?.close?.odds ?? rawOdds.drawOdds?.moneyLine);
      if (h && a) odds = { home: h, away: a, draw: d };
    }

    const teamScore = readScore(teamComp?.score);
    const oppScore = readScore(opponentComp?.score);
    const status = mapStatus(statusState, statusCompleted);

    return {
      id: `espn_${parsed.league.replace(/[^a-z0-9]/gi, '')}_${ev.id}`,
      espnEventId: ev.id,
      date: ev.date,
      name: ev.shortName || ev.name,
      status,
      isHome,
      opponent: opponent?.team ? {
        id: opponent.team.id,
        name: opponent.team.displayName,
        shortName: opponent.team.abbreviation,
        logo: pickLogo(opponent.team),
      } : null,
      score: teamScore !== null && oppScore !== null ? {
        team: teamScore,
        opponent: oppScore,
      } : null,
      result: statusCompleted
        ? (teamComp?.winner === true ? 'W' : opponentComp?.winner === true ? 'L' : 'D')
        : null,
      venue: comp?.venue?.fullName,
      odds: isHome ? odds : odds ? { home: odds.away, draw: odds.draw, away: odds.home } : undefined,
    };
  });

  // Sort by date so "past" is most-recent-first and "upcoming" is soonest-first.
  type EventOut = (typeof events)[number];
  const byDateAsc = (a: EventOut, b: EventOut) => new Date(a.date).getTime() - new Date(b.date).getTime();
  const byDateDesc = (a: EventOut, b: EventOut) => new Date(b.date).getTime() - new Date(a.date).getTime();
  const past = events
    .filter((e: EventOut) => e.status === 'finished')
    .sort(byDateDesc)
    .slice(0, 12);
  const upcoming = events
    .filter((e: EventOut) => e.status === 'scheduled' || e.status === 'live')
    .sort(byDateAsc)
    .slice(0, 12);

  // ----- Roster (multiple ESPN response shapes: athletes:[…] or athletes:[{position, items:[…]}]) -----
  type RawAthlete = {
    id?: string;
    fullName?: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    jersey?: string;
    age?: number;
    height?: number;
    weight?: number;
    headshot?: { href?: string } | string;
    position?: { abbreviation?: string; name?: string; displayName?: string };
    status?: { name?: string; type?: string };
    flag?: { href?: string; alt?: string };
    citizenship?: string;
  };
  const rawAthletes: RawAthlete[] = [];
  const rosterAthletes = rosterData?.athletes;
  if (Array.isArray(rosterAthletes)) {
    for (const group of rosterAthletes) {
      if (group?.items && Array.isArray(group.items)) {
        for (const a of group.items) rawAthletes.push(a);
      } else if (group?.id || group?.fullName || group?.displayName) {
        rawAthletes.push(group);
      }
    }
  }
  const roster = rawAthletes.map(a => {
    const headshotUrl = typeof a.headshot === 'string' ? a.headshot : a.headshot?.href;
    return {
      id: a.id,
      name: a.fullName || a.displayName || `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim(),
      jersey: a.jersey,
      position: a.position?.abbreviation || a.position?.displayName || a.position?.name,
      age: a.age,
      height: a.height,
      weight: a.weight,
      headshot: headshotUrl,
      country: a.citizenship,
      flag: a.flag?.href,
      status: a.status?.name || a.status?.type,
    };
  });

  // ----- Injuries -----
  type RawInjury = {
    athlete?: { id?: string; displayName?: string; headshot?: { href?: string } | string; position?: { abbreviation?: string } };
    type?: { description?: string; abbreviation?: string };
    status?: string;
    details?: { type?: string; location?: string; detail?: string; returnDate?: string };
    date?: string;
    longComment?: string;
    shortComment?: string;
  };
  const rawInjuries: RawInjury[] = [];
  const injuryGroups = injuriesData?.injuries;
  if (Array.isArray(injuryGroups)) {
    for (const g of injuryGroups) {
      if (Array.isArray(g?.injuries)) for (const i of g.injuries) rawInjuries.push(i);
      else if (g?.athlete) rawInjuries.push(g);
    }
  }
  const injuries = rawInjuries.map(i => {
    const head = typeof i.athlete?.headshot === 'string' ? i.athlete.headshot : i.athlete?.headshot?.href;
    return {
      playerId: i.athlete?.id,
      playerName: i.athlete?.displayName,
      headshot: head,
      position: i.athlete?.position?.abbreviation,
      status: i.status,
      type: i.type?.description || i.details?.type,
      location: i.details?.location,
      detail: i.details?.detail || i.shortComment,
      returnDate: i.details?.returnDate,
      reportedAt: i.date,
    };
  });

  return NextResponse.json({
    team,
    past,
    upcoming,
    roster,
    injuries,
    league: { sport, league },
    timestamp: new Date().toISOString(),
  });
}
