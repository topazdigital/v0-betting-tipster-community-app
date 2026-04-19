// ============================================
// Unified Sports API Service
// Combines The Odds API, SportsData.io, and Odds-API.io
// ============================================

import { ALL_SPORTS, ALL_LEAGUES, type SportConfig, type LeagueConfig } from '@/lib/sports-data';

// ============================================
// Types
// ============================================

export interface UnifiedMatch {
  id: string;
  externalId?: string;
  source: 'the-odds-api' | 'sportsdata-io' | 'odds-api-io' | 'fallback';
  sportId: number;
  sportKey: string;
  leagueId: number;
  leagueKey: string;
  homeTeam: {
    id: string;
    name: string;
    shortName: string;
    logo?: string;
  };
  awayTeam: {
    id: string;
    name: string;
    shortName: string;
    logo?: string;
  };
  kickoffTime: Date;
  status: 'scheduled' | 'live' | 'halftime' | 'finished' | 'postponed' | 'cancelled';
  homeScore: number | null;
  awayScore: number | null;
  minute?: number;
  period?: string;
  league: {
    id: number;
    name: string;
    slug: string;
    country: string;
    countryCode: string;
    tier: number;
  };
  sport: {
    id: number;
    name: string;
    slug: string;
    icon: string;
  };
  odds?: MatchOdds;
  markets?: Market[];
  tipsCount: number;
}

export interface MatchOdds {
  home: number;
  draw?: number;
  away: number;
  bookmaker?: string;
  lastUpdate?: Date;
}

export interface Market {
  key: string;
  name: string;
  outcomes: Outcome[];
}

export interface Outcome {
  name: string;
  price: number;
  point?: number;
}

export interface Standing {
  position: number;
  team: {
    id: string;
    name: string;
    logo?: string;
  };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form?: string[];
}

export interface Outright {
  id: string;
  name: string;
  outcomes: {
    name: string;
    price: number;
  }[];
}

// ============================================
// Sport Key Mapping
// ============================================

// The Odds API sport keys
const THE_ODDS_API_SPORTS: Record<string, { sportId: number; leagueId: number }> = {
  'soccer_epl': { sportId: 1, leagueId: 1 },
  'soccer_spain_la_liga': { sportId: 1, leagueId: 2 },
  'soccer_germany_bundesliga': { sportId: 1, leagueId: 3 },
  'soccer_italy_serie_a': { sportId: 1, leagueId: 4 },
  'soccer_france_ligue_one': { sportId: 1, leagueId: 5 },
  'soccer_netherlands_eredivisie': { sportId: 1, leagueId: 6 },
  'soccer_portugal_primeira_liga': { sportId: 1, leagueId: 7 },
  'soccer_uefa_champs_league': { sportId: 1, leagueId: 9 },
  'soccer_uefa_europa_league': { sportId: 1, leagueId: 10 },
  'soccer_usa_mls': { sportId: 1, leagueId: 11 },
  'soccer_brazil_serie_a': { sportId: 1, leagueId: 12 },
  'basketball_nba': { sportId: 2, leagueId: 101 },
  'basketball_euroleague': { sportId: 2, leagueId: 102 },
  'tennis_atp_aus_open': { sportId: 3, leagueId: 203 },
  'tennis_atp_french_open': { sportId: 3, leagueId: 203 },
  'tennis_atp_wimbledon': { sportId: 3, leagueId: 203 },
  'tennis_atp_us_open': { sportId: 3, leagueId: 203 },
  'americanfootball_nfl': { sportId: 5, leagueId: 401 },
  'americanfootball_ncaaf': { sportId: 5, leagueId: 402 },
  'baseball_mlb': { sportId: 6, leagueId: 501 },
  'icehockey_nhl': { sportId: 7, leagueId: 601 },
  'mma_mixed_martial_arts': { sportId: 27, leagueId: 2701 },
};

// SportsData.io sport endpoints
const SPORTSDATA_SPORTS: Record<string, { sportId: number; endpoint: string }> = {
  'nfl': { sportId: 5, endpoint: 'nfl' },
  'nba': { sportId: 2, endpoint: 'nba' },
  'mlb': { sportId: 6, endpoint: 'mlb' },
  'nhl': { sportId: 7, endpoint: 'nhl' },
  'soccer': { sportId: 1, endpoint: 'soccer' },
  'mma': { sportId: 27, endpoint: 'mma' },
};

// Odds-API.io sports
const ODDS_API_IO_SPORTS: Record<string, { sportId: number; leagueId: number }> = {
  'soccer': { sportId: 1, leagueId: 1 },
  'basketball': { sportId: 2, leagueId: 101 },
  'tennis': { sportId: 3, leagueId: 201 },
  'american-football': { sportId: 5, leagueId: 401 },
  'baseball': { sportId: 6, leagueId: 501 },
  'ice-hockey': { sportId: 7, leagueId: 601 },
  'mma': { sportId: 27, leagueId: 2701 },
};

// ============================================
// API Clients
// ============================================

const CACHE_DURATION = {
  live: 30 * 1000, // 30 seconds for live data
  upcoming: 5 * 60 * 1000, // 5 minutes for upcoming
  standings: 15 * 60 * 1000, // 15 minutes for standings
  outrights: 30 * 60 * 1000, // 30 minutes for outrights
};

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();

function getCached<T>(key: string, duration: number): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < duration) {
    return cached.data as T;
  }
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// ============================================
// The Odds API Client
// ============================================

export async function fetchTheOddsAPI(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<unknown> {
  const apiKey = process.env.THE_ODDS_API_KEY;
  if (!apiKey) {
    console.warn('[UnifiedAPI] THE_ODDS_API_KEY not configured');
    return null;
  }

  const url = new URL(`https://api.the-odds-api.com/v4/${endpoint}`);
  url.searchParams.set('apiKey', apiKey);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  try {
    const response = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error(`[TheOddsAPI] Error: ${response.status}`);
      return null;
    }

    // Log remaining quota
    const remaining = response.headers.get('x-requests-remaining');
    const used = response.headers.get('x-requests-used');
    console.log(`[TheOddsAPI] Quota: ${remaining} remaining, ${used} used`);

    return await response.json();
  } catch (error) {
    console.error('[TheOddsAPI] Fetch error:', error);
    return null;
  }
}

// Get available sports from The Odds API
export async function getTheOddsAPISports(): Promise<string[]> {
  const cacheKey = 'the-odds-api-sports';
  const cached = getCached<string[]>(cacheKey, CACHE_DURATION.standings);
  if (cached) return cached;

  const data = await fetchTheOddsAPI('sports');
  if (!data || !Array.isArray(data)) return [];

  const sports = data.map((s: { key: string }) => s.key);
  setCache(cacheKey, sports);
  return sports;
}

// Get odds from The Odds API
export async function getTheOddsAPIMatches(
  sportKey: string,
  markets: string = 'h2h,spreads,totals'
): Promise<UnifiedMatch[]> {
  const cacheKey = `the-odds-api-${sportKey}`;
  const cached = getCached<UnifiedMatch[]>(cacheKey, CACHE_DURATION.upcoming);
  if (cached) return cached;

  const data = await fetchTheOddsAPI(`sports/${sportKey}/odds`, {
    regions: 'us,uk,eu',
    markets,
    oddsFormat: 'decimal',
  });

  if (!data || !Array.isArray(data)) return [];

  const sportMapping = THE_ODDS_API_SPORTS[sportKey];
  const sportConfig = sportMapping 
    ? ALL_SPORTS.find(s => s.id === sportMapping.sportId)
    : null;
  const leagueConfig = sportMapping
    ? ALL_LEAGUES.find(l => l.id === sportMapping.leagueId)
    : null;

  const matches: UnifiedMatch[] = data.map((event: {
    id: string;
    sport_key: string;
    sport_title: string;
    commence_time: string;
    home_team: string;
    away_team: string;
    bookmakers?: Array<{
      key: string;
      title: string;
      markets: Array<{
        key: string;
        outcomes: Array<{
          name: string;
          price: number;
          point?: number;
        }>;
      }>;
    }>;
  }) => {
    // Extract best odds from bookmakers
    let bestOdds: MatchOdds | undefined;
    const markets: Market[] = [];

    if (event.bookmakers && event.bookmakers.length > 0) {
      // Find best h2h odds
      for (const bookmaker of event.bookmakers) {
        const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
        if (h2hMarket) {
          const homeOutcome = h2hMarket.outcomes.find(o => o.name === event.home_team);
          const awayOutcome = h2hMarket.outcomes.find(o => o.name === event.away_team);
          const drawOutcome = h2hMarket.outcomes.find(o => o.name === 'Draw');

          if (homeOutcome && awayOutcome) {
            if (!bestOdds || homeOutcome.price > bestOdds.home) {
              bestOdds = {
                home: homeOutcome.price,
                draw: drawOutcome?.price,
                away: awayOutcome.price,
                bookmaker: bookmaker.title,
              };
            }
          }
        }

        // Collect all markets
        for (const market of bookmaker.markets) {
          const existingMarket = markets.find(m => m.key === market.key);
          if (!existingMarket) {
            markets.push({
              key: market.key,
              name: getMarketName(market.key),
              outcomes: market.outcomes.map(o => ({
                name: o.name,
                price: o.price,
                point: o.point,
              })),
            });
          }
        }
      }
    }

    return {
      id: `toa_${event.id}`,
      externalId: event.id,
      source: 'the-odds-api' as const,
      sportId: sportMapping?.sportId || 1,
      sportKey: event.sport_key,
      leagueId: sportMapping?.leagueId || 1,
      leagueKey: event.sport_key,
      homeTeam: {
        id: generateTeamId(event.home_team),
        name: event.home_team,
        shortName: getShortName(event.home_team),
      },
      awayTeam: {
        id: generateTeamId(event.away_team),
        name: event.away_team,
        shortName: getShortName(event.away_team),
      },
      kickoffTime: new Date(event.commence_time),
      status: getMatchStatus(new Date(event.commence_time)),
      homeScore: null,
      awayScore: null,
      league: leagueConfig ? {
        id: leagueConfig.id,
        name: leagueConfig.name,
        slug: leagueConfig.slug,
        country: leagueConfig.country,
        countryCode: leagueConfig.countryCode,
        tier: leagueConfig.tier,
      } : {
        id: 0,
        name: event.sport_title,
        slug: event.sport_key,
        country: 'World',
        countryCode: 'WO',
        tier: 1,
      },
      sport: sportConfig ? {
        id: sportConfig.id,
        name: sportConfig.name,
        slug: sportConfig.slug,
        icon: sportConfig.icon,
      } : {
        id: 1,
        name: 'Football',
        slug: 'football',
        icon: 'soccer',
      },
      odds: bestOdds,
      markets,
      tipsCount: 0,
    };
  });

  setCache(cacheKey, matches);
  return matches;
}

// ============================================
// SportsData.io Client
// ============================================

export async function fetchSportsDataIO(
  sport: string,
  endpoint: string
): Promise<unknown> {
  const apiKey = process.env.SPORTSDATA_IO_KEY;
  if (!apiKey) {
    console.warn('[UnifiedAPI] SPORTSDATA_IO_KEY not configured');
    return null;
  }

  // Different base URLs for different sports
  const baseUrls: Record<string, string> = {
    nfl: 'https://api.sportsdata.io/v3/nfl',
    nba: 'https://api.sportsdata.io/v3/nba',
    mlb: 'https://api.sportsdata.io/v3/mlb',
    nhl: 'https://api.sportsdata.io/v3/nhl',
    soccer: 'https://api.sportsdata.io/v4/soccer',
    mma: 'https://api.sportsdata.io/v3/mma',
  };

  const baseUrl = baseUrls[sport];
  if (!baseUrl) return null;

  const url = `${baseUrl}/${endpoint}?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      headers: { 'Ocp-Apim-Subscription-Key': apiKey },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error(`[SportsDataIO] Error: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[SportsDataIO] Fetch error:', error);
    return null;
  }
}

// Get NFL games
export async function getSportsDataIONFLGames(): Promise<UnifiedMatch[]> {
  const cacheKey = 'sportsdata-nfl-games';
  const cached = getCached<UnifiedMatch[]>(cacheKey, CACHE_DURATION.upcoming);
  if (cached) return cached;

  // Get current season schedule
  const data = await fetchSportsDataIO('nfl', 'scores/json/ScoresByWeek/2025/1');
  if (!data || !Array.isArray(data)) return [];

  const matches: UnifiedMatch[] = data.map((game: {
    GameKey: string;
    Date: string;
    HomeTeam: string;
    AwayTeam: string;
    HomeTeamName?: string;
    AwayTeamName?: string;
    HomeScore?: number;
    AwayScore?: number;
    Status: string;
    Quarter?: string;
    TimeRemainingMinutes?: number;
  }) => ({
    id: `sdio_nfl_${game.GameKey}`,
    externalId: game.GameKey,
    source: 'sportsdata-io' as const,
    sportId: 5,
    sportKey: 'nfl',
    leagueId: 401,
    leagueKey: 'nfl',
    homeTeam: {
      id: generateTeamId(game.HomeTeam),
      name: game.HomeTeamName || game.HomeTeam,
      shortName: game.HomeTeam,
    },
    awayTeam: {
      id: generateTeamId(game.AwayTeam),
      name: game.AwayTeamName || game.AwayTeam,
      shortName: game.AwayTeam,
    },
    kickoffTime: new Date(game.Date),
    status: mapSportsDataIOStatus(game.Status),
    homeScore: game.HomeScore ?? null,
    awayScore: game.AwayScore ?? null,
    minute: game.TimeRemainingMinutes,
    period: game.Quarter,
    league: {
      id: 401,
      name: 'NFL',
      slug: 'nfl',
      country: 'USA',
      countryCode: 'US',
      tier: 1,
    },
    sport: {
      id: 5,
      name: 'American Football',
      slug: 'american-football',
      icon: 'football',
    },
    tipsCount: 0,
  }));

  setCache(cacheKey, matches);
  return matches;
}

// Get NBA games
export async function getSportsDataIONBAGames(): Promise<UnifiedMatch[]> {
  const cacheKey = 'sportsdata-nba-games';
  const cached = getCached<UnifiedMatch[]>(cacheKey, CACHE_DURATION.upcoming);
  if (cached) return cached;

  const today = new Date().toISOString().split('T')[0];
  const data = await fetchSportsDataIO('nba', `scores/json/GamesByDate/${today}`);
  if (!data || !Array.isArray(data)) return [];

  const matches: UnifiedMatch[] = data.map((game: {
    GameID: number;
    DateTime: string;
    HomeTeam: string;
    AwayTeam: string;
    HomeTeamName?: string;
    AwayTeamName?: string;
    HomeTeamScore?: number;
    AwayTeamScore?: number;
    Status: string;
    Quarter?: string;
    TimeRemainingMinutes?: number;
  }) => ({
    id: `sdio_nba_${game.GameID}`,
    externalId: String(game.GameID),
    source: 'sportsdata-io' as const,
    sportId: 2,
    sportKey: 'nba',
    leagueId: 101,
    leagueKey: 'nba',
    homeTeam: {
      id: generateTeamId(game.HomeTeam),
      name: game.HomeTeamName || game.HomeTeam,
      shortName: game.HomeTeam,
    },
    awayTeam: {
      id: generateTeamId(game.AwayTeam),
      name: game.AwayTeamName || game.AwayTeam,
      shortName: game.AwayTeam,
    },
    kickoffTime: new Date(game.DateTime),
    status: mapSportsDataIOStatus(game.Status),
    homeScore: game.HomeTeamScore ?? null,
    awayScore: game.AwayTeamScore ?? null,
    minute: game.TimeRemainingMinutes,
    period: game.Quarter,
    league: {
      id: 101,
      name: 'NBA',
      slug: 'nba',
      country: 'USA',
      countryCode: 'US',
      tier: 1,
    },
    sport: {
      id: 2,
      name: 'Basketball',
      slug: 'basketball',
      icon: 'basketball',
    },
    tipsCount: 0,
  }));

  setCache(cacheKey, matches);
  return matches;
}

// Get MMA events
export async function getSportsDataIOMMAEvents(): Promise<UnifiedMatch[]> {
  const cacheKey = 'sportsdata-mma-events';
  const cached = getCached<UnifiedMatch[]>(cacheKey, CACHE_DURATION.upcoming);
  if (cached) return cached;

  const data = await fetchSportsDataIO('mma', 'scores/json/Schedule/UFC/2025');
  if (!data || !Array.isArray(data)) return [];

  const matches: UnifiedMatch[] = data.flatMap((event: {
    EventId: number;
    Name: string;
    DateTime: string;
    Fights?: Array<{
      FightId: number;
      Fighters: Array<{
        FighterId: number;
        FirstName: string;
        LastName: string;
        Moneyline?: number;
      }>;
      Status: string;
    }>;
  }) => {
    if (!event.Fights) return [];
    
    return event.Fights.map(fight => ({
      id: `sdio_mma_${fight.FightId}`,
      externalId: String(fight.FightId),
      source: 'sportsdata-io' as const,
      sportId: 27,
      sportKey: 'mma',
      leagueId: 2701,
      leagueKey: 'ufc',
      homeTeam: {
        id: String(fight.Fighters[0]?.FighterId || 0),
        name: `${fight.Fighters[0]?.FirstName} ${fight.Fighters[0]?.LastName}`,
        shortName: fight.Fighters[0]?.LastName?.substring(0, 3).toUpperCase() || 'FTR',
      },
      awayTeam: {
        id: String(fight.Fighters[1]?.FighterId || 0),
        name: `${fight.Fighters[1]?.FirstName} ${fight.Fighters[1]?.LastName}`,
        shortName: fight.Fighters[1]?.LastName?.substring(0, 3).toUpperCase() || 'FTR',
      },
      kickoffTime: new Date(event.DateTime),
      status: mapSportsDataIOStatus(fight.Status),
      homeScore: null,
      awayScore: null,
      league: {
        id: 2701,
        name: event.Name || 'UFC',
        slug: 'ufc',
        country: 'World',
        countryCode: 'WO',
        tier: 1,
      },
      sport: {
        id: 27,
        name: 'MMA',
        slug: 'mma',
        icon: 'mma',
      },
      odds: fight.Fighters[0]?.Moneyline && fight.Fighters[1]?.Moneyline ? {
        home: convertMoneylineToDecimal(fight.Fighters[0].Moneyline),
        away: convertMoneylineToDecimal(fight.Fighters[1].Moneyline),
      } : undefined,
      tipsCount: 0,
    }));
  });

  setCache(cacheKey, matches);
  return matches;
}

// ============================================
// Odds-API.io Client
// ============================================

export async function fetchOddsAPIIO(
  endpoint: string
): Promise<unknown> {
  const apiKey = process.env.ODDS_API_IO_KEY;
  if (!apiKey) {
    console.warn('[UnifiedAPI] ODDS_API_IO_KEY not configured');
    return null;
  }

  const url = `https://api.odds-api.io/v1/${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error(`[OddsAPIIO] Error: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[OddsAPIIO] Fetch error:', error);
    return null;
  }
}

// Get matches from Odds-API.io
export async function getOddsAPIIOMatches(sport: string = 'soccer'): Promise<UnifiedMatch[]> {
  const cacheKey = `odds-api-io-${sport}`;
  const cached = getCached<UnifiedMatch[]>(cacheKey, CACHE_DURATION.upcoming);
  if (cached) return cached;

  const data = await fetchOddsAPIIO(`odds/${sport}/upcoming`);
  if (!data || typeof data !== 'object') return [];

  const events = (data as { events?: unknown[] }).events;
  if (!Array.isArray(events)) return [];

  const sportMapping = ODDS_API_IO_SPORTS[sport];

  const matches: UnifiedMatch[] = events.map((event: {
    id: string;
    home_team: string;
    away_team: string;
    commence_time: string;
    league?: string;
    odds?: {
      h2h?: number[];
    };
  }) => ({
    id: `oaio_${event.id}`,
    externalId: event.id,
    source: 'odds-api-io' as const,
    sportId: sportMapping?.sportId || 1,
    sportKey: sport,
    leagueId: sportMapping?.leagueId || 1,
    leagueKey: event.league || sport,
    homeTeam: {
      id: generateTeamId(event.home_team),
      name: event.home_team,
      shortName: getShortName(event.home_team),
    },
    awayTeam: {
      id: generateTeamId(event.away_team),
      name: event.away_team,
      shortName: getShortName(event.away_team),
    },
    kickoffTime: new Date(event.commence_time),
    status: getMatchStatus(new Date(event.commence_time)),
    homeScore: null,
    awayScore: null,
    league: {
      id: sportMapping?.leagueId || 1,
      name: event.league || 'League',
      slug: (event.league || sport).toLowerCase().replace(/\s+/g, '-'),
      country: 'World',
      countryCode: 'WO',
      tier: 1,
    },
    sport: {
      id: sportMapping?.sportId || 1,
      name: sport.charAt(0).toUpperCase() + sport.slice(1),
      slug: sport,
      icon: sport,
    },
    odds: event.odds?.h2h ? {
      home: event.odds.h2h[0],
      draw: event.odds.h2h[2],
      away: event.odds.h2h[1],
    } : undefined,
    tipsCount: 0,
  }));

  setCache(cacheKey, matches);
  return matches;
}

// ============================================
// Unified API - Combines All Sources
// ============================================

export async function getAllMatches(): Promise<UnifiedMatch[]> {
  const allMatches: UnifiedMatch[] = [];
  const seenMatchKeys = new Set<string>();

  // Helper to create unique match key for deduplication
  const getMatchKey = (match: UnifiedMatch): string => {
    const homeNorm = normalizeTeamName(match.homeTeam.name);
    const awayNorm = normalizeTeamName(match.awayTeam.name);
    const dateKey = new Date(match.kickoffTime).toISOString().split('T')[0];
    return `${homeNorm}_${awayNorm}_${dateKey}`;
  };

  // Add match with deduplication
  const addMatch = (match: UnifiedMatch) => {
    const key = getMatchKey(match);
    if (!seenMatchKeys.has(key)) {
      seenMatchKeys.add(key);
      allMatches.push(match);
    }
  };

  // Fetch from all sources in parallel
  const [
    theOddsAPIEPL,
    theOddsAPILaLiga,
    theOddsAPIBundesliga,
    theOddsAPINBA,
    theOddsAPINFL,
    theOddsAPINHL,
    theOddsAPIMLB,
    theOddsAPIMMA,
    sportsDataNFL,
    sportsDataNBA,
    sportsDataMMA,
    oddsAPIIOSoccer,
  ] = await Promise.allSettled([
    getTheOddsAPIMatches('soccer_epl'),
    getTheOddsAPIMatches('soccer_spain_la_liga'),
    getTheOddsAPIMatches('soccer_germany_bundesliga'),
    getTheOddsAPIMatches('basketball_nba'),
    getTheOddsAPIMatches('americanfootball_nfl'),
    getTheOddsAPIMatches('icehockey_nhl'),
    getTheOddsAPIMatches('baseball_mlb'),
    getTheOddsAPIMatches('mma_mixed_martial_arts'),
    getSportsDataIONFLGames(),
    getSportsDataIONBAGames(),
    getSportsDataIOMMAEvents(),
    getOddsAPIIOMatches('soccer'),
  ]);

  // Process results
  const results = [
    theOddsAPIEPL,
    theOddsAPILaLiga,
    theOddsAPIBundesliga,
    theOddsAPINBA,
    theOddsAPINFL,
    theOddsAPINHL,
    theOddsAPIMLB,
    theOddsAPIMMA,
    sportsDataNFL,
    sportsDataNBA,
    sportsDataMMA,
    oddsAPIIOSoccer,
  ];

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      for (const match of result.value) {
        addMatch(match);
      }
    }
  }

  // Sort by sport priority, then status, then time
  return sortMatchesWithPriority(allMatches);
}

export async function getMatchesBySport(sportId: number): Promise<UnifiedMatch[]> {
  const allMatches = await getAllMatches();
  return allMatches.filter(m => m.sportId === sportId);
}

export async function getMatchesByLeague(leagueId: number): Promise<UnifiedMatch[]> {
  const allMatches = await getAllMatches();
  return allMatches.filter(m => m.leagueId === leagueId);
}

export async function getLiveMatches(): Promise<UnifiedMatch[]> {
  const allMatches = await getAllMatches();
  return allMatches.filter(m => m.status === 'live' || m.status === 'halftime');
}

export async function getUpcomingMatches(): Promise<UnifiedMatch[]> {
  const allMatches = await getAllMatches();
  const now = new Date();
  return allMatches
    .filter(m => m.status === 'scheduled' && new Date(m.kickoffTime) > now)
    .sort((a, b) => new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime());
}

// ============================================
// Standings API
// ============================================

export async function getLeagueStandings(leagueId: number): Promise<Standing[]> {
  const cacheKey = `standings-${leagueId}`;
  const cached = getCached<Standing[]>(cacheKey, CACHE_DURATION.standings);
  if (cached) return cached;

  // Map league IDs to API endpoints
  const league = ALL_LEAGUES.find(l => l.id === leagueId);
  if (!league) return [];

  // For US sports, use SportsData.io
  if ([401, 101, 501, 601].includes(leagueId)) {
    const sportEndpoints: Record<number, string> = {
      401: 'nfl/scores/json/Standings/2025',
      101: 'nba/scores/json/Standings/2025',
      501: 'mlb/scores/json/Standings/2025',
      601: 'nhl/scores/json/Standings/2025',
    };

    const endpoint = sportEndpoints[leagueId];
    if (endpoint) {
      const sport = endpoint.split('/')[0];
      const path = endpoint.replace(`${sport}/`, '');
      const data = await fetchSportsDataIO(sport, path);
      
      if (data && Array.isArray(data)) {
        const standings = mapSportsDataIOStandings(data, leagueId);
        setCache(cacheKey, standings);
        return standings;
      }
    }
  }

  // Return empty for now - would implement soccer standings via API
  return [];
}

// ============================================
// Outrights API
// ============================================

export async function getLeagueOutrights(leagueId: number): Promise<Outright[]> {
  const cacheKey = `outrights-${leagueId}`;
  const cached = getCached<Outright[]>(cacheKey, CACHE_DURATION.outrights);
  if (cached) return cached;

  const league = ALL_LEAGUES.find(l => l.id === leagueId);
  if (!league) return [];

  // Get outrights from The Odds API
  const sportKey = getTheOddsAPISportKey(leagueId);
  if (sportKey) {
    const data = await fetchTheOddsAPI(`sports/${sportKey}/odds`, {
      regions: 'us,uk,eu',
      markets: 'outrights',
      oddsFormat: 'decimal',
    });

    if (data && Array.isArray(data)) {
      const outrights = mapOutrights(data);
      setCache(cacheKey, outrights);
      return outrights;
    }
  }

  return [];
}

// ============================================
// Helper Functions
// ============================================

function generateTeamId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

function getShortName(name: string): string {
  // Handle specific team name patterns
  const words = name.split(' ');
  if (words.length === 1) return name.substring(0, 3).toUpperCase();
  if (words.length === 2) {
    return (words[0][0] + words[1].substring(0, 2)).toUpperCase();
  }
  return words.map(w => w[0]).join('').substring(0, 3).toUpperCase();
}

function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/fc|sc|afc|cf|ac|as|ss|us|rc|/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function getMatchStatus(kickoffTime: Date): UnifiedMatch['status'] {
  const now = new Date();
  const diff = kickoffTime.getTime() - now.getTime();
  
  if (diff > 0) return 'scheduled';
  if (diff > -2 * 60 * 60 * 1000) return 'live'; // Within 2 hours
  return 'finished';
}

function mapSportsDataIOStatus(status: string): UnifiedMatch['status'] {
  const statusMap: Record<string, UnifiedMatch['status']> = {
    'Scheduled': 'scheduled',
    'InProgress': 'live',
    'Final': 'finished',
    'Postponed': 'postponed',
    'Canceled': 'cancelled',
    'Halftime': 'halftime',
  };
  return statusMap[status] || 'scheduled';
}

function convertMoneylineToDecimal(moneyline: number): number {
  if (moneyline > 0) {
    return Math.round((moneyline / 100 + 1) * 100) / 100;
  } else {
    return Math.round((100 / Math.abs(moneyline) + 1) * 100) / 100;
  }
}

function getMarketName(key: string): string {
  const names: Record<string, string> = {
    'h2h': 'Match Winner',
    'spreads': 'Handicap',
    'totals': 'Over/Under',
    'outrights': 'Outright Winner',
  };
  return names[key] || key;
}

function getTheOddsAPISportKey(leagueId: number): string | null {
  const mapping: Record<number, string> = {
    1: 'soccer_epl',
    2: 'soccer_spain_la_liga',
    3: 'soccer_germany_bundesliga',
    4: 'soccer_italy_serie_a',
    5: 'soccer_france_ligue_one',
    9: 'soccer_uefa_champs_league',
    10: 'soccer_uefa_europa_league',
    101: 'basketball_nba',
    401: 'americanfootball_nfl',
    501: 'baseball_mlb',
    601: 'icehockey_nhl',
  };
  return mapping[leagueId] || null;
}

function mapSportsDataIOStandings(data: unknown[], leagueId: number): Standing[] {
  // Generic mapping for SportsData.io standings
  return (data as Array<{
    TeamID?: number;
    Team?: string;
    Name?: string;
    Wins?: number;
    Losses?: number;
    Ties?: number;
    Percentage?: number;
    PointsFor?: number;
    PointsAgainst?: number;
  }>).map((team, index) => ({
    position: index + 1,
    team: {
      id: String(team.TeamID || index),
      name: team.Name || team.Team || 'Unknown',
    },
    played: (team.Wins || 0) + (team.Losses || 0) + (team.Ties || 0),
    won: team.Wins || 0,
    drawn: team.Ties || 0,
    lost: team.Losses || 0,
    goalsFor: team.PointsFor || 0,
    goalsAgainst: team.PointsAgainst || 0,
    goalDifference: (team.PointsFor || 0) - (team.PointsAgainst || 0),
    points: (team.Wins || 0) * 3 + (team.Ties || 0),
  }));
}

function mapOutrights(data: unknown[]): Outright[] {
  // Map outright odds data
  return (data as Array<{
    id: string;
    bookmakers?: Array<{
      markets?: Array<{
        key: string;
        outcomes: Array<{ name: string; price: number }>;
      }>;
    }>;
  }>).filter(event => {
    return event.bookmakers?.some(b => 
      b.markets?.some(m => m.key === 'outrights')
    );
  }).map(event => {
    const outcomes: { name: string; price: number }[] = [];
    
    for (const bookmaker of event.bookmakers || []) {
      const market = bookmaker.markets?.find(m => m.key === 'outrights');
      if (market) {
        for (const outcome of market.outcomes) {
          const existing = outcomes.find(o => o.name === outcome.name);
          if (!existing || outcome.price > existing.price) {
            if (existing) {
              existing.price = outcome.price;
            } else {
              outcomes.push({ name: outcome.name, price: outcome.price });
            }
          }
        }
      }
    }

    return {
      id: event.id,
      name: 'Outright Winner',
      outcomes: outcomes.sort((a, b) => a.price - b.price),
    };
  });
}

// Sport priority for sorting
const SPORT_PRIORITY: Record<number, number> = {
  1: 0,   // Football - highest priority
  2: 1,   // Basketball
  3: 2,   // Tennis
  4: 3,   // Cricket
  5: 4,   // American Football
  6: 5,   // Baseball
  7: 6,   // Ice Hockey
  8: 7,   // Rugby
  27: 8,  // MMA
  26: 9,  // Boxing
  29: 10, // Formula 1
  33: 11, // Esports
};

export function sortMatchesWithPriority(matches: UnifiedMatch[]): UnifiedMatch[] {
  return matches.sort((a, b) => {
    // 1. Sport priority (Football first)
    const sportPriorityA = SPORT_PRIORITY[a.sportId] ?? 99;
    const sportPriorityB = SPORT_PRIORITY[b.sportId] ?? 99;
    if (sportPriorityA !== sportPriorityB) return sportPriorityA - sportPriorityB;

    // 2. Live matches first
    const statusOrder = { live: 0, halftime: 1, scheduled: 2, finished: 3, postponed: 4, cancelled: 5 };
    const statusOrderA = statusOrder[a.status] ?? 5;
    const statusOrderB = statusOrder[b.status] ?? 5;
    if (statusOrderA !== statusOrderB) return statusOrderA - statusOrderB;

    // 3. Sort by kickoff time (soonest first for upcoming)
    return new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime();
  });
}

// Export sport icons mapping
export function getSportIcon(slug: string): string {
  const icons: Record<string, string> = {
    'football': 'soccer',
    'soccer': 'soccer',
    'basketball': 'basketball',
    'tennis': 'tennis',
    'cricket': 'cricket',
    'american-football': 'football',
    'baseball': 'baseball',
    'ice-hockey': 'hockey',
    'rugby': 'rugby',
    'mma': 'mma',
    'boxing': 'boxing',
    'formula-1': 'formula-1',
    'golf': 'golf',
    'esports': 'esports',
  };
  return icons[slug] || 'trophy';
}
