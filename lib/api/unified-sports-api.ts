// ============================================
// Unified Sports API Service - EXPANDED
// Combines ESPN (FREE), The Odds API, and more
// ============================================

import { ALL_SPORTS, ALL_LEAGUES, type LeagueConfig } from '@/lib/sports-data';

// ============================================
// Types
// ============================================

export interface UnifiedMatch {
  id: string;
  externalId?: string;
  source: 'espn' | 'the-odds-api' | 'sportsdata-io' | 'odds-api-io' | 'fallback';
  sportId: number;
  sportKey: string;
  leagueId: number;
  leagueKey: string;
  homeTeam: {
    id: string;
    name: string;
    shortName: string;
    logo?: string;
    form?: string;
    record?: string;
  };
  awayTeam: {
    id: string;
    name: string;
    shortName: string;
    logo?: string;
    form?: string;
    record?: string;
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
  venue?: string;
  // Sport-specific statistics
  sportSpecificData?: SportSpecificData;
}

// Sport-specific statistics types
export interface SportSpecificData {
  // Soccer
  possession?: { home: number; away: number };
  shots?: { home: number; away: number };
  shotsOnTarget?: { home: number; away: number };
  corners?: { home: number; away: number };
  fouls?: { home: number; away: number };
  yellowCards?: { home: number; away: number };
  redCards?: { home: number; away: number };
  
  // Basketball
  quarters?: { home: number[]; away: number[] };
  rebounds?: { home: number; away: number };
  assists?: { home: number; away: number };
  steals?: { home: number; away: number };
  blocks?: { home: number; away: number };
  turnovers?: { home: number; away: number };
  fieldGoalPct?: { home: number; away: number };
  threePointPct?: { home: number; away: number };
  freeThrowPct?: { home: number; away: number };
  
  // American Football
  passingYards?: { home: number; away: number };
  rushingYards?: { home: number; away: number };
  totalYards?: { home: number; away: number };
  firstDowns?: { home: number; away: number };
  thirdDownConv?: { home: string; away: string };
  timeOfPossession?: { home: string; away: string };
  sacks?: { home: number; away: number };
  interceptions?: { home: number; away: number };
  fumbles?: { home: number; away: number };
  
  // Tennis
  sets?: { home: number[]; away: number[] };
  aces?: { home: number; away: number };
  doubleFaults?: { home: number; away: number };
  firstServePct?: { home: number; away: number };
  breakPoints?: { home: string; away: string };
  winners?: { home: number; away: number };
  unforcedErrors?: { home: number; away: number };
  
  // MMA/Boxing
  round?: number;
  totalRounds?: number;
  method?: string; // KO, Submission, Decision
  strikes?: { home: number; away: number };
  takedowns?: { home: number; away: number };
  significantStrikes?: { home: number; away: number };
  
  // Ice Hockey
  powerPlayGoals?: { home: number; away: number };
  penaltyMinutes?: { home: number; away: number };
  faceoffWins?: { home: number; away: number };
  hitsCount?: { home: number; away: number };
  blockedShots?: { home: number; away: number };
  
  // Baseball
  hits?: { home: number; away: number };
  errors?: { home: number; away: number };
  innings?: { home: number[]; away: number[] };
  strikeouts?: { home: number; away: number };
  walks?: { home: number; away: number };
  homeRuns?: { home: number; away: number };
  
  // Cricket
  overs?: { home: string; away: string };
  wickets?: { home: number; away: number };
  runRate?: { home: number; away: number };
  extras?: { home: number; away: number };
  
  // F1/Racing
  lapTimes?: string[];
  positions?: { driver: string; position: number; gap: string }[];
  pitStops?: number;
  fastestLap?: string;
  
  // Golf
  scores?: { player: string; total: number; today: number; thru: string }[];
  leaderboard?: boolean;
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
// ESPN League Configuration - COMPREHENSIVE
// ============================================

interface ESPNLeagueConfig {
  sport: string;
  league: string;
  sportId: number;
  leagueId: number;
  leagueName: string;
  country: string;
  countryCode: string;
  sportType: 'soccer' | 'basketball' | 'football' | 'baseball' | 'hockey' | 'mma' | 'tennis' | 'cricket' | 'rugby' | 'golf' | 'racing';
}

// ESPN supports these leagues - all FREE, no API key needed
const ESPN_LEAGUES: ESPNLeagueConfig[] = [
  // SOCCER - European Top Leagues
  { sport: 'soccer', league: 'eng.1', sportId: 1, leagueId: 1, leagueName: 'Premier League', country: 'England', countryCode: 'GB', sportType: 'soccer' },
  { sport: 'soccer', league: 'esp.1', sportId: 1, leagueId: 2, leagueName: 'La Liga', country: 'Spain', countryCode: 'ES', sportType: 'soccer' },
  { sport: 'soccer', league: 'ger.1', sportId: 1, leagueId: 3, leagueName: 'Bundesliga', country: 'Germany', countryCode: 'DE', sportType: 'soccer' },
  { sport: 'soccer', league: 'ita.1', sportId: 1, leagueId: 4, leagueName: 'Serie A', country: 'Italy', countryCode: 'IT', sportType: 'soccer' },
  { sport: 'soccer', league: 'fra.1', sportId: 1, leagueId: 5, leagueName: 'Ligue 1', country: 'France', countryCode: 'FR', sportType: 'soccer' },
  { sport: 'soccer', league: 'ned.1', sportId: 1, leagueId: 6, leagueName: 'Eredivisie', country: 'Netherlands', countryCode: 'NL', sportType: 'soccer' },
  { sport: 'soccer', league: 'por.1', sportId: 1, leagueId: 7, leagueName: 'Primeira Liga', country: 'Portugal', countryCode: 'PT', sportType: 'soccer' },
  { sport: 'soccer', league: 'sco.1', sportId: 1, leagueId: 8, leagueName: 'Scottish Premiership', country: 'Scotland', countryCode: 'GB-SCT', sportType: 'soccer' },
  { sport: 'soccer', league: 'bel.1', sportId: 1, leagueId: 16, leagueName: 'Belgian Pro League', country: 'Belgium', countryCode: 'BE', sportType: 'soccer' },
  { sport: 'soccer', league: 'tur.1', sportId: 1, leagueId: 15, leagueName: 'Turkish Super Lig', country: 'Turkey', countryCode: 'TR', sportType: 'soccer' },
  
  // SOCCER - European Competitions
  { sport: 'soccer', league: 'uefa.champions', sportId: 1, leagueId: 9, leagueName: 'Champions League', country: 'Europe', countryCode: 'EU', sportType: 'soccer' },
  { sport: 'soccer', league: 'uefa.europa', sportId: 1, leagueId: 10, leagueName: 'Europa League', country: 'Europe', countryCode: 'EU', sportType: 'soccer' },
  { sport: 'soccer', league: 'uefa.europa.conf', sportId: 1, leagueId: 26, leagueName: 'Conference League', country: 'Europe', countryCode: 'EU', sportType: 'soccer' },
  
  // SOCCER - Americas
  { sport: 'soccer', league: 'usa.1', sportId: 1, leagueId: 11, leagueName: 'MLS', country: 'USA', countryCode: 'US', sportType: 'soccer' },
  { sport: 'soccer', league: 'bra.1', sportId: 1, leagueId: 12, leagueName: 'Brazilian Serie A', country: 'Brazil', countryCode: 'BR', sportType: 'soccer' },
  { sport: 'soccer', league: 'arg.1', sportId: 1, leagueId: 13, leagueName: 'Argentine Primera', country: 'Argentina', countryCode: 'AR', sportType: 'soccer' },
  { sport: 'soccer', league: 'mex.1', sportId: 1, leagueId: 27, leagueName: 'Liga MX', country: 'Mexico', countryCode: 'MX', sportType: 'soccer' },
  { sport: 'soccer', league: 'conmebol.libertadores', sportId: 1, leagueId: 25, leagueName: 'Copa Libertadores', country: 'South America', countryCode: 'SA', sportType: 'soccer' },
  
  // SOCCER - Asia & Others
  { sport: 'soccer', league: 'aus.1', sportId: 1, leagueId: 20, leagueName: 'A-League', country: 'Australia', countryCode: 'AU', sportType: 'soccer' },
  { sport: 'soccer', league: 'jpn.1', sportId: 1, leagueId: 18, leagueName: 'J League', country: 'Japan', countryCode: 'JP', sportType: 'soccer' },
  { sport: 'soccer', league: 'chn.1', sportId: 1, leagueId: 28, leagueName: 'Chinese Super League', country: 'China', countryCode: 'CN', sportType: 'soccer' },
  { sport: 'soccer', league: 'sau.1', sportId: 1, leagueId: 14, leagueName: 'Saudi Pro League', country: 'Saudi Arabia', countryCode: 'SA', sportType: 'soccer' },
  
  // SOCCER - International
  { sport: 'soccer', league: 'fifa.world', sportId: 1, leagueId: 29, leagueName: 'World Cup', country: 'World', countryCode: 'WO', sportType: 'soccer' },
  { sport: 'soccer', league: 'uefa.euro', sportId: 1, leagueId: 30, leagueName: 'Euro Championship', country: 'Europe', countryCode: 'EU', sportType: 'soccer' },
  { sport: 'soccer', league: 'conmebol.america', sportId: 1, leagueId: 31, leagueName: 'Copa America', country: 'South America', countryCode: 'SA', sportType: 'soccer' },
  { sport: 'soccer', league: 'caf.nations', sportId: 1, leagueId: 24, leagueName: 'AFCON', country: 'Africa', countryCode: 'AF', sportType: 'soccer' },
  
  // BASKETBALL
  { sport: 'basketball', league: 'nba', sportId: 2, leagueId: 101, leagueName: 'NBA', country: 'USA', countryCode: 'US', sportType: 'basketball' },
  { sport: 'basketball', league: 'wnba', sportId: 2, leagueId: 107, leagueName: 'WNBA', country: 'USA', countryCode: 'US', sportType: 'basketball' },
  { sport: 'basketball', league: 'mens-college-basketball', sportId: 2, leagueId: 108, leagueName: 'NCAA Basketball', country: 'USA', countryCode: 'US', sportType: 'basketball' },
  
  // AMERICAN FOOTBALL
  { sport: 'football', league: 'nfl', sportId: 5, leagueId: 401, leagueName: 'NFL', country: 'USA', countryCode: 'US', sportType: 'football' },
  { sport: 'football', league: 'college-football', sportId: 5, leagueId: 402, leagueName: 'NCAA Football', country: 'USA', countryCode: 'US', sportType: 'football' },
  { sport: 'football', league: 'cfl', sportId: 5, leagueId: 403, leagueName: 'CFL', country: 'Canada', countryCode: 'CA', sportType: 'football' },
  { sport: 'football', league: 'xfl', sportId: 5, leagueId: 404, leagueName: 'XFL', country: 'USA', countryCode: 'US', sportType: 'football' },
  
  // BASEBALL
  { sport: 'baseball', league: 'mlb', sportId: 6, leagueId: 501, leagueName: 'MLB', country: 'USA', countryCode: 'US', sportType: 'baseball' },
  
  // ICE HOCKEY
  { sport: 'hockey', league: 'nhl', sportId: 7, leagueId: 601, leagueName: 'NHL', country: 'USA/Canada', countryCode: 'US', sportType: 'hockey' },
  
  // MMA
  { sport: 'mma', league: 'ufc', sportId: 27, leagueId: 2701, leagueName: 'UFC', country: 'World', countryCode: 'WO', sportType: 'mma' },
  { sport: 'mma', league: 'pfl', sportId: 27, leagueId: 2702, leagueName: 'PFL', country: 'USA', countryCode: 'US', sportType: 'mma' },
  { sport: 'mma', league: 'bellator', sportId: 27, leagueId: 2703, leagueName: 'Bellator', country: 'USA', countryCode: 'US', sportType: 'mma' },
  
  // TENNIS
  { sport: 'tennis', league: 'atp', sportId: 3, leagueId: 201, leagueName: 'ATP Tour', country: 'World', countryCode: 'WO', sportType: 'tennis' },
  { sport: 'tennis', league: 'wta', sportId: 3, leagueId: 202, leagueName: 'WTA Tour', country: 'World', countryCode: 'WO', sportType: 'tennis' },
  
  // CRICKET
  { sport: 'cricket', league: 'ipl', sportId: 4, leagueId: 301, leagueName: 'IPL', country: 'India', countryCode: 'IN', sportType: 'cricket' },
  { sport: 'cricket', league: 'bbl', sportId: 4, leagueId: 302, leagueName: 'Big Bash League', country: 'Australia', countryCode: 'AU', sportType: 'cricket' },
  { sport: 'cricket', league: 'psl', sportId: 4, leagueId: 306, leagueName: 'PSL', country: 'Pakistan', countryCode: 'PK', sportType: 'cricket' },
  
  // RUGBY
  { sport: 'rugby', league: 'six-nations', sportId: 8, leagueId: 701, leagueName: 'Six Nations', country: 'Europe', countryCode: 'EU', sportType: 'rugby' },
  { sport: 'rugby', league: 'super-rugby', sportId: 8, leagueId: 703, leagueName: 'Super Rugby', country: 'Southern Hemisphere', countryCode: 'SH', sportType: 'rugby' },
  { sport: 'rugby', league: 'premiership', sportId: 8, leagueId: 704, leagueName: 'Premiership Rugby', country: 'England', countryCode: 'GB', sportType: 'rugby' },
  
  // GOLF
  { sport: 'golf', league: 'pga', sportId: 17, leagueId: 1701, leagueName: 'PGA Tour', country: 'USA', countryCode: 'US', sportType: 'golf' },
  { sport: 'golf', league: 'lpga', sportId: 17, leagueId: 1704, leagueName: 'LPGA Tour', country: 'USA', countryCode: 'US', sportType: 'golf' },
  { sport: 'golf', league: 'european-tour', sportId: 17, leagueId: 1702, leagueName: 'DP World Tour', country: 'Europe', countryCode: 'EU', sportType: 'golf' },
  
  // RACING
  { sport: 'racing', league: 'f1', sportId: 29, leagueId: 2901, leagueName: 'Formula 1', country: 'World', countryCode: 'WO', sportType: 'racing' },
  { sport: 'racing', league: 'nascar-cup', sportId: 31, leagueId: 3101, leagueName: 'NASCAR Cup Series', country: 'USA', countryCode: 'US', sportType: 'racing' },
  { sport: 'racing', league: 'indycar', sportId: 32, leagueId: 3201, leagueName: 'IndyCar', country: 'USA', countryCode: 'US', sportType: 'racing' },
];

// ============================================
// Cache Configuration
// ============================================

const CACHE_DURATION = {
  live: 15 * 1000, // 15 seconds for live data
  upcoming: 2 * 60 * 1000, // 2 minutes for upcoming
  standings: 15 * 60 * 1000, // 15 minutes for standings
  outrights: 30 * 60 * 1000, // 30 minutes for outrights
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
// API Status Tracking
// ============================================

const apiStatus = {
  espn: { working: true, lastError: '', lastCheck: 0 },
  theOddsApi: { working: false, lastError: '', lastCheck: 0 },
  sportsDataIo: { working: true, lastError: '', lastCheck: 0 },
  oddsApiIo: { working: false, lastError: '', lastCheck: 0 },
};

export function getApiStatus() {
  return apiStatus;
}

// ============================================
// ESPN API Client (FREE - Primary Source)
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
      team?: {
        id: string;
        name: string;
        abbreviation: string;
        displayName: string;
        logo?: string;
      };
      athlete?: {
        id: string;
        displayName: string;
        shortName?: string;
      };
      homeAway: 'home' | 'away';
      score?: string;
      form?: string;
      records?: Array<{ summary?: string; type?: string }>;
      statistics?: Array<{
        name: string;
        displayValue: string;
      }>;
      linescores?: Array<{
        value: number;
      }>;
    }>;
    status?: {
      clock?: number;
      displayClock?: string;
      period?: number;
    };
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

// Build reverse lookup: slugified league key (e.g. "eng1") -> ESPNLeagueConfig
const ESPN_LEAGUE_BY_SLUG = new Map<string, ESPNLeagueConfig>();
for (const cfg of ESPN_LEAGUES) {
  ESPN_LEAGUE_BY_SLUG.set(cfg.league.replace(/[^a-z0-9]/gi, ''), cfg);
}
export function getEspnLeagueConfigForId(matchId: string): ESPNLeagueConfig | null {
  const m = matchId.match(/^espn_([a-z0-9]+)_(\d+)$/i);
  if (!m) return null;
  return ESPN_LEAGUE_BY_SLUG.get(m[1]) || null;
}
export function getEspnEventIdFromMatchId(matchId: string): string | null {
  const m = matchId.match(/^espn_[a-z0-9]+_(\d+)$/i);
  return m ? m[1] : null;
}

async function fetchESPN(sport: string, league: string, endpoint: string = 'scoreboard'): Promise<ESPNScoreboardResponseFull | null> {
  const url = `${ESPN_BASE_URL}/${sport}/${league}/${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 15 },
    });

    if (!response.ok) {
      apiStatus.espn.lastError = `HTTP ${response.status}`;
      return null;
    }

    apiStatus.espn.working = true;
    apiStatus.espn.lastCheck = Date.now();
    
    return await response.json();
  } catch (error) {
    apiStatus.espn.lastError = String(error);
    return null;
  }
}

// ============================================
// ESPN Odds extraction (real DraftKings/etc odds)
// ============================================

function americanToDecimal(american: number | string | undefined): number | undefined {
  if (american === undefined || american === null || american === '') return undefined;
  const n = typeof american === 'string' ? parseFloat(american.replace(/[^\d.\-+]/g, '')) : american;
  if (!Number.isFinite(n) || n === 0) return undefined;
  const decimal = n > 0 ? 1 + n / 100 : 1 + 100 / Math.abs(n);
  return Math.round(decimal * 100) / 100;
}

interface ESPNOddsRaw {
  provider?: { id?: string; name?: string; displayName?: string };
  details?: string;
  overUnder?: number;
  spread?: number;
  overOdds?: number | string;
  underOdds?: number | string;
  drawOdds?: { moneyLine?: number };
  homeTeamOdds?: { moneyLine?: number; spreadOdds?: number; favorite?: boolean; team?: { id?: string } };
  awayTeamOdds?: { moneyLine?: number; spreadOdds?: number; favorite?: boolean; team?: { id?: string } };
  total?: {
    over?: { close?: { odds?: string; line?: string }, open?: { odds?: string; line?: string } };
    under?: { close?: { odds?: string; line?: string }, open?: { odds?: string; line?: string } };
  };
  // New ESPN scoreboard format (2024+)
  moneyline?: {
    displayName?: string;
    shortDisplayName?: string;
    home?: { open?: { odds?: string }; close?: { odds?: string } };
    away?: { open?: { odds?: string }; close?: { odds?: string } };
    draw?: { open?: { odds?: string }; close?: { odds?: string } };
  };
  pointSpread?: {
    displayName?: string;
    shortDisplayName?: string;
    home?: { open?: { line?: string; odds?: string }; close?: { line?: string; odds?: string } };
    away?: { open?: { line?: string; odds?: string }; close?: { line?: string; odds?: string } };
  };
}

interface ESPNScoreboardResponseFull extends ESPNScoreboardResponse {
  events: Array<ESPNEvent & { competitions: Array<ESPNEvent['competitions'][number] & { odds?: ESPNOddsRaw[]; venue?: { fullName?: string; address?: { city?: string; country?: string } } }> }>;
}

export function extractEspnOdds(rawOddsList: ESPNOddsRaw[] | undefined, hasDraw: boolean = true): { odds?: MatchOdds; markets?: Market[] } {
  if (!rawOddsList || rawOddsList.length === 0) return {};

  // Try to find provider with moneyline data — support BOTH ESPN formats:
  // Old: homeTeamOdds.moneyLine (number)
  // New (2024+): moneyline.home.close.odds (string like "+180")
  const o = rawOddsList.find(x =>
    x.homeTeamOdds?.moneyLine !== undefined ||
    x.awayTeamOdds?.moneyLine !== undefined ||
    x.moneyline?.home?.close?.odds !== undefined ||
    x.moneyline?.away?.close?.odds !== undefined
  ) || rawOddsList[0];
  if (!o) return {};

  // Extract moneyline: prefer new format, fallback to old
  const home = americanToDecimal(o.moneyline?.home?.close?.odds ?? o.homeTeamOdds?.moneyLine);
  const away = americanToDecimal(o.moneyline?.away?.close?.odds ?? o.awayTeamOdds?.moneyLine);
  const draw = hasDraw
    ? americanToDecimal(o.moneyline?.draw?.close?.odds ?? o.drawOdds?.moneyLine)
    : undefined;

  if (!home || !away) return {};

  const odds: MatchOdds = {
    home,
    away,
    draw,
    bookmaker: o.provider?.displayName || o.provider?.name || 'DraftKings',
    lastUpdate: new Date(),
  };

  const markets: Market[] = [{
    key: 'h2h',
    name: 'Match Result',
    outcomes: [
      { name: 'Home', price: home },
      ...(draw ? [{ name: 'Draw', price: draw }] : []),
      { name: 'Away', price: away },
    ],
  }];

  // Spread / handicap — support new format (pointSpread) and old (homeTeamOdds.spreadOdds)
  if (o.pointSpread?.home?.close?.odds && o.pointSpread?.away?.close?.odds) {
    const homeSpread = americanToDecimal(o.pointSpread.home.close.odds);
    const awaySpread = americanToDecimal(o.pointSpread.away.close.odds);
    const spreadLine = parseFloat(o.pointSpread.home.close.line || '0');
    if (homeSpread && awaySpread) {
      markets.push({
        key: 'spreads',
        name: 'Handicap',
        outcomes: [
          { name: 'Home', price: homeSpread, point: spreadLine },
          { name: 'Away', price: awaySpread, point: -spreadLine },
        ],
      });
    }
  } else if (o.spread !== undefined && o.homeTeamOdds?.spreadOdds !== undefined) {
    const homeSpread = americanToDecimal(o.homeTeamOdds.spreadOdds);
    const awaySpread = americanToDecimal(o.awayTeamOdds?.spreadOdds);
    if (homeSpread && awaySpread) {
      markets.push({
        key: 'spreads',
        name: 'Handicap',
        outcomes: [
          { name: 'Home', price: homeSpread, point: -Math.abs(o.spread) },
          { name: 'Away', price: awaySpread, point: Math.abs(o.spread) },
        ],
      });
    }
  }

  // Totals (over/under)
  if (o.overUnder !== undefined) {
    const overOdds = americanToDecimal(o.total?.over?.close?.odds || o.overOdds);
    const underOdds = americanToDecimal(o.total?.under?.close?.odds || o.underOdds);
    if (overOdds && underOdds) {
      markets.push({
        key: 'totals',
        name: 'Total Goals/Points',
        outcomes: [
          { name: 'Over', price: overOdds, point: o.overUnder },
          { name: 'Under', price: underOdds, point: o.overUnder },
        ],
      });
    }
  }

  return { odds, markets };
}

// ============================================
// ESPN Summary endpoint - rich match details
// ============================================

export interface ESPNSummaryResponse {
  header?: {
    competitions?: Array<{
      competitors?: Array<{
        id?: string;
        homeAway?: 'home' | 'away';
        winner?: boolean;
        team?: { id: string; displayName: string; abbreviation: string; logo?: string; color?: string };
        score?: string;
        record?: Array<{ summary?: string; type?: string }>;
        form?: string; // "WWDLW"
      }>;
    }>;
    season?: { year?: number; type?: number };
    league?: { id?: string; name?: string };
  };
  gameInfo?: {
    venue?: { fullName?: string; address?: { city?: string; country?: string }; capacity?: number; indoor?: boolean };
    attendance?: number;
    officials?: Array<{ displayName?: string; position?: { displayName?: string } }>;
    weather?: { displayValue?: string; temperature?: number };
  };
  pickcenter?: ESPNOddsRaw[];
  odds?: ESPNOddsRaw[];
  hasOdds?: boolean;
  rosters?: Array<{
    team?: { id: string; displayName: string; logo?: string };
    homeAway?: 'home' | 'away';
    formation?: string;
    roster?: Array<{
      starter?: boolean;
      position?: { abbreviation?: string; name?: string };
      jersey?: string;
      athlete?: { id: string; displayName: string; shortName?: string; headshot?: string };
      stats?: Array<{ name?: string; displayValue?: string }>;
    }>;
    coach?: Array<{ firstName?: string; lastName?: string; displayName?: string }>;
  }>;
  headToHeadGames?: Array<{
    team?: { id?: string; displayName?: string; abbreviation?: string; logo?: string };
    games?: Array<{
      gameDate?: string;
      score?: string;
      gameResult?: string;
      homeTeam?: { displayName: string; abbreviation: string; logo?: string; score?: string };
      awayTeam?: { displayName: string; abbreviation: string; logo?: string; score?: string };
      league?: { abbreviation?: string };
    }>;
  }>;
  standings?: {
    fullViewLink?: { href?: string };
    groups?: Array<{
      header?: string;
      standings?: {
        entries?: Array<{
          team?: { id?: string; displayName?: string; abbreviation?: string; logo?: string };
          stats?: Array<{ name?: string; abbreviation?: string; value?: number; displayValue?: string }>;
        }>;
      };
    }>;
  };
  news?: { articles?: Array<{ id?: number; headline?: string; description?: string; published?: string; images?: Array<{ url?: string }>; links?: { web?: { href?: string } } }> };
  leaders?: Array<{
    team?: { id?: string; displayName?: string };
    leaders?: Array<{
      name?: string;
      displayName?: string;
      leaders?: Array<{ displayValue?: string; athlete?: { displayName?: string; headshot?: string; shortName?: string } }>;
    }>;
  }>;
  broadcasts?: Array<{ market?: string; media?: { shortName?: string } }>;
  scoringPlays?: Array<{
    id?: string;
    type?: { id?: string; text?: string; abbreviation?: string };
    period?: { number?: number; type?: string };
    clock?: { value?: number; displayValue?: string };
    team?: { id?: string; displayName?: string; abbreviation?: string };
    participants?: Array<{
      athlete?: { id?: string; displayName?: string; shortName?: string; headshot?: string };
      type?: { name?: string };
    }>;
    text?: string;
    scoreValue?: number;
    awayScore?: number;
    homeScore?: number;
  }>;
  plays?: Array<{
    id?: string;
    type?: { id?: string; text?: string; abbreviation?: string };
    period?: { number?: number };
    clock?: { value?: number; displayValue?: string };
    team?: { id?: string; displayName?: string };
    participants?: Array<{
      athlete?: { id?: string; displayName?: string; shortName?: string; headshot?: string };
      type?: { name?: string };
    }>;
    text?: string;
    scoringPlay?: boolean;
    scoreValue?: number;
    homeScore?: number;
    awayScore?: number;
  }>;
}

export async function fetchESPNSummary(sport: string, league: string, eventId: string): Promise<ESPNSummaryResponse | null> {
  const cacheKey = `espn-summary-${sport}-${league}-${eventId}`;
  const cached = getCached<ESPNSummaryResponse>(cacheKey, 60 * 1000); // 1 min
  if (cached) return cached;

  const url = `${ESPN_BASE_URL}/${sport}/${league}/summary?event=${eventId}`;
  try {
    const r = await fetch(url, { headers: { 'Accept': 'application/json' }, next: { revalidate: 60 } });
    if (!r.ok) return null;
    const j = await r.json() as ESPNSummaryResponse;
    setCache(cacheKey, j);
    return j;
  } catch (e) {
    console.error('[ESPN summary] fetch failed', e);
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

// Generate realistic odds based on team factors
export function generateRealisticOdds(
  homeTeamName: string,
  awayTeamName: string,
  sportType: ESPNLeagueConfig['sportType'] = 'soccer'
): MatchOdds {
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
  
  // Home advantage varies by sport
  const homeAdvantage: Record<string, number> = {
    soccer: 0.45,
    basketball: 0.55,
    football: 0.52,
    baseball: 0.53,
    hockey: 0.52,
    mma: 0.5,
    tennis: 0.5,
    cricket: 0.52,
    rugby: 0.52,
    golf: 0.5,
    racing: 0.5,
  };
  
  // Sports without draw
  const noDrawSports = ['basketball', 'baseball', 'mma', 'tennis', 'golf', 'racing'];
  
  let homeProb = (homeAdvantage[sportType] || 0.5) + (seed - 0.5) * 0.3;
  let awayProb: number;
  let drawProb: number | undefined;
  
  if (noDrawSports.includes(sportType)) {
    awayProb = 1 - homeProb;
    drawProb = undefined;
  } else {
    drawProb = 0.25 + (seed * 0.1);
    homeProb = Math.max(0.2, Math.min(0.55, homeProb));
    awayProb = 1 - homeProb - drawProb;
  }
  
  // Convert to decimal odds with bookmaker margin
  const margin = 1.06;
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

// Generate sport-specific betting markets
function generateBettingMarkets(
  homeTeam: string,
  awayTeam: string,
  odds: MatchOdds,
  sportType: ESPNLeagueConfig['sportType'] = 'soccer'
): Market[] {
  const markets: Market[] = [];
  
  // Main market (1X2 or Moneyline)
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
    
    // Over/Under Goals
    markets.push({
      key: 'totals_2_5',
      name: 'Over/Under 2.5 Goals',
      outcomes: [
        { name: 'Over 2.5', price: Math.round((1.85 + Math.random() * 0.3) * 100) / 100 },
        { name: 'Under 2.5', price: Math.round((1.9 + Math.random() * 0.25) * 100) / 100 },
      ]
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
    const spread = odds.home < odds.away ? -5.5 : 5.5;
    markets.push({
      key: 'spreads',
      name: 'Point Spread',
      outcomes: [
        { name: `${homeTeam} ${spread > 0 ? '+' : ''}${spread}`, price: 1.91, point: spread },
        { name: `${awayTeam} ${-spread > 0 ? '+' : ''}${-spread}`, price: 1.91, point: -spread },
      ]
    });
    
    const totalPoints = 210 + Math.floor(Math.random() * 30);
    markets.push({
      key: 'totals',
      name: `Total Points (${totalPoints}.5)`,
      outcomes: [
        { name: `Over ${totalPoints}.5`, price: 1.91, point: totalPoints + 0.5 },
        { name: `Under ${totalPoints}.5`, price: 1.91, point: totalPoints + 0.5 },
      ]
    });
    
    // Quarter betting
    markets.push({
      key: 'first_quarter',
      name: '1st Quarter Winner',
      outcomes: [
        { name: homeTeam, price: Math.round((odds.home * 0.95) * 100) / 100 },
        { name: awayTeam, price: Math.round((odds.away * 0.95) * 100) / 100 },
      ]
    });
  } else if (sportType === 'football') {
    const spread = odds.home < odds.away ? -3.5 : 3.5;
    markets.push({
      key: 'spreads',
      name: 'Point Spread',
      outcomes: [
        { name: `${homeTeam} ${spread > 0 ? '+' : ''}${spread}`, price: 1.91, point: spread },
        { name: `${awayTeam} ${-spread > 0 ? '+' : ''}${-spread}`, price: 1.91, point: -spread },
      ]
    });
    
    const totalPoints = 42 + Math.floor(Math.random() * 10);
    markets.push({
      key: 'totals',
      name: `Total Points (${totalPoints}.5)`,
      outcomes: [
        { name: `Over ${totalPoints}.5`, price: 1.91, point: totalPoints + 0.5 },
        { name: `Under ${totalPoints}.5`, price: 1.91, point: totalPoints + 0.5 },
      ]
    });
    
    // First Touchdown Scorer type market
    markets.push({
      key: 'first_score',
      name: 'First Team to Score',
      outcomes: [
        { name: homeTeam, price: Math.round((1.85 + Math.random() * 0.2) * 100) / 100 },
        { name: awayTeam, price: Math.round((1.95 + Math.random() * 0.2) * 100) / 100 },
      ]
    });
  } else if (sportType === 'tennis') {
    // Set betting
    markets.push({
      key: 'set_betting',
      name: 'Set Betting',
      outcomes: [
        { name: `${homeTeam} 2-0`, price: Math.round((2.5 + Math.random() * 1) * 100) / 100 },
        { name: `${homeTeam} 2-1`, price: Math.round((3.5 + Math.random() * 1) * 100) / 100 },
        { name: `${awayTeam} 2-0`, price: Math.round((2.8 + Math.random() * 1) * 100) / 100 },
        { name: `${awayTeam} 2-1`, price: Math.round((3.8 + Math.random() * 1) * 100) / 100 },
      ]
    });
    
    // Games handicap
    markets.push({
      key: 'games_handicap',
      name: 'Games Handicap',
      outcomes: [
        { name: `${homeTeam} -4.5`, price: 1.91 },
        { name: `${awayTeam} +4.5`, price: 1.91 },
      ]
    });
  } else if (sportType === 'mma') {
    // Method of Victory
    markets.push({
      key: 'method',
      name: 'Method of Victory',
      outcomes: [
        { name: `${homeTeam} by KO/TKO`, price: Math.round((3 + Math.random() * 2) * 100) / 100 },
        { name: `${homeTeam} by Submission`, price: Math.round((5 + Math.random() * 3) * 100) / 100 },
        { name: `${homeTeam} by Decision`, price: Math.round((4 + Math.random() * 2) * 100) / 100 },
        { name: `${awayTeam} by KO/TKO`, price: Math.round((3.5 + Math.random() * 2) * 100) / 100 },
        { name: `${awayTeam} by Submission`, price: Math.round((5.5 + Math.random() * 3) * 100) / 100 },
        { name: `${awayTeam} by Decision`, price: Math.round((4.5 + Math.random() * 2) * 100) / 100 },
      ]
    });
    
    // Total Rounds
    markets.push({
      key: 'total_rounds',
      name: 'Total Rounds',
      outcomes: [
        { name: 'Over 1.5', price: Math.round((1.7 + Math.random() * 0.3) * 100) / 100 },
        { name: 'Under 1.5', price: Math.round((2.1 + Math.random() * 0.3) * 100) / 100 },
      ]
    });
  } else if (sportType === 'hockey') {
    // Puck line (NHL spread)
    markets.push({
      key: 'puck_line',
      name: 'Puck Line',
      outcomes: [
        { name: `${homeTeam} -1.5`, price: Math.round((2.1 + Math.random() * 0.3) * 100) / 100 },
        { name: `${awayTeam} +1.5`, price: Math.round((1.75 + Math.random() * 0.2) * 100) / 100 },
      ]
    });
    
    const totalGoals = 5 + Math.floor(Math.random() * 2);
    markets.push({
      key: 'totals',
      name: `Total Goals (${totalGoals}.5)`,
      outcomes: [
        { name: `Over ${totalGoals}.5`, price: 1.91, point: totalGoals + 0.5 },
        { name: `Under ${totalGoals}.5`, price: 1.91, point: totalGoals + 0.5 },
      ]
    });
  } else if (sportType === 'cricket') {
    // Match Winner
    markets.push({
      key: 'match_winner',
      name: 'Match Winner',
      outcomes: [
        { name: homeTeam, price: odds.home },
        { name: awayTeam, price: odds.away },
      ]
    });
    
    // Top Batsman runs
    markets.push({
      key: 'total_runs',
      name: 'Total Match Runs',
      outcomes: [
        { name: 'Over 320.5', price: Math.round((1.85 + Math.random() * 0.2) * 100) / 100 },
        { name: 'Under 320.5', price: Math.round((1.95 + Math.random() * 0.2) * 100) / 100 },
      ]
    });
  }
  
  return markets;
}

// Generate sport-specific statistics
function generateSportSpecificData(sportType: ESPNLeagueConfig['sportType'], status: UnifiedMatch['status']): SportSpecificData | undefined {
  if (status === 'scheduled') return undefined;
  
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  switch (sportType) {
    case 'soccer':
      return {
        possession: { home: rand(40, 60), away: 100 - rand(40, 60) },
        shots: { home: rand(5, 15), away: rand(5, 15) },
        shotsOnTarget: { home: rand(2, 8), away: rand(2, 8) },
        corners: { home: rand(2, 8), away: rand(2, 8) },
        fouls: { home: rand(5, 15), away: rand(5, 15) },
        yellowCards: { home: rand(0, 3), away: rand(0, 3) },
        redCards: { home: rand(0, 1), away: rand(0, 1) },
      };
    case 'basketball':
      return {
        quarters: { home: [rand(20, 35), rand(20, 35), rand(20, 35), rand(20, 35)], away: [rand(20, 35), rand(20, 35), rand(20, 35), rand(20, 35)] },
        rebounds: { home: rand(35, 55), away: rand(35, 55) },
        assists: { home: rand(18, 30), away: rand(18, 30) },
        steals: { home: rand(5, 12), away: rand(5, 12) },
        blocks: { home: rand(2, 8), away: rand(2, 8) },
        turnovers: { home: rand(8, 18), away: rand(8, 18) },
        fieldGoalPct: { home: rand(40, 55), away: rand(40, 55) },
        threePointPct: { home: rand(28, 42), away: rand(28, 42) },
        freeThrowPct: { home: rand(70, 90), away: rand(70, 90) },
      };
    case 'football':
      return {
        passingYards: { home: rand(150, 350), away: rand(150, 350) },
        rushingYards: { home: rand(50, 180), away: rand(50, 180) },
        totalYards: { home: rand(250, 450), away: rand(250, 450) },
        firstDowns: { home: rand(12, 25), away: rand(12, 25) },
        thirdDownConv: { home: `${rand(3, 8)}/${rand(10, 15)}`, away: `${rand(3, 8)}/${rand(10, 15)}` },
        timeOfPossession: { home: `${rand(25, 35)}:${rand(10, 59).toString().padStart(2, '0')}`, away: `${rand(25, 35)}:${rand(10, 59).toString().padStart(2, '0')}` },
        sacks: { home: rand(0, 5), away: rand(0, 5) },
        interceptions: { home: rand(0, 3), away: rand(0, 3) },
        fumbles: { home: rand(0, 2), away: rand(0, 2) },
      };
    case 'tennis':
      return {
        sets: { home: [rand(0, 7), rand(0, 7)], away: [rand(0, 7), rand(0, 7)] },
        aces: { home: rand(2, 15), away: rand(2, 15) },
        doubleFaults: { home: rand(0, 5), away: rand(0, 5) },
        firstServePct: { home: rand(55, 75), away: rand(55, 75) },
        breakPoints: { home: `${rand(1, 4)}/${rand(3, 8)}`, away: `${rand(1, 4)}/${rand(3, 8)}` },
        winners: { home: rand(15, 40), away: rand(15, 40) },
        unforcedErrors: { home: rand(10, 35), away: rand(10, 35) },
      };
    case 'mma':
      return {
        round: rand(1, 5),
        totalRounds: 3,
        strikes: { home: rand(30, 100), away: rand(30, 100) },
        takedowns: { home: rand(0, 5), away: rand(0, 5) },
        significantStrikes: { home: rand(20, 80), away: rand(20, 80) },
      };
    case 'hockey':
      return {
        shots: { home: rand(20, 40), away: rand(20, 40) },
        powerPlayGoals: { home: rand(0, 2), away: rand(0, 2) },
        penaltyMinutes: { home: rand(2, 12), away: rand(2, 12) },
        faceoffWins: { home: rand(20, 35), away: rand(20, 35) },
        hitsCount: { home: rand(15, 35), away: rand(15, 35) },
        blockedShots: { home: rand(8, 20), away: rand(8, 20) },
      };
    case 'baseball':
      return {
        hits: { home: rand(5, 12), away: rand(5, 12) },
        errors: { home: rand(0, 2), away: rand(0, 2) },
        innings: { home: [rand(0, 3), rand(0, 2), rand(0, 3), rand(0, 2), rand(0, 3), rand(0, 2), rand(0, 3), rand(0, 2), rand(0, 3)], away: [rand(0, 3), rand(0, 2), rand(0, 3), rand(0, 2), rand(0, 3), rand(0, 2), rand(0, 3), rand(0, 2), rand(0, 3)] },
        strikeouts: { home: rand(4, 12), away: rand(4, 12) },
        walks: { home: rand(1, 5), away: rand(1, 5) },
        homeRuns: { home: rand(0, 3), away: rand(0, 3) },
      };
    case 'cricket':
      return {
        overs: { home: `${rand(15, 20)}.${rand(0, 5)}`, away: `${rand(15, 20)}.${rand(0, 5)}` },
        wickets: { home: rand(1, 10), away: rand(1, 10) },
        runRate: { home: rand(6, 12), away: rand(6, 12) },
        extras: { home: rand(2, 12), away: rand(2, 12) },
      };
    default:
      return undefined;
  }
}

// Generic ESPN match fetcher
async function getESPNMatches(config: ESPNLeagueConfig): Promise<UnifiedMatch[]> {
  const cacheKey = `espn-${config.sport}-${config.league}`;
  const cached = getCached<UnifiedMatch[]>(cacheKey, CACHE_DURATION.live);
  if (cached) return cached;

  const data = await fetchESPN(config.sport, config.league);
  if (!data?.events) return [];

  // Sports without draws (basketball, baseball, mma, tennis etc.)
  const noDrawSports: ESPNLeagueConfig['sportType'][] = ['basketball', 'baseball', 'mma', 'tennis', 'golf', 'racing'];
  const hasDraw = !noDrawSports.includes(config.sportType);

  const matches: UnifiedMatch[] = data.events.map((event) => {
    const competition = event.competitions[0];
    const homeCompetitor = competition?.competitors.find(c => c.homeAway === 'home');
    const awayCompetitor = competition?.competitors.find(c => c.homeAway === 'away');
    
    // Handle both team sports and individual sports (tennis, golf, etc.)
    const homeTeamName = homeCompetitor?.team?.displayName || homeCompetitor?.team?.name || homeCompetitor?.athlete?.displayName || 'TBD';
    const awayTeamName = awayCompetitor?.team?.displayName || awayCompetitor?.team?.name || awayCompetitor?.athlete?.displayName || 'TBD';
    
    const status = mapESPNStatus(event.status);
    // Extract REAL odds from ESPN scoreboard (DraftKings/Caesars/etc) - NO computed fallback
    const { odds, markets } = extractEspnOdds(competition?.odds, hasDraw);
    const venue = competition?.venue?.fullName;

    return {
      id: `espn_${config.league.replace(/[^a-z0-9]/gi, '')}_${event.id}`,
      externalId: event.id,
      source: 'espn' as const,
      sportId: config.sportId,
      sportKey: `${config.sport}_${config.league}`,
      leagueId: config.leagueId,
      leagueKey: config.league,
      homeTeam: {
        id: homeCompetitor?.team?.id || homeCompetitor?.athlete?.id || '',
        name: homeTeamName,
        shortName: homeCompetitor?.team?.abbreviation || homeCompetitor?.athlete?.shortName || 'TBD',
        logo: homeCompetitor?.team?.logo,
        form: homeCompetitor?.form || undefined,
        record: homeCompetitor?.records?.find(r => r.type === 'total' || !r.type)?.summary || undefined,
      },
      awayTeam: {
        id: awayCompetitor?.team?.id || awayCompetitor?.athlete?.id || '',
        name: awayTeamName,
        shortName: awayCompetitor?.team?.abbreviation || awayCompetitor?.athlete?.shortName || 'TBD',
        logo: awayCompetitor?.team?.logo,
        form: awayCompetitor?.form || undefined,
        record: awayCompetitor?.records?.find(r => r.type === 'total' || !r.type)?.summary || undefined,
      },
      kickoffTime: new Date(event.date),
      status,
      homeScore: homeCompetitor?.score ? parseInt(homeCompetitor.score, 10) : null,
      awayScore: awayCompetitor?.score ? parseInt(awayCompetitor.score, 10) : null,
      minute: event.status.period,
      period: event.status.displayClock,
      league: {
        id: config.leagueId,
        name: config.leagueName,
        slug: config.league.replace(/\./g, '-'),
        country: config.country,
        countryCode: config.countryCode,
        tier: 1,
      },
      sport: {
        id: config.sportId,
        name: ALL_SPORTS.find(s => s.id === config.sportId)?.name || config.sport,
        slug: ALL_SPORTS.find(s => s.id === config.sportId)?.slug || config.sport,
        icon: ALL_SPORTS.find(s => s.id === config.sportId)?.icon || config.sport,
      },
      odds,
      markets,
      tipsCount: 0,
      venue,
    };
  });

  // Filter out tournament-style events without a proper head-to-head matchup
  const filtered = matches.filter(m => {
    if (m.homeTeam.name === 'TBD' && m.awayTeam.name === 'TBD') return false;
    return true;
  });

  setCache(cacheKey, filtered);
  return filtered;
}

// ============================================
// The Odds API Client
// ============================================

const THE_ODDS_API_SPORTS: Record<string, { sportId: number; leagueId: number }> = {
  'soccer_epl': { sportId: 1, leagueId: 1 },
  'soccer_spain_la_liga': { sportId: 1, leagueId: 2 },
  'soccer_germany_bundesliga': { sportId: 1, leagueId: 3 },
  'soccer_italy_serie_a': { sportId: 1, leagueId: 4 },
  'soccer_france_ligue_one': { sportId: 1, leagueId: 5 },
  'soccer_uefa_champs_league': { sportId: 1, leagueId: 9 },
  'basketball_nba': { sportId: 2, leagueId: 101 },
  'americanfootball_nfl': { sportId: 5, leagueId: 401 },
  'baseball_mlb': { sportId: 6, leagueId: 501 },
  'icehockey_nhl': { sportId: 7, leagueId: 601 },
  'mma_mixed_martial_arts': { sportId: 27, leagueId: 2701 },
};

// Track quota exhaustion so we don't keep hammering the API
let theOddsApiOutOfCredits = 0; // timestamp when last 401/429 happened
const QUOTA_BACKOFF_MS = 60 * 60 * 1000; // 1 hour back-off

export async function fetchTheOddsAPI(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<unknown> {
  const apiKey = process.env.THE_ODDS_API_KEY;
  if (!apiKey || apiKey === 'your_api_key_here') {
    return null;
  }

  // If out of credits, skip until back-off expires
  if (theOddsApiOutOfCredits > 0 && Date.now() - theOddsApiOutOfCredits < QUOTA_BACKOFF_MS) {
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
      // Detect quota errors and back off
      if (response.status === 401 || response.status === 429) {
        try {
          const body = await response.json();
          if (body?.error_code === 'OUT_OF_USAGE_CREDITS' || body?.error_code === 'INVALID_API_KEY' || response.status === 429) {
            theOddsApiOutOfCredits = Date.now();
            apiStatus.theOddsApi.lastError = `${body?.error_code || 'QUOTA_EXCEEDED'}`;
            console.warn('[TheOddsAPI] Quota exhausted or invalid key — backing off for 1 hour. Falling back to computed odds.');
          }
        } catch {
          theOddsApiOutOfCredits = Date.now();
        }
      }
      return null;
    }

    apiStatus.theOddsApi.working = true;
    apiStatus.theOddsApi.lastCheck = Date.now();
    // Reset backoff on success
    theOddsApiOutOfCredits = 0;
    return await response.json();
  } catch (error) {
    apiStatus.theOddsApi.working = false;
    apiStatus.theOddsApi.lastError = String(error);
    return null;
  }
}

export function isTheOddsApiQuotaExhausted(): boolean {
  return theOddsApiOutOfCredits > 0 && Date.now() - theOddsApiOutOfCredits < QUOTA_BACKOFF_MS;
}

// ============================================
// Unified API - Combines All Sources
// ============================================

// ============================================
// The Odds API event type
// ============================================
interface TheOddsApiEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: Array<{
    key: string;
    title: string;
    last_update: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
        point?: number;
      }>;
    }>;
  }>;
}

// Normalize team name for fuzzy matching
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(fc|cf|sc|afc|cfc|club|the)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Compute average odds across bookmakers (best of)
function aggregateBookmakerOdds(event: TheOddsApiEvent): { odds?: MatchOdds; markets?: Market[] } {
  if (!event.bookmakers || event.bookmakers.length === 0) return {};

  const h2hPrices: { home: number[]; draw: number[]; away: number[] } = { home: [], draw: [], away: [] };
  const marketsMap = new Map<string, Map<string, number[]>>();

  for (const bm of event.bookmakers) {
    for (const market of bm.markets) {
      if (market.key === 'h2h') {
        for (const o of market.outcomes) {
          if (o.name === event.home_team) h2hPrices.home.push(o.price);
          else if (o.name === event.away_team) h2hPrices.away.push(o.price);
          else if (o.name.toLowerCase() === 'draw') h2hPrices.draw.push(o.price);
        }
      } else {
        if (!marketsMap.has(market.key)) marketsMap.set(market.key, new Map());
        const outcomesMap = marketsMap.get(market.key)!;
        for (const o of market.outcomes) {
          const k = o.point !== undefined ? `${o.name}|${o.point}` : o.name;
          if (!outcomesMap.has(k)) outcomesMap.set(k, []);
          outcomesMap.get(k)!.push(o.price);
        }
      }
    }
  }

  const avg = (arr: number[]) => arr.length ? Math.round((arr.reduce((s, p) => s + p, 0) / arr.length) * 100) / 100 : undefined;
  const odds: MatchOdds | undefined = h2hPrices.home.length && h2hPrices.away.length ? {
    home: avg(h2hPrices.home)!,
    draw: avg(h2hPrices.draw),
    away: avg(h2hPrices.away)!,
    bookmaker: `${event.bookmakers.length} bookmakers`,
    lastUpdate: new Date(),
  } : undefined;

  const markets: Market[] = [];
  if (odds) {
    markets.push({
      key: 'h2h',
      name: 'Match Result',
      outcomes: [
        { name: event.home_team, price: odds.home },
        ...(odds.draw ? [{ name: 'Draw', price: odds.draw }] : []),
        { name: event.away_team, price: odds.away },
      ],
    });
  }
  for (const [marketKey, outcomesMap] of marketsMap.entries()) {
    const outs: Outcome[] = [];
    for (const [k, prices] of outcomesMap.entries()) {
      const [name, pointStr] = k.split('|');
      outs.push({
        name,
        price: avg(prices)!,
        ...(pointStr ? { point: parseFloat(pointStr) } : {}),
      });
    }
    markets.push({
      key: marketKey,
      name: marketKey === 'spreads' ? 'Point Spread' : marketKey === 'totals' ? 'Totals' : marketKey,
      outcomes: outs,
    });
  }

  return { odds, markets };
}

// Fetch live odds from The Odds API for one sport key
async function fetchOddsForSport(sportKey: string): Promise<TheOddsApiEvent[]> {
  const cacheKey = `odds-${sportKey}`;
  const cached = getCached<TheOddsApiEvent[]>(cacheKey, 10 * 60 * 1000); // 10 min cache
  if (cached) return cached;

  const data = await fetchTheOddsAPI(`sports/${sportKey}/odds`, {
    regions: 'uk,eu,us',
    markets: 'h2h,spreads,totals',
    oddsFormat: 'decimal',
    dateFormat: 'iso',
  }) as TheOddsApiEvent[] | null;

  if (!data || !Array.isArray(data)) return [];
  setCache(cacheKey, data);
  return data;
}

// Build a lookup of real odds keyed by normalized team pair
async function buildRealOddsIndex(): Promise<Map<string, { odds: MatchOdds; markets: Market[] }>> {
  const apiKey = process.env.THE_ODDS_API_KEY;
  if (!apiKey || apiKey === 'your_api_key_here') return new Map();

  const sportKeys = Object.keys(THE_ODDS_API_SPORTS);
  // Fetch all in parallel
  const results = await Promise.allSettled(sportKeys.map(sk => fetchOddsForSport(sk)));

  const index = new Map<string, { odds: MatchOdds; markets: Market[] }>();
  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    for (const ev of result.value) {
      const { odds, markets } = aggregateBookmakerOdds(ev);
      if (!odds) continue;
      const home = normalizeTeamName(ev.home_team);
      const away = normalizeTeamName(ev.away_team);
      const dateKey = new Date(ev.commence_time).toISOString().split('T')[0];
      // Index by both orderings — ESPN sometimes flips home/away
      index.set(`${home}_${away}_${dateKey}`, { odds, markets: markets || [] });
      index.set(`${away}_${home}_${dateKey}`, { odds, markets: markets || [] });
    }
  }
  return index;
}

export async function getAllMatches(): Promise<UnifiedMatch[]> {
  const allMatches: UnifiedMatch[] = [];
  const seenMatchKeys = new Set<string>();

  const getMatchKey = (match: UnifiedMatch): string => {
    const homeNorm = match.homeTeam.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const awayNorm = match.awayTeam.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const dateKey = new Date(match.kickoffTime).toISOString().split('T')[0];
    return `${homeNorm}_${awayNorm}_${dateKey}`;
  };

  const addMatch = (match: UnifiedMatch) => {
    const key = getMatchKey(match);
    if (!seenMatchKeys.has(key)) {
      seenMatchKeys.add(key);
      allMatches.push(match);
    }
  };

  // Fetch ESPN matches AND real odds index in parallel
  const [espnResults, realOddsIndex] = await Promise.all([
    Promise.allSettled(ESPN_LEAGUES.map(config => getESPNMatches(config))),
    buildRealOddsIndex(),
  ]);

  for (const result of espnResults) {
    if (result.status === 'fulfilled' && result.value) {
      for (const match of result.value) {
        // Try to enrich with real bookmaker odds
        if (realOddsIndex.size > 0) {
          const homeNorm = normalizeTeamName(match.homeTeam.name);
          const awayNorm = normalizeTeamName(match.awayTeam.name);
          const dateKey = new Date(match.kickoffTime).toISOString().split('T')[0];
          const real = realOddsIndex.get(`${homeNorm}_${awayNorm}_${dateKey}`);
          if (real) {
            match.odds = real.odds;
            // Merge real markets in front of generated markets, dedupe by key
            const existingKeys = new Set(real.markets.map(m => m.key));
            const otherMarkets = (match.markets || []).filter(m => !existingKeys.has(m.key));
            match.markets = [...real.markets, ...otherMarkets];
            match.source = 'the-odds-api';
          }
        }
        addMatch(match);
      }
    }
  }

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

  const league = ALL_LEAGUES.find(l => l.id === leagueId);
  if (!league) return [];

  // Return empty for now - would implement via API
  return [];
}

// ============================================
// Outrights API
// ============================================

export async function getLeagueOutrights(leagueId: number): Promise<Outright[]> {
  const cacheKey = `outrights-${leagueId}`;
  const cached = getCached<Outright[]>(cacheKey, CACHE_DURATION.outrights);
  if (cached) return cached;

  return [];
}

// ============================================
// Helper Functions
// ============================================

const SPORT_PRIORITY: Record<number, number> = {
  1: 0,   // Football
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
  17: 11, // Golf
  33: 12, // Esports
};

export function sortMatchesWithPriority(matches: UnifiedMatch[]): UnifiedMatch[] {
  return matches.sort((a, b) => {
    const sportPriorityA = SPORT_PRIORITY[a.sportId] ?? 99;
    const sportPriorityB = SPORT_PRIORITY[b.sportId] ?? 99;
    if (sportPriorityA !== sportPriorityB) return sportPriorityA - sportPriorityB;

    const statusOrder = { live: 0, halftime: 1, scheduled: 2, finished: 3, postponed: 4, cancelled: 5 };
    const statusOrderA = statusOrder[a.status] ?? 5;
    const statusOrderB = statusOrder[b.status] ?? 5;
    if (statusOrderA !== statusOrderB) return statusOrderA - statusOrderB;

    return new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime();
  });
}

export async function getMatchById(matchId: string): Promise<UnifiedMatch | null> {
  try {
    const allMatches = await getAllMatches();
    return allMatches.find(m => m.id === matchId) || null;
  } catch (error) {
    console.error('[API] Error fetching match by ID:', error);
    return null;
  }
}

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

// Export ESPN leagues config for external use
export { ESPN_LEAGUES };
export type { ESPNLeagueConfig };
