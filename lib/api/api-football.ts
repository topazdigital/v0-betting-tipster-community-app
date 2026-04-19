// ============================================
// API-Football Service - Real Match Data
// https://www.api-football.com/
// ============================================

import { ALL_SPORTS, ALL_LEAGUES, TEAMS_DATABASE, getSportIcon } from '@/lib/sports-data';

// Types
export interface APIFootballMatch {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    periods: {
      first: number | null;
      second: number | null;
    };
    venue: {
      id: number | null;
      name: string | null;
      city: string | null;
    };
    status: {
      long: string;
      short: string;
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string | null;
    flag: string | null;
    season: number;
    round: string | null;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string | null;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string | null;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

export interface UnifiedMatch {
  id: string;
  externalId?: string;
  source: 'api-football' | 'fallback';
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
  status: 'scheduled' | 'live' | 'halftime' | 'finished' | 'postponed' | 'cancelled' | 'extra_time' | 'penalties';
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
    logo?: string;
  };
  sport: {
    id: number;
    name: string;
    slug: string;
    icon: string;
  };
  odds?: {
    home: number;
    draw?: number;
    away: number;
  };
  markets?: Market[];
  tipsCount: number;
  venue?: string;
  referee?: string;
}

export interface Market {
  key: string;
  name: string;
  outcomes: {
    name: string;
    price: number;
    point?: number;
  }[];
}

// API-Football league ID mapping to our internal IDs
const API_FOOTBALL_LEAGUE_MAPPING: Record<number, number> = {
  // Top 5 European Leagues
  39: 1,    // Premier League
  140: 2,   // La Liga
  78: 3,    // Bundesliga
  135: 4,   // Serie A
  61: 5,    // Ligue 1
  
  // Other European Leagues
  88: 6,    // Eredivisie
  94: 7,    // Primeira Liga
  179: 8,   // Scottish Premiership
  
  // European Competitions
  2: 9,     // Champions League
  3: 10,    // Europa League
  848: 10,  // Conference League
  
  // Americas
  253: 11,  // MLS
  71: 12,   // Brazilian Serie A
  128: 13,  // Argentine Primera
  
  // Other
  307: 14,  // Saudi Pro League
  203: 15,  // Turkish Super Lig
  144: 16,  // Belgian Pro League
  235: 17,  // Russian Premier League
  98: 18,   // J League
  292: 19,  // K League
  188: 20,  // A-League
  
  // African
  12: 21,   // CAF Champions League
  270: 22,  // Kenya Premier League
  233: 23,  // Egyptian Premier League
  6: 24,    // AFCON
  
  // South American
  13: 25,   // Copa Libertadores
};

// Reverse mapping for API calls
const INTERNAL_TO_API_LEAGUE: Record<number, number> = Object.fromEntries(
  Object.entries(API_FOOTBALL_LEAGUE_MAPPING).map(([api, internal]) => [internal, Number(api)])
);

// Featured leagues to fetch (limit API calls)
const FEATURED_API_LEAGUES = [39, 140, 78, 135, 61, 2, 3, 253, 71]; // Top leagues

// Cache
const CACHE_DURATION = {
  live: 30 * 1000,           // 30 seconds for live
  fixtures: 5 * 60 * 1000,   // 5 minutes for fixtures
  standings: 30 * 60 * 1000, // 30 minutes for standings
};

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
// API Client
// ============================================

async function fetchAPIFootball(endpoint: string): Promise<unknown> {
  const apiKey = process.env.API_FOOTBALL_KEY || process.env.RAPIDAPI_KEY;
  
  if (!apiKey) {
    console.log('[API-Football] No API key configured, using fallback data');
    return null;
  }

  const url = `https://v3.football.api-sports.io/${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'v3.football.api-sports.io',
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      console.error(`[API-Football] Error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    // Log remaining API calls
    const remaining = response.headers.get('x-ratelimit-remaining');
    if (remaining) {
      console.log(`[API-Football] Remaining calls: ${remaining}`);
    }

    return data;
  } catch (error) {
    console.error('[API-Football] Fetch error:', error);
    return null;
  }
}

// ============================================
// Status Mapping
// ============================================

function mapStatus(apiStatus: string): UnifiedMatch['status'] {
  const statusMap: Record<string, UnifiedMatch['status']> = {
    // Not Started
    'TBD': 'scheduled',
    'NS': 'scheduled',
    'TIME': 'scheduled',
    
    // In Play
    '1H': 'live',
    '2H': 'live',
    'ET': 'extra_time',
    'P': 'penalties',
    'BT': 'live',
    'HT': 'halftime',
    'LIVE': 'live',
    
    // Finished
    'FT': 'finished',
    'AET': 'finished',
    'PEN': 'finished',
    
    // Cancelled/Postponed
    'PST': 'postponed',
    'CANC': 'cancelled',
    'ABD': 'cancelled',
    'AWD': 'finished',
    'WO': 'finished',
    'SUSP': 'postponed',
    'INT': 'live',
  };
  
  return statusMap[apiStatus] || 'scheduled';
}

function getShortName(name: string): string {
  // Remove common suffixes
  const cleaned = name
    .replace(/\s*(FC|CF|SC|AC|AS|SS|US|RC|CD|SD|UD|Real|Athletic|Atletico|Club|United|City|Town|Rovers|Wanderers|Albion|Hotspur|County|Forest|Palace|Villa|Wednesday|Rangers|Celtic|Dynamo|Sporting|Racing|Inter|Olympic)$/i, '')
    .trim();
  
  const words = cleaned.split(/\s+/);
  
  if (words.length === 1) {
    return cleaned.substring(0, 3).toUpperCase();
  }
  
  // Use first letters of each word (max 3)
  return words
    .slice(0, 3)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

// ============================================
// Transform API Response
// ============================================

function transformMatch(match: APIFootballMatch): UnifiedMatch {
  const status = mapStatus(match.fixture.status.short);
  const leagueId = API_FOOTBALL_LEAGUE_MAPPING[match.league.id] || match.league.id;
  const league = ALL_LEAGUES.find(l => l.id === leagueId);
  
  // Get country code from league or country name
  const getCountryCode = (country: string): string => {
    const countryMap: Record<string, string> = {
      'England': 'GB-ENG',
      'Spain': 'ES',
      'Germany': 'DE',
      'Italy': 'IT',
      'France': 'FR',
      'Netherlands': 'NL',
      'Portugal': 'PT',
      'Scotland': 'GB-SCT',
      'USA': 'US',
      'Brazil': 'BR',
      'Argentina': 'AR',
      'Japan': 'JP',
      'South-Korea': 'KR',
      'Australia': 'AU',
      'Kenya': 'KE',
      'Egypt': 'EG',
      'Saudi-Arabia': 'SA',
      'Turkey': 'TR',
      'Belgium': 'BE',
      'Russia': 'RU',
      'World': 'WO',
      'Europe': 'EU',
      'Africa': 'AF',
    };
    return countryMap[country] || country.substring(0, 2).toUpperCase();
  };

  return {
    id: `af_${match.fixture.id}`,
    externalId: String(match.fixture.id),
    source: 'api-football',
    sportId: 1, // Football
    sportKey: 'football',
    leagueId,
    leagueKey: league?.slug || match.league.name.toLowerCase().replace(/\s+/g, '-'),
    homeTeam: {
      id: String(match.teams.home.id),
      name: match.teams.home.name,
      shortName: getShortName(match.teams.home.name),
      logo: match.teams.home.logo || undefined,
    },
    awayTeam: {
      id: String(match.teams.away.id),
      name: match.teams.away.name,
      shortName: getShortName(match.teams.away.name),
      logo: match.teams.away.logo || undefined,
    },
    kickoffTime: new Date(match.fixture.date),
    status,
    homeScore: match.goals.home,
    awayScore: match.goals.away,
    minute: match.fixture.status.elapsed || undefined,
    period: match.fixture.status.short,
    league: {
      id: leagueId,
      name: match.league.name,
      slug: league?.slug || match.league.name.toLowerCase().replace(/\s+/g, '-'),
      country: match.league.country,
      countryCode: league?.countryCode || getCountryCode(match.league.country),
      tier: league?.tier || 1,
      logo: match.league.logo || undefined,
    },
    sport: {
      id: 1,
      name: 'Football',
      slug: 'football',
      icon: getSportIcon('football'),
    },
    tipsCount: Math.floor(Math.random() * 50),
    venue: match.fixture.venue.name || undefined,
    referee: match.fixture.referee || undefined,
  };
}

// ============================================
// Fetch Methods
// ============================================

export async function getLiveMatches(): Promise<UnifiedMatch[]> {
  const cacheKey = 'api-football-live';
  const cached = getCached<UnifiedMatch[]>(cacheKey, CACHE_DURATION.live);
  if (cached) return cached;

  const data = await fetchAPIFootball('fixtures?live=all');
  
  if (!data || typeof data !== 'object' || !('response' in data)) {
    return [];
  }

  const response = (data as { response: APIFootballMatch[] }).response;
  const matches = response.map(transformMatch);
  
  setCache(cacheKey, matches);
  return matches;
}

export async function getTodayMatches(): Promise<UnifiedMatch[]> {
  const cacheKey = 'api-football-today';
  const cached = getCached<UnifiedMatch[]>(cacheKey, CACHE_DURATION.fixtures);
  if (cached) return cached;

  const today = new Date().toISOString().split('T')[0];
  const data = await fetchAPIFootball(`fixtures?date=${today}`);
  
  if (!data || typeof data !== 'object' || !('response' in data)) {
    return [];
  }

  const response = (data as { response: APIFootballMatch[] }).response;
  const matches = response.map(transformMatch);
  
  setCache(cacheKey, matches);
  return matches;
}

export async function getUpcomingMatches(days: number = 7): Promise<UnifiedMatch[]> {
  const cacheKey = `api-football-upcoming-${days}`;
  const cached = getCached<UnifiedMatch[]>(cacheKey, CACHE_DURATION.fixtures);
  if (cached) return cached;

  const allMatches: UnifiedMatch[] = [];
  const today = new Date();
  
  // Fetch next 3 days to limit API calls
  for (let i = 0; i < Math.min(days, 3); i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    const data = await fetchAPIFootball(`fixtures?date=${dateStr}`);
    
    if (data && typeof data === 'object' && 'response' in data) {
      const response = (data as { response: APIFootballMatch[] }).response;
      allMatches.push(...response.map(transformMatch));
    }
  }
  
  // Sort by kickoff time
  allMatches.sort((a, b) => 
    new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime()
  );
  
  setCache(cacheKey, allMatches);
  return allMatches;
}

export async function getMatchesByLeague(leagueId: number, season?: number): Promise<UnifiedMatch[]> {
  const apiLeagueId = INTERNAL_TO_API_LEAGUE[leagueId] || leagueId;
  const currentSeason = season || new Date().getFullYear();
  
  const cacheKey = `api-football-league-${apiLeagueId}-${currentSeason}`;
  const cached = getCached<UnifiedMatch[]>(cacheKey, CACHE_DURATION.fixtures);
  if (cached) return cached;

  const data = await fetchAPIFootball(`fixtures?league=${apiLeagueId}&season=${currentSeason}&next=20`);
  
  if (!data || typeof data !== 'object' || !('response' in data)) {
    return [];
  }

  const response = (data as { response: APIFootballMatch[] }).response;
  const matches = response.map(transformMatch);
  
  setCache(cacheKey, matches);
  return matches;
}

export async function getFinishedMatches(days: number = 3): Promise<UnifiedMatch[]> {
  const cacheKey = `api-football-finished-${days}`;
  const cached = getCached<UnifiedMatch[]>(cacheKey, CACHE_DURATION.fixtures);
  if (cached) return cached;

  const allMatches: UnifiedMatch[] = [];
  const today = new Date();
  
  // Fetch past days
  for (let i = 1; i <= days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const data = await fetchAPIFootball(`fixtures?date=${dateStr}&status=FT-AET-PEN`);
    
    if (data && typeof data === 'object' && 'response' in data) {
      const response = (data as { response: APIFootballMatch[] }).response;
      allMatches.push(...response.map(transformMatch));
    }
  }
  
  // Sort by kickoff time (most recent first)
  allMatches.sort((a, b) => 
    new Date(b.kickoffTime).getTime() - new Date(a.kickoffTime).getTime()
  );
  
  setCache(cacheKey, allMatches);
  return allMatches;
}

export async function getMatchById(fixtureId: string): Promise<UnifiedMatch | null> {
  // Remove prefix if present
  const id = fixtureId.replace('af_', '');
  
  const cacheKey = `api-football-match-${id}`;
  const cached = getCached<UnifiedMatch>(cacheKey, CACHE_DURATION.live);
  if (cached) return cached;

  const data = await fetchAPIFootball(`fixtures?id=${id}`);
  
  if (!data || typeof data !== 'object' || !('response' in data)) {
    return null;
  }

  const response = (data as { response: APIFootballMatch[] }).response;
  if (response.length === 0) return null;
  
  const match = transformMatch(response[0]);
  setCache(cacheKey, match);
  return match;
}

// ============================================
// Standings
// ============================================

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

export async function getLeagueStandings(leagueId: number, season?: number): Promise<Standing[]> {
  const apiLeagueId = INTERNAL_TO_API_LEAGUE[leagueId] || leagueId;
  const currentSeason = season || new Date().getFullYear();
  
  const cacheKey = `api-football-standings-${apiLeagueId}-${currentSeason}`;
  const cached = getCached<Standing[]>(cacheKey, CACHE_DURATION.standings);
  if (cached) return cached;

  const data = await fetchAPIFootball(`standings?league=${apiLeagueId}&season=${currentSeason}`);
  
  if (!data || typeof data !== 'object' || !('response' in data)) {
    return [];
  }

  const response = (data as { response: Array<{ league: { standings: Array<Array<{
    rank: number;
    team: { id: number; name: string; logo: string };
    points: number;
    goalsDiff: number;
    form: string;
    all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
  }>> } }> }).response;
  
  if (response.length === 0 || !response[0].league.standings[0]) {
    return [];
  }

  const standings: Standing[] = response[0].league.standings[0].map(team => ({
    position: team.rank,
    team: {
      id: String(team.team.id),
      name: team.team.name,
      logo: team.team.logo,
    },
    played: team.all.played,
    won: team.all.win,
    drawn: team.all.draw,
    lost: team.all.lose,
    goalsFor: team.all.goals.for,
    goalsAgainst: team.all.goals.against,
    goalDifference: team.goalsDiff,
    points: team.points,
    form: team.form ? team.form.split('') : undefined,
  }));

  setCache(cacheKey, standings);
  return standings;
}

// ============================================
// H2H and Match Details
// ============================================

export interface H2HData {
  played: number;
  homeWins: number;
  draws: number;
  awayWins: number;
  recentMatches: Array<{
    date: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    competition: string;
  }>;
}

export async function getH2H(homeTeamId: string, awayTeamId: string): Promise<H2HData | null> {
  const cacheKey = `api-football-h2h-${homeTeamId}-${awayTeamId}`;
  const cached = getCached<H2HData>(cacheKey, CACHE_DURATION.standings);
  if (cached) return cached;

  const data = await fetchAPIFootball(`fixtures/headtohead?h2h=${homeTeamId}-${awayTeamId}&last=10`);
  
  if (!data || typeof data !== 'object' || !('response' in data)) {
    return null;
  }

  const response = (data as { response: APIFootballMatch[] }).response;
  
  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  
  const recentMatches = response.map(match => {
    if (match.goals.home !== null && match.goals.away !== null) {
      if (match.goals.home > match.goals.away) {
        if (String(match.teams.home.id) === homeTeamId) homeWins++;
        else awayWins++;
      } else if (match.goals.away > match.goals.home) {
        if (String(match.teams.away.id) === awayTeamId) awayWins++;
        else homeWins++;
      } else {
        draws++;
      }
    }
    
    return {
      date: match.fixture.date,
      homeTeam: match.teams.home.name,
      awayTeam: match.teams.away.name,
      homeScore: match.goals.home || 0,
      awayScore: match.goals.away || 0,
      competition: match.league.name,
    };
  });

  const h2hData: H2HData = {
    played: response.length,
    homeWins,
    draws,
    awayWins,
    recentMatches,
  };

  setCache(cacheKey, h2hData);
  return h2hData;
}

// ============================================
// Match Statistics
// ============================================

export interface MatchStatistic {
  name: string;
  home: number | string;
  away: number | string;
}

export async function getMatchStatistics(fixtureId: string): Promise<MatchStatistic[]> {
  const id = fixtureId.replace('af_', '');
  
  const cacheKey = `api-football-stats-${id}`;
  const cached = getCached<MatchStatistic[]>(cacheKey, CACHE_DURATION.live);
  if (cached) return cached;

  const data = await fetchAPIFootball(`fixtures/statistics?fixture=${id}`);
  
  if (!data || typeof data !== 'object' || !('response' in data)) {
    return [];
  }

  const response = (data as { response: Array<{
    team: { id: number };
    statistics: Array<{ type: string; value: number | string | null }>;
  }> }).response;
  
  if (response.length < 2) return [];

  const homeStats = response[0].statistics;
  const awayStats = response[1].statistics;
  
  const stats: MatchStatistic[] = homeStats.map((stat, idx) => ({
    name: stat.type,
    home: stat.value ?? 0,
    away: awayStats[idx]?.value ?? 0,
  }));

  setCache(cacheKey, stats);
  return stats;
}

// ============================================
// Odds (if available in API plan)
// ============================================

export async function getMatchOdds(fixtureId: string): Promise<Market[]> {
  const id = fixtureId.replace('af_', '');
  
  const cacheKey = `api-football-odds-${id}`;
  const cached = getCached<Market[]>(cacheKey, CACHE_DURATION.fixtures);
  if (cached) return cached;

  const data = await fetchAPIFootball(`odds?fixture=${id}`);
  
  if (!data || typeof data !== 'object' || !('response' in data)) {
    // Return default odds structure
    return generateDefaultOdds();
  }

  const response = (data as { response: Array<{
    bookmakers: Array<{
      name: string;
      bets: Array<{
        name: string;
        values: Array<{ value: string; odd: string }>;
      }>;
    }>;
  }> }).response;
  
  if (response.length === 0) {
    return generateDefaultOdds();
  }

  // Get first bookmaker's odds
  const bookmaker = response[0].bookmakers[0];
  if (!bookmaker) return generateDefaultOdds();

  const markets: Market[] = bookmaker.bets.map(bet => ({
    key: bet.name.toLowerCase().replace(/\s+/g, '_'),
    name: bet.name,
    outcomes: bet.values.map(v => ({
      name: v.value,
      price: parseFloat(v.odd),
    })),
  }));

  setCache(cacheKey, markets);
  return markets;
}

function generateDefaultOdds(): Market[] {
  return [
    {
      key: 'match_winner',
      name: 'Match Winner',
      outcomes: [
        { name: 'Home', price: +(1.5 + Math.random() * 2).toFixed(2) },
        { name: 'Draw', price: +(2.8 + Math.random() * 1.5).toFixed(2) },
        { name: 'Away', price: +(2 + Math.random() * 3).toFixed(2) },
      ],
    },
    {
      key: 'btts',
      name: 'Both Teams to Score',
      outcomes: [
        { name: 'Yes', price: +(1.7 + Math.random() * 0.4).toFixed(2) },
        { name: 'No', price: +(1.9 + Math.random() * 0.4).toFixed(2) },
      ],
    },
    {
      key: 'over_under_2_5',
      name: 'Over/Under 2.5',
      outcomes: [
        { name: 'Over 2.5', price: +(1.8 + Math.random() * 0.5).toFixed(2) },
        { name: 'Under 2.5', price: +(1.9 + Math.random() * 0.5).toFixed(2) },
      ],
    },
    {
      key: 'double_chance',
      name: 'Double Chance',
      outcomes: [
        { name: '1X', price: +(1.2 + Math.random() * 0.3).toFixed(2) },
        { name: '12', price: +(1.1 + Math.random() * 0.2).toFixed(2) },
        { name: 'X2', price: +(1.3 + Math.random() * 0.3).toFixed(2) },
      ],
    },
  ];
}

// ============================================
// Export types and functions
// ============================================

export type { APIFootballMatch, UnifiedMatch, Market };
