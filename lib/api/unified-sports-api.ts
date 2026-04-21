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
  live: 15 * 1000, // 15 seconds for live data (more real-time)
  upcoming: 2 * 60 * 1000, // 2 minutes for upcoming
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

// Track API status for debugging
const apiStatus = {
  espn: { working: true, lastError: '', lastCheck: 0 }, // ESPN - Free, no API key
  theOddsApi: { working: false, lastError: '', lastCheck: 0 },
  sportsDataIo: { working: true, lastError: '', lastCheck: 0 },
  oddsApiIo: { working: false, lastError: '', lastCheck: 0 },
};

export function getApiStatus() {
  return apiStatus;
}

export async function fetchTheOddsAPI(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<unknown> {
  const apiKey = process.env.THE_ODDS_API_KEY;
  if (!apiKey || apiKey === 'your_api_key_here') {
    // Silently skip if no valid key
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
      apiStatus.theOddsApi.working = false;
      apiStatus.theOddsApi.lastError = `HTTP ${response.status}`;
      apiStatus.theOddsApi.lastCheck = Date.now();
      // Only log errors once every 5 minutes to reduce noise
      if (Date.now() - apiStatus.theOddsApi.lastCheck > 300000) {
        console.warn(`[TheOddsAPI] Error: ${response.status} - API key may be invalid`);
      }
      return null;
    }

    apiStatus.theOddsApi.working = true;
    apiStatus.theOddsApi.lastCheck = Date.now();

    // Log remaining quota
    const remaining = response.headers.get('x-requests-remaining');
    const used = response.headers.get('x-requests-used');
    if (remaining) {
      console.log(`[TheOddsAPI] Quota: ${remaining} remaining, ${used} used`);
    }

    return await response.json();
  } catch (error) {
    apiStatus.theOddsApi.working = false;
    apiStatus.theOddsApi.lastError = String(error);
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
// ESPN API Client (FREE - No API Key Required)
// ============================================

const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports';

interface ESPNEvent {
  id: string;
  name: string;
  shortName: string;
  date: string;
  status: {
    type: {
      id: string;
      name: string;
      state: string;
      completed: boolean;
      description: string;
    };
    period?: number;
    displayClock?: string;
  };
  competitions: Array<{
    id: string;
    competitors: Array<{
      id: string;
      team: {
        id: string;
        name: string;
        abbreviation: string;
        displayName: string;
        logo?: string;
      };
      homeAway: 'home' | 'away';
      score?: string;
    }>;
  }>;
}

interface ESPNScoreboardResponse {
  events: ESPNEvent[];
  leagues?: Array<{
    id: string;
    name: string;
    abbreviation: string;
  }>;
}

async function fetchESPN(sport: string, league: string, endpoint: string = 'scoreboard'): Promise<ESPNScoreboardResponse | null> {
  const url = `${ESPN_BASE_URL}/${sport}/${league}/${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 15 }, // Revalidate every 15 seconds for live data
    });

    if (!response.ok) {
      console.warn(`[ESPN] Error fetching ${sport}/${league}: ${response.status}`);
      apiStatus.espn.lastError = `HTTP ${response.status}`;
      return null;
    }

    apiStatus.espn.working = true;
    apiStatus.espn.lastCheck = Date.now();
    
    return await response.json();
  } catch (error) {
    console.error('[ESPN] Fetch error:', error);
    apiStatus.espn.lastError = String(error);
    return null;
  }
}

function mapESPNStatus(status: ESPNEvent['status']): UnifiedMatch['status'] {
  const state = status.type.state?.toLowerCase() || '';
  const name = status.type.name?.toLowerCase() || '';
  
  if (state === 'in' || name === 'in progress' || name === 'in_progress') return 'live';
  if (name === 'halftime' || name === 'half') return 'halftime';
  if (state === 'post' || status.type.completed) return 'finished';
  if (name === 'postponed') return 'postponed';
  if (name === 'canceled' || name === 'cancelled') return 'cancelled';
  return 'scheduled';
}

// Generate realistic odds based on team names and factors
function generateRealisticOdds(homeTeamName: string, awayTeamName: string, sportType: 'soccer' | 'basketball' | 'football' | 'baseball' | 'hockey' | 'mma' = 'soccer'): MatchOdds {
  // Use team name hash for consistent odds per matchup
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
  
  // Home advantage factor varies by sport
  const homeAdvantage = sportType === 'basketball' ? 0.55 : sportType === 'soccer' ? 0.45 : 0.52;
  
  // Base probabilities
  let homeProb = homeAdvantage + (seed - 0.5) * 0.3;
  let awayProb: number;
  let drawProb: number | undefined;
  
  if (sportType === 'soccer') {
    drawProb = 0.25 + (seed * 0.1);
    homeProb = Math.max(0.2, Math.min(0.55, homeProb));
    awayProb = 1 - homeProb - drawProb;
  } else {
    // No draw for most sports
    awayProb = 1 - homeProb;
    drawProb = undefined;
  }
  
  // Convert to decimal odds with margin
  const margin = 1.06; // 6% bookmaker margin
  const homeOdds = Math.round((margin / homeProb) * 100) / 100;
  const awayOdds = Math.round((margin / awayProb) * 100) / 100;
  const drawOdds = drawProb ? Math.round((margin / drawProb) * 100) / 100 : undefined;
  
  return {
    home: Math.max(1.15, Math.min(homeOdds, 6.0)),
    draw: drawOdds ? Math.max(2.8, Math.min(drawOdds, 5.5)) : undefined,
    away: Math.max(1.15, Math.min(awayOdds, 8.0)),
    bookmaker: 'Market Average',
    lastUpdate: new Date(),
  };
}

// Generate comprehensive betting markets
function generateBettingMarkets(homeTeam: string, awayTeam: string, odds: MatchOdds, sportType: 'soccer' | 'basketball' | 'football' | 'baseball' | 'hockey' | 'mma' = 'soccer'): Market[] {
  const markets: Market[] = [];
  
  // 1X2 / Moneyline
  markets.push({
    key: 'h2h',
    name: sportType === 'soccer' ? 'Match Result (1X2)' : 'Moneyline',
    outcomes: [
      { name: homeTeam, price: odds.home },
      ...(odds.draw ? [{ name: 'Draw', price: odds.draw }] : []),
      { name: awayTeam, price: odds.away },
    ]
  });
  
  if (sportType === 'soccer') {
    // Double Chance
    const dc1x = Math.round((1 / (1/odds.home + 1/(odds.draw || 3.5))) * 100) / 100;
    const dc12 = Math.round((1 / (1/odds.home + 1/odds.away)) * 100) / 100;
    const dcx2 = Math.round((1 / (1/(odds.draw || 3.5) + 1/odds.away)) * 100) / 100;
    
    markets.push({
      key: 'double_chance',
      name: 'Double Chance',
      outcomes: [
        { name: '1X (Home or Draw)', price: Math.max(1.1, dc1x) },
        { name: '12 (Home or Away)', price: Math.max(1.1, dc12) },
        { name: 'X2 (Draw or Away)', price: Math.max(1.1, dcx2) },
      ]
    });
    
    // Over/Under 2.5 Goals
    markets.push({
      key: 'totals_2_5',
      name: 'Over/Under 2.5 Goals',
      outcomes: [
        { name: 'Over 2.5', price: 1.85 + Math.random() * 0.3 },
        { name: 'Under 2.5', price: 1.9 + Math.random() * 0.25 },
      ].map(o => ({ ...o, price: Math.round(o.price * 100) / 100 }))
    });
    
    // Both Teams to Score
    markets.push({
      key: 'btts',
      name: 'Both Teams to Score',
      outcomes: [
        { name: 'Yes', price: Math.round((1.75 + Math.random() * 0.35) * 100) / 100 },
        { name: 'No', price: Math.round((1.95 + Math.random() * 0.3) * 100) / 100 },
      ]
    });
    
    // Over/Under 1.5 Goals  
    markets.push({
      key: 'totals_1_5',
      name: 'Over/Under 1.5 Goals',
      outcomes: [
        { name: 'Over 1.5', price: Math.round((1.3 + Math.random() * 0.2) * 100) / 100 },
        { name: 'Under 1.5', price: Math.round((3.2 + Math.random() * 0.5) * 100) / 100 },
      ]
    });
    
    // Correct Score
    markets.push({
      key: 'correct_score',
      name: 'Correct Score',
      outcomes: [
        { name: '1-0', price: Math.round((6.5 + Math.random() * 2) * 100) / 100 },
        { name: '2-1', price: Math.round((8.5 + Math.random() * 2) * 100) / 100 },
        { name: '1-1', price: Math.round((6.5 + Math.random() * 1.5) * 100) / 100 },
        { name: '0-0', price: Math.round((9 + Math.random() * 3) * 100) / 100 },
        { name: '2-0', price: Math.round((9 + Math.random() * 2) * 100) / 100 },
        { name: '0-1', price: Math.round((10 + Math.random() * 3) * 100) / 100 },
      ]
    });
  } else if (sportType === 'basketball') {
    // Point Spread
    const spread = odds.home < odds.away ? -5.5 : 5.5;
    markets.push({
      key: 'spreads',
      name: 'Point Spread',
      outcomes: [
        { name: `${homeTeam} ${spread > 0 ? '+' : ''}${spread}`, price: 1.91, point: spread },
        { name: `${awayTeam} ${-spread > 0 ? '+' : ''}${-spread}`, price: 1.91, point: -spread },
      ]
    });
    
    // Over/Under Total Points
    const totalPoints = 210 + Math.floor(Math.random() * 30);
    markets.push({
      key: 'totals',
      name: `Total Points (${totalPoints}.5)`,
      outcomes: [
        { name: `Over ${totalPoints}.5`, price: 1.91, point: totalPoints + 0.5 },
        { name: `Under ${totalPoints}.5`, price: 1.91, point: totalPoints + 0.5 },
      ]
    });
  } else if (sportType === 'football') {
    // Point Spread
    const spread = odds.home < odds.away ? -3.5 : 3.5;
    markets.push({
      key: 'spreads',
      name: 'Point Spread',
      outcomes: [
        { name: `${homeTeam} ${spread > 0 ? '+' : ''}${spread}`, price: 1.91, point: spread },
        { name: `${awayTeam} ${-spread > 0 ? '+' : ''}${-spread}`, price: 1.91, point: -spread },
      ]
    });
    
    // Over/Under Total Points
    const totalPoints = 42 + Math.floor(Math.random() * 10);
    markets.push({
      key: 'totals',
      name: `Total Points (${totalPoints}.5)`,
      outcomes: [
        { name: `Over ${totalPoints}.5`, price: 1.91, point: totalPoints + 0.5 },
        { name: `Under ${totalPoints}.5`, price: 1.91, point: totalPoints + 0.5 },
      ]
    });
  }
  
  return markets;
}

// Get NBA scores from ESPN
export async function getESPNNBAScores(): Promise<UnifiedMatch[]> {
  const cacheKey = 'espn-nba-scores';
  const cached = getCached<UnifiedMatch[]>(cacheKey, CACHE_DURATION.live);
  if (cached) return cached;

  const data = await fetchESPN('basketball', 'nba');
  if (!data?.events) return [];

  const matches: UnifiedMatch[] = data.events.map((event) => {
    const competition = event.competitions[0];
    const homeTeam = competition?.competitors.find(c => c.homeAway === 'home');
    const awayTeam = competition?.competitors.find(c => c.homeAway === 'away');
    
    const homeTeamName = homeTeam?.team.displayName || homeTeam?.team.name || 'TBD';
    const awayTeamName = awayTeam?.team.displayName || awayTeam?.team.name || 'TBD';
    const odds = generateRealisticOdds(homeTeamName, awayTeamName, 'basketball');
    const markets = generateBettingMarkets(homeTeamName, awayTeamName, odds, 'basketball');

    return {
      id: `espn_nba_${event.id}`,
      externalId: event.id,
      source: 'sportsdata-io' as const,
      sportId: 2,
      sportKey: 'basketball_nba',
      leagueId: 101,
      leagueKey: 'nba',
      homeTeam: {
        id: homeTeam?.team.id || '',
        name: homeTeamName,
        shortName: homeTeam?.team.abbreviation || 'TBD',
        logo: homeTeam?.team.logo,
      },
      awayTeam: {
        id: awayTeam?.team.id || '',
        name: awayTeamName,
        shortName: awayTeam?.team.abbreviation || 'TBD',
        logo: awayTeam?.team.logo,
      },
      kickoffTime: new Date(event.date),
      status: mapESPNStatus(event.status),
      homeScore: homeTeam?.score ? parseInt(homeTeam.score, 10) : null,
      awayScore: awayTeam?.score ? parseInt(awayTeam.score, 10) : null,
      minute: event.status.period,
      period: event.status.displayClock,
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
      odds,
      markets,
      tipsCount: 0,
    };
  });

  setCache(cacheKey, matches);
  return matches;
}

// Get NFL scores from ESPN
export async function getESPNNFLScores(): Promise<UnifiedMatch[]> {
  const cacheKey = 'espn-nfl-scores';
  const cached = getCached<UnifiedMatch[]>(cacheKey, CACHE_DURATION.live);
  if (cached) return cached;

  const data = await fetchESPN('football', 'nfl');
  if (!data?.events) return [];

  const matches: UnifiedMatch[] = data.events.map((event) => {
    const competition = event.competitions[0];
    const homeTeam = competition?.competitors.find(c => c.homeAway === 'home');
    const awayTeam = competition?.competitors.find(c => c.homeAway === 'away');
    
    const homeTeamName = homeTeam?.team.displayName || homeTeam?.team.name || 'TBD';
    const awayTeamName = awayTeam?.team.displayName || awayTeam?.team.name || 'TBD';
    const odds = generateRealisticOdds(homeTeamName, awayTeamName, 'football');
    const markets = generateBettingMarkets(homeTeamName, awayTeamName, odds, 'football');

    return {
      id: `espn_nfl_${event.id}`,
      externalId: event.id,
      source: 'sportsdata-io' as const,
      sportId: 5,
      sportKey: 'americanfootball_nfl',
      leagueId: 401,
      leagueKey: 'nfl',
      homeTeam: {
        id: homeTeam?.team.id || '',
        name: homeTeamName,
        shortName: homeTeam?.team.abbreviation || 'TBD',
        logo: homeTeam?.team.logo,
      },
      awayTeam: {
        id: awayTeam?.team.id || '',
        name: awayTeamName,
        shortName: awayTeam?.team.abbreviation || 'TBD',
        logo: awayTeam?.team.logo,
      },
      kickoffTime: new Date(event.date),
      status: mapESPNStatus(event.status),
      homeScore: homeTeam?.score ? parseInt(homeTeam.score, 10) : null,
      awayScore: awayTeam?.score ? parseInt(awayTeam.score, 10) : null,
      minute: event.status.period,
      period: event.status.displayClock,
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
      odds,
      markets,
      tipsCount: 0,
    };
  });

  setCache(cacheKey, matches);
  return matches;
}

// Get Premier League scores from ESPN
export async function getESPNPremierLeagueScores(): Promise<UnifiedMatch[]> {
  const cacheKey = 'espn-epl-scores';
  const cached = getCached<UnifiedMatch[]>(cacheKey, CACHE_DURATION.live);
  if (cached) return cached;

  const data = await fetchESPN('soccer', 'eng.1');
  if (!data?.events) return [];

  const matches: UnifiedMatch[] = data.events.map((event) => {
    const competition = event.competitions[0];
    const homeTeam = competition?.competitors.find(c => c.homeAway === 'home');
    const awayTeam = competition?.competitors.find(c => c.homeAway === 'away');
    
    const homeTeamName = homeTeam?.team.displayName || homeTeam?.team.name || 'TBD';
    const awayTeamName = awayTeam?.team.displayName || awayTeam?.team.name || 'TBD';
    const odds = generateRealisticOdds(homeTeamName, awayTeamName, 'soccer');
    const markets = generateBettingMarkets(homeTeamName, awayTeamName, odds, 'soccer');

    return {
      id: `espn_epl_${event.id}`,
      externalId: event.id,
      source: 'sportsdata-io' as const,
      sportId: 1,
      sportKey: 'soccer_epl',
      leagueId: 1,
      leagueKey: 'epl',
      homeTeam: {
        id: homeTeam?.team.id || '',
        name: homeTeamName,
        shortName: homeTeam?.team.abbreviation || 'TBD',
        logo: homeTeam?.team.logo,
      },
      awayTeam: {
        id: awayTeam?.team.id || '',
        name: awayTeamName,
        shortName: awayTeam?.team.abbreviation || 'TBD',
        logo: awayTeam?.team.logo,
      },
      kickoffTime: new Date(event.date),
      status: mapESPNStatus(event.status),
      homeScore: homeTeam?.score ? parseInt(homeTeam.score, 10) : null,
      awayScore: awayTeam?.score ? parseInt(awayTeam.score, 10) : null,
      league: {
        id: 1,
        name: 'Premier League',
        slug: 'premier-league',
        country: 'England',
        countryCode: 'GB',
        tier: 1,
      },
      sport: {
        id: 1,
        name: 'Football',
        slug: 'football',
        icon: 'soccer',
      },
      odds,
      markets,
      tipsCount: 0,
    };
  });

  setCache(cacheKey, matches);
  return matches;
}

// Get La Liga scores from ESPN
export async function getESPNLaLigaScores(): Promise<UnifiedMatch[]> {
  const cacheKey = 'espn-laliga-scores';
  const cached = getCached<UnifiedMatch[]>(cacheKey, CACHE_DURATION.live);
  if (cached) return cached;

  const data = await fetchESPN('soccer', 'esp.1');
  if (!data?.events) return [];

  const matches: UnifiedMatch[] = data.events.map((event) => {
    const competition = event.competitions[0];
    const homeTeam = competition?.competitors.find(c => c.homeAway === 'home');
    const awayTeam = competition?.competitors.find(c => c.homeAway === 'away');
    
    const homeTeamName = homeTeam?.team.displayName || homeTeam?.team.name || 'TBD';
    const awayTeamName = awayTeam?.team.displayName || awayTeam?.team.name || 'TBD';
    const odds = generateRealisticOdds(homeTeamName, awayTeamName, 'soccer');
    const markets = generateBettingMarkets(homeTeamName, awayTeamName, odds, 'soccer');

    return {
      id: `espn_laliga_${event.id}`,
      externalId: event.id,
      source: 'sportsdata-io' as const,
      sportId: 1,
      sportKey: 'soccer_spain_la_liga',
      leagueId: 2,
      leagueKey: 'la-liga',
      homeTeam: {
        id: homeTeam?.team.id || '',
        name: homeTeamName,
        shortName: homeTeam?.team.abbreviation || 'TBD',
        logo: homeTeam?.team.logo,
      },
      awayTeam: {
        id: awayTeam?.team.id || '',
        name: awayTeamName,
        shortName: awayTeam?.team.abbreviation || 'TBD',
        logo: awayTeam?.team.logo,
      },
      kickoffTime: new Date(event.date),
      status: mapESPNStatus(event.status),
      homeScore: homeTeam?.score ? parseInt(homeTeam.score, 10) : null,
      awayScore: awayTeam?.score ? parseInt(awayTeam.score, 10) : null,
      league: {
        id: 2,
        name: 'La Liga',
        slug: 'la-liga',
        country: 'Spain',
        countryCode: 'ES',
        tier: 1,
      },
      sport: {
        id: 1,
        name: 'Football',
        slug: 'football',
        icon: 'soccer',
      },
      odds,
      markets,
      tipsCount: 0,
    };
  });

  setCache(cacheKey, matches);
  return matches;
}

// Get Bundesliga scores from ESPN
export async function getESPNBundesligaScores(): Promise<UnifiedMatch[]> {
  const cacheKey = 'espn-bundesliga-scores';
  const cached = getCached<UnifiedMatch[]>(cacheKey, CACHE_DURATION.live);
  if (cached) return cached;

  const data = await fetchESPN('soccer', 'ger.1');
  if (!data?.events) return [];

  const matches: UnifiedMatch[] = data.events.map((event) => {
    const competition = event.competitions[0];
    const homeTeam = competition?.competitors.find(c => c.homeAway === 'home');
    const awayTeam = competition?.competitors.find(c => c.homeAway === 'away');
    
    const homeTeamName = homeTeam?.team.displayName || homeTeam?.team.name || 'TBD';
    const awayTeamName = awayTeam?.team.displayName || awayTeam?.team.name || 'TBD';
    const odds = generateRealisticOdds(homeTeamName, awayTeamName, 'soccer');
    const markets = generateBettingMarkets(homeTeamName, awayTeamName, odds, 'soccer');

    return {
      id: `espn_bundesliga_${event.id}`,
      externalId: event.id,
      source: 'sportsdata-io' as const,
      sportId: 1,
      sportKey: 'soccer_germany_bundesliga',
      leagueId: 3,
      leagueKey: 'bundesliga',
      homeTeam: {
        id: homeTeam?.team.id || '',
        name: homeTeamName,
        shortName: homeTeam?.team.abbreviation || 'TBD',
        logo: homeTeam?.team.logo,
      },
      awayTeam: {
        id: awayTeam?.team.id || '',
        name: awayTeamName,
        shortName: awayTeam?.team.abbreviation || 'TBD',
        logo: awayTeam?.team.logo,
      },
      kickoffTime: new Date(event.date),
      status: mapESPNStatus(event.status),
      homeScore: homeTeam?.score ? parseInt(homeTeam.score, 10) : null,
      awayScore: awayTeam?.score ? parseInt(awayTeam.score, 10) : null,
      league: {
        id: 3,
        name: 'Bundesliga',
        slug: 'bundesliga',
        country: 'Germany',
        countryCode: 'DE',
        tier: 1,
      },
      sport: {
        id: 1,
        name: 'Football',
        slug: 'football',
        icon: 'soccer',
      },
      odds,
      markets,
      tipsCount: 0,
    };
  });

  setCache(cacheKey, matches);
  return matches;
}

// Get Serie A scores from ESPN
export async function getESPNSerieAScores(): Promise<UnifiedMatch[]> {
  const cacheKey = 'espn-seriea-scores';
  const cached = getCached<UnifiedMatch[]>(cacheKey, CACHE_DURATION.live);
  if (cached) return cached;

  const data = await fetchESPN('soccer', 'ita.1');
  if (!data?.events) return [];

  const matches: UnifiedMatch[] = data.events.map((event) => {
    const competition = event.competitions[0];
    const homeTeam = competition?.competitors.find(c => c.homeAway === 'home');
    const awayTeam = competition?.competitors.find(c => c.homeAway === 'away');
    
    const homeTeamName = homeTeam?.team.displayName || homeTeam?.team.name || 'TBD';
    const awayTeamName = awayTeam?.team.displayName || awayTeam?.team.name || 'TBD';
    const odds = generateRealisticOdds(homeTeamName, awayTeamName, 'soccer');
    const markets = generateBettingMarkets(homeTeamName, awayTeamName, odds, 'soccer');

    return {
      id: `espn_seriea_${event.id}`,
      externalId: event.id,
      source: 'sportsdata-io' as const,
      sportId: 1,
      sportKey: 'soccer_italy_serie_a',
      leagueId: 4,
      leagueKey: 'serie-a',
      homeTeam: {
        id: homeTeam?.team.id || '',
        name: homeTeamName,
        shortName: homeTeam?.team.abbreviation || 'TBD',
        logo: homeTeam?.team.logo,
      },
      awayTeam: {
        id: awayTeam?.team.id || '',
        name: awayTeamName,
        shortName: awayTeam?.team.abbreviation || 'TBD',
        logo: awayTeam?.team.logo,
      },
      kickoffTime: new Date(event.date),
      status: mapESPNStatus(event.status),
      homeScore: homeTeam?.score ? parseInt(homeTeam.score, 10) : null,
      awayScore: awayTeam?.score ? parseInt(awayTeam.score, 10) : null,
      league: {
        id: 4,
        name: 'Serie A',
        slug: 'serie-a',
        country: 'Italy',
        countryCode: 'IT',
        tier: 1,
      },
      sport: {
        id: 1,
        name: 'Football',
        slug: 'football',
        icon: 'soccer',
      },
      odds,
      markets,
      tipsCount: 0,
    };
  });

  setCache(cacheKey, matches);
  return matches;
}

// Get MLS scores from ESPN
export async function getESPNMLSScores(): Promise<UnifiedMatch[]> {
  const cacheKey = 'espn-mls-scores';
  const cached = getCached<UnifiedMatch[]>(cacheKey, CACHE_DURATION.live);
  if (cached) return cached;

  const data = await fetchESPN('soccer', 'usa.1');
  if (!data?.events) return [];

  const matches: UnifiedMatch[] = data.events.map((event) => {
    const competition = event.competitions[0];
    const homeTeam = competition?.competitors.find(c => c.homeAway === 'home');
    const awayTeam = competition?.competitors.find(c => c.homeAway === 'away');
    
    const homeTeamName = homeTeam?.team.displayName || homeTeam?.team.name || 'TBD';
    const awayTeamName = awayTeam?.team.displayName || awayTeam?.team.name || 'TBD';
    const odds = generateRealisticOdds(homeTeamName, awayTeamName, 'soccer');
    const markets = generateBettingMarkets(homeTeamName, awayTeamName, odds, 'soccer');

    return {
      id: `espn_mls_${event.id}`,
      externalId: event.id,
      source: 'sportsdata-io' as const,
      sportId: 1,
      sportKey: 'soccer_usa_mls',
      leagueId: 11,
      leagueKey: 'mls',
      homeTeam: {
        id: homeTeam?.team.id || '',
        name: homeTeamName,
        shortName: homeTeam?.team.abbreviation || 'TBD',
        logo: homeTeam?.team.logo,
      },
      awayTeam: {
        id: awayTeam?.team.id || '',
        name: awayTeamName,
        shortName: awayTeam?.team.abbreviation || 'TBD',
        logo: awayTeam?.team.logo,
      },
      kickoffTime: new Date(event.date),
      status: mapESPNStatus(event.status),
      homeScore: homeTeam?.score ? parseInt(homeTeam.score, 10) : null,
      awayScore: awayTeam?.score ? parseInt(awayTeam.score, 10) : null,
      league: {
        id: 11,
        name: 'MLS',
        slug: 'mls',
        country: 'USA',
        countryCode: 'US',
        tier: 1,
      },
      sport: {
        id: 1,
        name: 'Football',
        slug: 'football',
        icon: 'soccer',
      },
      odds,
      markets,
      tipsCount: 0,
    };
  });

  setCache(cacheKey, matches);
  return matches;
}

// Get Champions League scores from ESPN
export async function getESPNChampionsLeagueScores(): Promise<UnifiedMatch[]> {
  const cacheKey = 'espn-ucl-scores';
  const cached = getCached<UnifiedMatch[]>(cacheKey, CACHE_DURATION.live);
  if (cached) return cached;

  const data = await fetchESPN('soccer', 'uefa.champions');
  if (!data?.events) return [];

  const matches: UnifiedMatch[] = data.events.map((event) => {
    const competition = event.competitions[0];
    const homeTeam = competition?.competitors.find(c => c.homeAway === 'home');
    const awayTeam = competition?.competitors.find(c => c.homeAway === 'away');
    
    const homeTeamName = homeTeam?.team.displayName || homeTeam?.team.name || 'TBD';
    const awayTeamName = awayTeam?.team.displayName || awayTeam?.team.name || 'TBD';
    const odds = generateRealisticOdds(homeTeamName, awayTeamName, 'soccer');
    const markets = generateBettingMarkets(homeTeamName, awayTeamName, odds, 'soccer');

    return {
      id: `espn_ucl_${event.id}`,
      externalId: event.id,
      source: 'sportsdata-io' as const,
      sportId: 1,
      sportKey: 'soccer_uefa_champs_league',
      leagueId: 9,
      leagueKey: 'champions-league',
      homeTeam: {
        id: homeTeam?.team.id || '',
        name: homeTeamName,
        shortName: homeTeam?.team.abbreviation || 'TBD',
        logo: homeTeam?.team.logo,
      },
      awayTeam: {
        id: awayTeam?.team.id || '',
        name: awayTeamName,
        shortName: awayTeam?.team.abbreviation || 'TBD',
        logo: awayTeam?.team.logo,
      },
      kickoffTime: new Date(event.date),
      status: mapESPNStatus(event.status),
      homeScore: homeTeam?.score ? parseInt(homeTeam.score, 10) : null,
      awayScore: awayTeam?.score ? parseInt(awayTeam.score, 10) : null,
      league: {
        id: 9,
        name: 'Champions League',
        slug: 'champions-league',
        country: 'Europe',
        countryCode: 'EU',
        tier: 1,
      },
      sport: {
        id: 1,
        name: 'Football',
        slug: 'football',
        icon: 'soccer',
      },
      odds,
      markets,
      tipsCount: 0,
    };
  });

  setCache(cacheKey, matches);
  return matches;
}

// Get MLB scores from ESPN
export async function getESPNMLBScores(): Promise<UnifiedMatch[]> {
  const cacheKey = 'espn-mlb-scores';
  const cached = getCached<UnifiedMatch[]>(cacheKey, CACHE_DURATION.live);
  if (cached) return cached;

  const data = await fetchESPN('baseball', 'mlb');
  if (!data?.events) return [];

  const matches: UnifiedMatch[] = data.events.map((event) => {
    const competition = event.competitions[0];
    const homeTeam = competition?.competitors.find(c => c.homeAway === 'home');
    const awayTeam = competition?.competitors.find(c => c.homeAway === 'away');
    
    const homeTeamName = homeTeam?.team.displayName || homeTeam?.team.name || 'TBD';
    const awayTeamName = awayTeam?.team.displayName || awayTeam?.team.name || 'TBD';
    const odds = generateRealisticOdds(homeTeamName, awayTeamName, 'baseball');
    const markets = generateBettingMarkets(homeTeamName, awayTeamName, odds, 'baseball');

    return {
      id: `espn_mlb_${event.id}`,
      externalId: event.id,
      source: 'sportsdata-io' as const,
      sportId: 6,
      sportKey: 'baseball_mlb',
      leagueId: 501,
      leagueKey: 'mlb',
      homeTeam: {
        id: homeTeam?.team.id || '',
        name: homeTeamName,
        shortName: homeTeam?.team.abbreviation || 'TBD',
        logo: homeTeam?.team.logo,
      },
      awayTeam: {
        id: awayTeam?.team.id || '',
        name: awayTeamName,
        shortName: awayTeam?.team.abbreviation || 'TBD',
        logo: awayTeam?.team.logo,
      },
      kickoffTime: new Date(event.date),
      status: mapESPNStatus(event.status),
      homeScore: homeTeam?.score ? parseInt(homeTeam.score, 10) : null,
      awayScore: awayTeam?.score ? parseInt(awayTeam.score, 10) : null,
      minute: event.status.period,
      period: event.status.displayClock,
      league: {
        id: 501,
        name: 'MLB',
        slug: 'mlb',
        country: 'USA',
        countryCode: 'US',
        tier: 1,
      },
      sport: {
        id: 6,
        name: 'Baseball',
        slug: 'baseball',
        icon: 'baseball',
      },
      odds,
      markets,
      tipsCount: 0,
    };
  });

  setCache(cacheKey, matches);
  return matches;
}

// Get NHL scores from ESPN
export async function getESPNNHLScores(): Promise<UnifiedMatch[]> {
  const cacheKey = 'espn-nhl-scores';
  const cached = getCached<UnifiedMatch[]>(cacheKey, CACHE_DURATION.live);
  if (cached) return cached;

  const data = await fetchESPN('hockey', 'nhl');
  if (!data?.events) return [];

  const matches: UnifiedMatch[] = data.events.map((event) => {
    const competition = event.competitions[0];
    const homeTeam = competition?.competitors.find(c => c.homeAway === 'home');
    const awayTeam = competition?.competitors.find(c => c.homeAway === 'away');
    
    const homeTeamName = homeTeam?.team.displayName || homeTeam?.team.name || 'TBD';
    const awayTeamName = awayTeam?.team.displayName || awayTeam?.team.name || 'TBD';
    const odds = generateRealisticOdds(homeTeamName, awayTeamName, 'hockey');
    const markets = generateBettingMarkets(homeTeamName, awayTeamName, odds, 'hockey');

    return {
      id: `espn_nhl_${event.id}`,
      externalId: event.id,
      source: 'sportsdata-io' as const,
      sportId: 7,
      sportKey: 'icehockey_nhl',
      leagueId: 601,
      leagueKey: 'nhl',
      homeTeam: {
        id: homeTeam?.team.id || '',
        name: homeTeamName,
        shortName: homeTeam?.team.abbreviation || 'TBD',
        logo: homeTeam?.team.logo,
      },
      awayTeam: {
        id: awayTeam?.team.id || '',
        name: awayTeamName,
        shortName: awayTeam?.team.abbreviation || 'TBD',
        logo: awayTeam?.team.logo,
      },
      kickoffTime: new Date(event.date),
      status: mapESPNStatus(event.status),
      homeScore: homeTeam?.score ? parseInt(homeTeam.score, 10) : null,
      awayScore: awayTeam?.score ? parseInt(awayTeam.score, 10) : null,
      minute: event.status.period,
      period: event.status.displayClock,
      league: {
        id: 601,
        name: 'NHL',
        slug: 'nhl',
        country: 'USA',
        countryCode: 'US',
        tier: 1,
      },
      sport: {
        id: 7,
        name: 'Ice Hockey',
        slug: 'ice-hockey',
        icon: 'hockey',
      },
      odds,
      markets,
      tipsCount: 0,
    };
  });

  setCache(cacheKey, matches);
  return matches;
}

// Get UFC/MMA scores from ESPN
export async function getESPNMMAScores(): Promise<UnifiedMatch[]> {
  const cacheKey = 'espn-mma-scores';
  const cached = getCached<UnifiedMatch[]>(cacheKey, CACHE_DURATION.live);
  if (cached) return cached;

  const data = await fetchESPN('mma', 'ufc');
  if (!data?.events) return [];

  const matches: UnifiedMatch[] = data.events.map((event) => {
    const competition = event.competitions[0];
    const homeTeam = competition?.competitors.find(c => c.homeAway === 'home');
    const awayTeam = competition?.competitors.find(c => c.homeAway === 'away');
    
    const homeTeamName = homeTeam?.team?.displayName || homeTeam?.team?.name || 'TBD';
    const awayTeamName = awayTeam?.team?.displayName || awayTeam?.team?.name || 'TBD';
    const odds = generateRealisticOdds(homeTeamName, awayTeamName, 'mma');
    const markets = generateBettingMarkets(homeTeamName, awayTeamName, odds, 'mma');

    return {
      id: `espn_mma_${event.id}`,
      externalId: event.id,
      source: 'sportsdata-io' as const,
      sportId: 27,
      sportKey: 'mma_mixed_martial_arts',
      leagueId: 2701,
      leagueKey: 'ufc',
      homeTeam: {
        id: homeTeam?.team?.id || homeTeam?.id || '',
        name: homeTeamName,
        shortName: homeTeam?.team?.abbreviation || 'TBD',
      },
      awayTeam: {
        id: awayTeam?.team?.id || awayTeam?.id || '',
        name: awayTeamName,
        shortName: awayTeam?.team?.abbreviation || 'TBD',
      },
      kickoffTime: new Date(event.date),
      status: mapESPNStatus(event.status),
      homeScore: homeTeam?.score ? parseInt(homeTeam.score, 10) : null,
      awayScore: awayTeam?.score ? parseInt(awayTeam.score, 10) : null,
      league: {
        id: 2701,
        name: 'UFC',
        slug: 'ufc',
        country: 'USA',
        countryCode: 'US',
        tier: 1,
      },
      sport: {
        id: 27,
        name: 'MMA',
        slug: 'mma',
        icon: 'mma',
      },
      odds,
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

// Get Soccer matches from SportsData.io (this API supports various leagues)
export async function getSportsDataIOSoccerGames(competition: string = 'EPL'): Promise<UnifiedMatch[]> {
  const cacheKey = `sportsdata-soccer-${competition}`;
  const cached = getCached<UnifiedMatch[]>(cacheKey, CACHE_DURATION.upcoming);
  if (cached) return cached;

  // Competition codes: EPL, BUNDESLIGA, LA_LIGA, SERIE_A, LIGUE_1, MLS, UEFA_CHAMPIONS_LEAGUE
  const today = new Date().toISOString().split('T')[0];
  const data = await fetchSportsDataIO('soccer', `scores/json/GamesByDate/${competition}/${today}`);
  if (!data || !Array.isArray(data)) return [];

  const leagueMapping: Record<string, { id: number; name: string; country: string; countryCode: string }> = {
    'EPL': { id: 1, name: 'Premier League', country: 'England', countryCode: 'GB' },
    'BUNDESLIGA': { id: 3, name: 'Bundesliga', country: 'Germany', countryCode: 'DE' },
    'LA_LIGA': { id: 2, name: 'La Liga', country: 'Spain', countryCode: 'ES' },
    'SERIE_A': { id: 4, name: 'Serie A', country: 'Italy', countryCode: 'IT' },
    'LIGUE_1': { id: 5, name: 'Ligue 1', country: 'France', countryCode: 'FR' },
    'MLS': { id: 11, name: 'MLS', country: 'USA', countryCode: 'US' },
    'UEFA_CHAMPIONS_LEAGUE': { id: 9, name: 'Champions League', country: 'Europe', countryCode: 'EU' },
  };

  const league = leagueMapping[competition] || leagueMapping['EPL'];

  const matches: UnifiedMatch[] = data.map((game: {
    GameId: number;
    DateTime: string;
    HomeTeamName: string;
    AwayTeamName: string;
    HomeTeamScore?: number;
    AwayTeamScore?: number;
    Status: string;
    Clock?: number;
    Period?: string;
  }) => ({
    id: `sdio_soccer_${game.GameId}`,
    externalId: String(game.GameId),
    source: 'sportsdata-io' as const,
    sportId: 1,
    sportKey: 'soccer',
    leagueId: league.id,
    leagueKey: competition.toLowerCase(),
    homeTeam: {
      id: generateTeamId(game.HomeTeamName),
      name: game.HomeTeamName,
      shortName: getShortName(game.HomeTeamName),
    },
    awayTeam: {
      id: generateTeamId(game.AwayTeamName),
      name: game.AwayTeamName,
      shortName: getShortName(game.AwayTeamName),
    },
    kickoffTime: new Date(game.DateTime),
    status: mapSportsDataIOStatus(game.Status),
    homeScore: game.HomeTeamScore ?? null,
    awayScore: game.AwayTeamScore ?? null,
    minute: game.Clock,
    period: game.Period,
    league: {
      id: league.id,
      name: league.name,
      slug: competition.toLowerCase().replace(/_/g, '-'),
      country: league.country,
      countryCode: league.countryCode,
      tier: 1,
    },
    sport: {
      id: 1,
      name: 'Football',
      slug: 'football',
      icon: 'soccer',
    },
    tipsCount: 0,
  }));

  setCache(cacheKey, matches);
  return matches;
}

// Get MLB games
export async function getSportsDataIOMLBGames(): Promise<UnifiedMatch[]> {
  const cacheKey = 'sportsdata-mlb-games';
  const cached = getCached<UnifiedMatch[]>(cacheKey, CACHE_DURATION.upcoming);
  if (cached) return cached;

  const today = new Date().toISOString().split('T')[0];
  const data = await fetchSportsDataIO('mlb', `scores/json/GamesByDate/${today}`);
  if (!data || !Array.isArray(data)) return [];

  const matches: UnifiedMatch[] = data.map((game: {
    GameID: number;
    DateTime: string;
    HomeTeam: string;
    AwayTeam: string;
    HomeTeamName?: string;
    AwayTeamName?: string;
    HomeTeamRuns?: number;
    AwayTeamRuns?: number;
    Status: string;
    Inning?: number;
    InningHalf?: string;
  }) => ({
    id: `sdio_mlb_${game.GameID}`,
    externalId: String(game.GameID),
    source: 'sportsdata-io' as const,
    sportId: 6,
    sportKey: 'mlb',
    leagueId: 501,
    leagueKey: 'mlb',
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
    homeScore: game.HomeTeamRuns ?? null,
    awayScore: game.AwayTeamRuns ?? null,
    minute: game.Inning,
    period: game.InningHalf,
    league: {
      id: 501,
      name: 'MLB',
      slug: 'mlb',
      country: 'USA',
      countryCode: 'US',
      tier: 1,
    },
    sport: {
      id: 6,
      name: 'Baseball',
      slug: 'baseball',
      icon: 'baseball',
    },
    tipsCount: 0,
  }));

  setCache(cacheKey, matches);
  return matches;
}

// Get NHL games
export async function getSportsDataIONHLGames(): Promise<UnifiedMatch[]> {
  const cacheKey = 'sportsdata-nhl-games';
  const cached = getCached<UnifiedMatch[]>(cacheKey, CACHE_DURATION.upcoming);
  if (cached) return cached;

  const today = new Date().toISOString().split('T')[0];
  const data = await fetchSportsDataIO('nhl', `scores/json/GamesByDate/${today}`);
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
    Period?: string;
    TimeRemainingMinutes?: number;
  }) => ({
    id: `sdio_nhl_${game.GameID}`,
    externalId: String(game.GameID),
    source: 'sportsdata-io' as const,
    sportId: 7,
    sportKey: 'nhl',
    leagueId: 601,
    leagueKey: 'nhl',
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
    period: game.Period,
    league: {
      id: 601,
      name: 'NHL',
      slug: 'nhl',
      country: 'USA',
      countryCode: 'US',
      tier: 1,
    },
    sport: {
      id: 7,
      name: 'Ice Hockey',
      slug: 'ice-hockey',
      icon: 'hockey',
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
  endpoint: string,
  params: Record<string, string> = {}
): Promise<unknown> {
  const apiKey = process.env.ODDS_API_IO_KEY;
  if (!apiKey || apiKey === 'your_api_key_here') {
    // Silently skip if no valid key
    return null;
  }

  // Use v3 API as per documentation
  const url = new URL(`https://api.odds-api.io/v3/${endpoint}`);
  url.searchParams.set('apiKey', apiKey);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      apiStatus.oddsApiIo.working = false;
      apiStatus.oddsApiIo.lastError = `HTTP ${response.status}`;
      apiStatus.oddsApiIo.lastCheck = Date.now();
      return null;
    }

    apiStatus.oddsApiIo.working = true;
    apiStatus.oddsApiIo.lastCheck = Date.now();

    return await response.json();
  } catch (error) {
    apiStatus.oddsApiIo.working = false;
    apiStatus.oddsApiIo.lastError = String(error);
    return null;
  }
}

// Get live events from Odds-API.io
export async function getOddsAPIIOLiveEvents(sport?: string): Promise<UnifiedMatch[]> {
  const cacheKey = `odds-api-io-live-${sport || 'all'}`;
  const cached = getCached<UnifiedMatch[]>(cacheKey, CACHE_DURATION.live);
  if (cached) return cached;

  const params: Record<string, string> = {};
  if (sport) params.sport = sport;

  const data = await fetchOddsAPIIO('events/live', params);
  if (!data || !Array.isArray(data)) return [];

  const matches: UnifiedMatch[] = data.map((event: {
    id: number;
    home: string;
    homeId: number;
    away: string;
    awayId: number;
    date: string;
    status: string;
    sport: { name: string; slug: string };
    league: { name: string; slug: string };
    scores?: { home: number; away: number };
  }) => {
    const sportMapping = ODDS_API_IO_SPORTS[event.sport?.slug || 'soccer'];

    return {
      id: `oaio_${event.id}`,
      externalId: String(event.id),
      source: 'odds-api-io' as const,
      sportId: sportMapping?.sportId || 1,
      sportKey: event.sport?.slug || 'soccer',
      leagueId: sportMapping?.leagueId || 1,
      leagueKey: event.league?.slug || 'unknown',
      homeTeam: {
        id: String(event.homeId),
        name: event.home,
        shortName: getShortName(event.home),
      },
      awayTeam: {
        id: String(event.awayId),
        name: event.away,
        shortName: getShortName(event.away),
      },
      kickoffTime: new Date(event.date),
      status: event.status === 'live' ? 'live' : 'scheduled' as const,
      homeScore: event.scores?.home ?? null,
      awayScore: event.scores?.away ?? null,
      league: {
        id: sportMapping?.leagueId || 1,
        name: event.league?.name || 'Unknown League',
        slug: event.league?.slug || 'unknown',
        country: 'Unknown',
        countryCode: 'UN',
        tier: 2,
      },
      sport: {
        id: sportMapping?.sportId || 1,
        name: event.sport?.name || 'Football',
        slug: event.sport?.slug || 'football',
        icon: event.sport?.slug || 'soccer',
      },
      tipsCount: 0,
    };
  });

  setCache(cacheKey, matches);
  return matches;
}

// Get upcoming events from Odds-API.io
export async function getOddsAPIIOMatches(sport: string = 'football'): Promise<UnifiedMatch[]> {
  const cacheKey = `odds-api-io-${sport}`;
  const cached = getCached<UnifiedMatch[]>(cacheKey, CACHE_DURATION.upcoming);
  if (cached) return cached;

  const data = await fetchOddsAPIIO('events', { sport });
  if (!data || !Array.isArray(data)) return [];

  const sportMapping = ODDS_API_IO_SPORTS[sport];

  const matches: UnifiedMatch[] = data.map((event: {
    id: number;
    home: string;
    homeId: number;
    away: string;
    awayId: number;
    date: string;
    status: string;
    sport?: { name: string; slug: string };
    league?: { name: string; slug: string };
  }) => ({
    id: `oaio_${event.id}`,
    externalId: String(event.id),
    source: 'odds-api-io' as const,
    sportId: sportMapping?.sportId || 1,
    sportKey: sport,
    leagueId: sportMapping?.leagueId || 1,
    leagueKey: event.league?.slug || sport,
    homeTeam: {
      id: String(event.homeId),
      name: event.home,
      shortName: getShortName(event.home),
    },
    awayTeam: {
      id: String(event.awayId),
      name: event.away,
      shortName: getShortName(event.away),
    },
    kickoffTime: new Date(event.date),
    status: getMatchStatus(new Date(event.date)),
    homeScore: null,
    awayScore: null,
    league: {
      id: sportMapping?.leagueId || 1,
      name: event.league?.name || 'League',
      slug: event.league?.slug || sport,
      country: 'World',
      countryCode: 'WO',
      tier: 1,
    },
    sport: {
      id: sportMapping?.sportId || 1,
      name: event.sport?.name || sport.charAt(0).toUpperCase() + sport.slice(1),
      slug: event.sport?.slug || sport,
      icon: event.sport?.slug || sport,
    },
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
  // ESPN is PRIMARY (FREE, no API key, real-time data)
  // SportsData.io is secondary (requires API key)
  // The Odds API and Odds-API.io are tertiary (require valid API keys)
  const results = await Promise.allSettled([
    // ESPN - PRIMARY SOURCE (FREE, real-time, no API key)
    getESPNNBAScores(),
    getESPNNFLScores(),
    getESPNMLBScores(),
    getESPNNHLScores(),
    getESPNMMAScores(),
    getESPNPremierLeagueScores(),
    getESPNLaLigaScores(),
    getESPNBundesligaScores(),
    getESPNSerieAScores(),
    getESPNMLSScores(),
    getESPNChampionsLeagueScores(),
    // Odds-API.io - Live events (has free tier, 100 requests/hour)
    getOddsAPIIOLiveEvents(),
    getOddsAPIIOMatches('football'),
    getOddsAPIIOMatches('basketball'),
    // SportsData.io - Secondary (for additional data if available)
    getSportsDataIONFLGames(),
    getSportsDataIONBAGames(),
    getSportsDataIOMLBGames(),
    getSportsDataIONHLGames(),
    getSportsDataIOMMAEvents(),
    // The Odds API - Only if quota available (you're at 549/500)
    // Disabled until quota resets on 1st of month
    // getTheOddsAPIMatches('soccer_epl'),
    // getTheOddsAPIMatches('basketball_nba'),
  ]);

  // Process all results
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

// Get a single match by ID
export async function getMatchById(matchId: string): Promise<UnifiedMatch | null> {
  try {
    // Try to find in all matches
    const allMatches = await getAllMatches();
    const match = allMatches.find(m => m.id === matchId);
    
    if (match) {
      return match;
    }
    
    return null;
  } catch (error) {
    console.error('[API] Error fetching match by ID:', error);
    return null;
  }
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
