import { NextRequest, NextResponse } from 'next/server';
import {
  getAllMatches,
  getMatchesBySport,
  getMatchesByLeague,
  getLiveMatches as getApiLiveMatches,
  getUpcomingMatches as getApiUpcomingMatches,
  getMatchById,
  type UnifiedMatch,
} from '@/lib/api/unified-sports-api';
import { generateAllMatches, filterMatches } from '@/lib/api/sports-api';
import { ALL_SPORTS, ALL_LEAGUES, TEAMS_DATABASE, getSportIcon } from '@/lib/sports-data';

export const dynamic = 'force-dynamic';
export const revalidate = 30;

// Sport priority - Football always first
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
  33: 11, // Esports
};

// European Top 5 League IDs
const EUROPEAN_TOP_5_LEAGUES = [1, 2, 3, 4, 5];

// Country to local league mapping for geo-priority
const COUNTRY_LEAGUES: Record<string, number[]> = {
  'KE': [22, 21, 24],
  'NG': [21, 24],
  'GH': [21, 24],
  'EG': [23, 21, 24],
  'ZA': [21, 24],
  'GB': [1, 8, 9, 10, ...EUROPEAN_TOP_5_LEAGUES],
  'ES': [2, 9, 10, ...EUROPEAN_TOP_5_LEAGUES],
  'DE': [3, 9, 10, ...EUROPEAN_TOP_5_LEAGUES],
  'IT': [4, 9, 10, ...EUROPEAN_TOP_5_LEAGUES],
  'FR': [5, 9, 10, ...EUROPEAN_TOP_5_LEAGUES],
  'US': [11, 401, 101, 501, 601],
  'BR': [12, 25],
  'AR': [13, 25],
  'JP': [18, 502],
  'AU': [20, 302, 103],
  'IN': [301],
};

export interface MatchData {
  id: string;
  sportId: number;
  leagueId: number;
  homeTeam: {
    id: number | string;
    name: string;
    shortName: string;
    logo?: string;
  };
  awayTeam: {
    id: number | string;
    name: string;
    shortName: string;
    logo?: string;
  };
  kickoffTime: string;
  status: 'scheduled' | 'live' | 'halftime' | 'finished' | 'postponed' | 'cancelled' | 'extra_time' | 'penalties';
  homeScore: number | null;
  awayScore: number | null;
  minute?: number;
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
  markets?: MarketOdds[];
  tipsCount: number;
  source?: string;
  venue?: string;
}

export interface MarketOdds {
  key: string;
  name: string;
  outcomes: Array<{
    name: string;
    price: number;
    point?: number;
  }>;
}

// Convert UnifiedMatch to MatchData format
function convertToMatchData(match: UnifiedMatch): MatchData {
  return {
    id: match.id,
    sportId: match.sportId,
    leagueId: match.leagueId,
    homeTeam: {
      id: match.homeTeam.id,
      name: match.homeTeam.name,
      shortName: match.homeTeam.shortName,
      logo: match.homeTeam.logo,
    },
    awayTeam: {
      id: match.awayTeam.id,
      name: match.awayTeam.name,
      shortName: match.awayTeam.shortName,
      logo: match.awayTeam.logo,
    },
    kickoffTime: new Date(match.kickoffTime).toISOString(),
    status: match.status as MatchData['status'],
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    minute: match.minute,
    league: match.league,
    sport: match.sport,
    odds: match.odds,
    markets: match.markets,
    tipsCount: match.tipsCount,
    source: match.source,
  };
}

// Generate fallback matches when APIs return no data
function generateFallbackMatches(userCountryCode?: string): MatchData[] {
  const matches: MatchData[] = [];
  const now = new Date();
  
  const matchCounts: Record<number, number> = {
    1: 60, 2: 25, 3: 20, 4: 15, 5: 20, 6: 15, 7: 15, 8: 10, 27: 8, 26: 6, 29: 5, 33: 15,
  };
  
  const leaguePriority = userCountryCode 
    ? COUNTRY_LEAGUES[userCountryCode.toUpperCase()] || EUROPEAN_TOP_5_LEAGUES
    : EUROPEAN_TOP_5_LEAGUES;
  
  ALL_SPORTS.forEach(sport => {
    const count = matchCounts[sport.id] || 5;
    const sportLeagues = ALL_LEAGUES.filter(l => l.sportId === sport.id);
    
    if (sportLeagues.length === 0) return;
    
    for (let i = 0; i < count; i++) {
      let league: typeof sportLeagues[0];
      if (i < sportLeagues.length && leaguePriority.includes(sportLeagues[i].id)) {
        league = sportLeagues.find(l => leaguePriority.includes(l.id)) || sportLeagues[0];
      } else {
        league = sportLeagues[Math.floor(Math.random() * sportLeagues.length)];
      }
      
      const leagueTeams = TEAMS_DATABASE.filter(t => t.leagueId === league.id);
      let homeTeam, awayTeam;
      
      if (leagueTeams.length >= 2) {
        const shuffled = [...leagueTeams].sort(() => Math.random() - 0.5);
        homeTeam = { id: shuffled[0].id, name: shuffled[0].name, shortName: shuffled[0].shortName };
        awayTeam = { id: shuffled[1].id, name: shuffled[1].name, shortName: shuffled[1].shortName };
      } else {
        homeTeam = { id: 9000 + i * 2, name: `${league.country} Team ${i * 2 + 1}`, shortName: `T${i * 2 + 1}` };
        awayTeam = { id: 9000 + i * 2 + 1, name: `${league.country} Team ${i * 2 + 2}`, shortName: `T${i * 2 + 2}` };
      }
      
      let kickoffTime: Date;
      let status: MatchData['status'];
      
      const rand = Math.random();
      if (rand < 0.12) {
        const minutesAgo = Math.floor(Math.random() * 90);
        kickoffTime = new Date(now.getTime() - minutesAgo * 60 * 1000);
        status = minutesAgo > 45 && minutesAgo < 60 ? 'halftime' : 'live';
      } else if (rand < 0.22) {
        kickoffTime = new Date(now.getTime() - (Math.floor(Math.random() * 12) + 2) * 60 * 60 * 1000);
        status = 'finished';
      } else {
        const hoursFromNow = (i / count) * 48;
        kickoffTime = new Date(now.getTime() + hoursFromNow * 60 * 60 * 1000);
        status = 'scheduled';
      }
      
      let homeScore: number | null = null;
      let awayScore: number | null = null;
      
      if (status === 'live' || status === 'halftime' || status === 'finished') {
        const maxGoals = sport.slug === 'basketball' ? 120 : sport.slug === 'american-football' ? 35 : 5;
        homeScore = Math.floor(Math.random() * maxGoals);
        awayScore = Math.floor(Math.random() * maxGoals);
      }
      
      const homeOdds = 1.5 + Math.random() * 2.5;
      const awayOdds = 1.5 + Math.random() * 3;
      const drawOdds = 2.8 + Math.random() * 1.5;
      
      const markets: MarketOdds[] = [
        {
          key: 'h2h',
          name: 'Match Result',
          outcomes: [
            { name: 'Home', price: Math.round(homeOdds * 100) / 100 },
            { name: 'Draw', price: Math.round(drawOdds * 100) / 100 },
            { name: 'Away', price: Math.round(awayOdds * 100) / 100 },
          ]
        },
        {
          key: 'btts',
          name: 'Both Teams to Score',
          outcomes: [
            { name: 'Yes', price: Math.round((1.7 + Math.random() * 0.4) * 100) / 100 },
            { name: 'No', price: Math.round((1.9 + Math.random() * 0.4) * 100) / 100 },
          ]
        },
        {
          key: 'over_under_2_5',
          name: 'Over/Under 2.5 Goals',
          outcomes: [
            { name: 'Over 2.5', price: Math.round((1.8 + Math.random() * 0.5) * 100) / 100 },
            { name: 'Under 2.5', price: Math.round((1.9 + Math.random() * 0.5) * 100) / 100 },
          ]
        },
      ];
      
      matches.push({
        id: `fallback-${sport.slug}-${league.slug}-${i}-${Date.now()}`,
        sportId: sport.id,
        leagueId: league.id,
        homeTeam,
        awayTeam,
        kickoffTime: kickoffTime.toISOString(),
        status,
        homeScore,
        awayScore,
        minute: status === 'live' ? Math.floor((now.getTime() - kickoffTime.getTime()) / 60000) : 
                status === 'halftime' ? 45 : undefined,
        league: {
          id: league.id,
          name: league.name,
          slug: league.slug,
          country: league.country,
          countryCode: league.countryCode,
          tier: league.tier,
        },
        sport: {
          id: sport.id,
          name: sport.name,
          slug: sport.slug,
          icon: getSportIcon(sport.slug),
        },
        odds: {
          home: Math.round(homeOdds * 100) / 100,
          draw: Math.round(drawOdds * 100) / 100,
          away: Math.round(awayOdds * 100) / 100,
        },
        markets,
        tipsCount: Math.floor(Math.random() * 50),
        source: 'fallback',
      });
    }
  });
  
  return sortMatches(matches, userCountryCode);
}

// Sort matches by priority
function sortMatches(matches: MatchData[], userCountryCode?: string): MatchData[] {
  const leaguePriority = userCountryCode 
    ? COUNTRY_LEAGUES[userCountryCode.toUpperCase()] || EUROPEAN_TOP_5_LEAGUES
    : EUROPEAN_TOP_5_LEAGUES;
    
  return matches.sort((a, b) => {
    // 1. Sport priority
    const sportPriorityA = SPORT_PRIORITY[a.sportId] ?? 99;
    const sportPriorityB = SPORT_PRIORITY[b.sportId] ?? 99;
    if (sportPriorityA !== sportPriorityB) return sportPriorityA - sportPriorityB;
    
    // 2. League priority
    const leaguePriorityA = leaguePriority.indexOf(a.leagueId);
    const leaguePriorityB = leaguePriority.indexOf(b.leagueId);
    const leagueOrderA = leaguePriorityA === -1 ? 999 : leaguePriorityA;
    const leagueOrderB = leaguePriorityB === -1 ? 999 : leaguePriorityB;
    if (leagueOrderA !== leagueOrderB) return leagueOrderA - leagueOrderB;
    
    // 3. Status order (live first)
    const statusOrder: Record<string, number> = { 
      live: 0, halftime: 1, extra_time: 1.5, penalties: 1.6, 
      scheduled: 2, finished: 3, postponed: 4, cancelled: 5 
    };
    const statusOrderA = statusOrder[a.status] ?? 5;
    const statusOrderB = statusOrder[b.status] ?? 5;
    if (statusOrderA !== statusOrderB) return statusOrderA - statusOrderB;
    
    // 4. Kickoff time
    return new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime();
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sportId = searchParams.get('sportId');
  const leagueId = searchParams.get('leagueId');
  const status = searchParams.get('status');
  const countryCode = searchParams.get('countryCode') || 'GB';
  const matchId = searchParams.get('matchId');
  
  try {
    let matches: MatchData[] = [];
    let apiSource = 'fallback';
    
    // Check which APIs are configured
    const hasTheOddsApi = !!process.env.THE_ODDS_API_KEY;
    const hasSportsDataIo = !!process.env.SPORTSDATA_IO_KEY;
    const hasOddsApiIo = !!process.env.ODDS_API_IO_KEY;
    
    console.log('[Matches API] Available APIs:', { hasTheOddsApi, hasSportsDataIo, hasOddsApiIo });
    
    // Try to fetch from unified sports API (combines all your existing APIs)
    try {
      let apiMatches: UnifiedMatch[] = [];
      
      if (matchId) {
        // Get single match
        const match = await getMatchById(matchId);
        if (match) {
          return NextResponse.json({ 
            match: convertToMatchData(match),
            source: match.source,
          });
        }
      } else if (sportId) {
        apiMatches = await getMatchesBySport(parseInt(sportId));
      } else if (leagueId) {
        apiMatches = await getMatchesByLeague(parseInt(leagueId));
      } else if (status === 'live') {
        apiMatches = await getApiLiveMatches();
      } else if (status === 'upcoming') {
        apiMatches = await getApiUpcomingMatches();
      } else {
        // Get all matches from all APIs
        apiMatches = await getAllMatches();
      }
      
      if (apiMatches.length > 0) {
        matches = apiMatches.map(convertToMatchData);
        // Determine primary source
        const sources = new Set(apiMatches.map(m => m.source));
        apiSource = Array.from(sources).join('+') || 'unified';
        console.log(`[Matches API] Got ${matches.length} matches from: ${apiSource}`);
      }
    } catch (apiError) {
      console.error('[Matches API] Error fetching from APIs:', apiError);
    }
    
    // If no API matches, use fallback with real team names
    if (matches.length === 0) {
      console.log('[Matches API] No API data, using fallback with real teams');
      matches = generateFallbackMatches(countryCode);
      apiSource = 'fallback';
    }
    
    // Apply status filter
    if (status && status !== 'all') {
      if (status === 'live') {
        matches = matches.filter(m => 
          m.status === 'live' || m.status === 'halftime' || 
          m.status === 'extra_time' || m.status === 'penalties'
        );
      } else if (status === 'upcoming') {
        matches = matches.filter(m => m.status === 'scheduled');
      } else if (status === 'finished' || status === 'results') {
        matches = matches.filter(m => m.status === 'finished');
      } else {
        matches = matches.filter(m => m.status === status);
      }
    }
    
    // Sort matches
    matches = sortMatches(matches, countryCode);
    
    // Calculate stats
    const stats = {
      total: matches.length,
      live: matches.filter(m => 
        m.status === 'live' || m.status === 'halftime' || 
        m.status === 'extra_time' || m.status === 'penalties'
      ).length,
      today: matches.filter(m => {
        const matchDate = new Date(m.kickoffTime).toDateString();
        return matchDate === new Date().toDateString();
      }).length,
      upcoming: matches.filter(m => m.status === 'scheduled').length,
      finished: matches.filter(m => m.status === 'finished').length,
    };
    
    return NextResponse.json({ 
      matches,
      stats,
      source: apiSource,
      apis: {
        theOddsApi: hasTheOddsApi,
        sportsDataIo: hasSportsDataIo,
        oddsApiIo: hasOddsApiIo,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Matches API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}
