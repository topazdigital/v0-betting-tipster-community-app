import { NextRequest, NextResponse } from 'next/server';
import { ALL_SPORTS, ALL_LEAGUES, TEAMS_DATABASE, getSportIcon } from '@/lib/sports-data';

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
const EUROPEAN_COMPETITIONS = [9, 10];

// Country to local league mapping for geo-priority
const COUNTRY_LEAGUES: Record<string, number[]> = {
  'KE': [22, 21, 24], // Kenya Premier League first
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

// The-Odds-API sport keys mapping
const ODDS_API_SPORTS: Record<number, string> = {
  1: 'soccer',
  2: 'basketball',
  3: 'tennis',
  5: 'americanfootball',
  6: 'baseball',
  7: 'icehockey',
  27: 'mma',
  26: 'boxing',
};

export interface MatchData {
  id: string;
  sportId: number;
  leagueId: number;
  homeTeam: {
    id: number;
    name: string;
    shortName: string;
    logo?: string;
  };
  awayTeam: {
    id: number;
    name: string;
    shortName: string;
    logo?: string;
  };
  kickoffTime: string;
  status: 'scheduled' | 'live' | 'halftime' | 'finished' | 'postponed';
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
}

export interface MarketOdds {
  key: string;
  name: string;
  outcomes: Array<{
    name: string;
    price: number;
  }>;
}

// Fetch real odds from The Odds API (if API key available)
async function fetchRealOdds(sportKey: string): Promise<any[]> {
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) return [];
  
  try {
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=uk,eu&markets=h2h,spreads,totals&oddsFormat=decimal`,
      { next: { revalidate: 60 } } // Cache for 60 seconds
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching odds:', error);
    return [];
  }
}

// Fetch live scores (using free API)
async function fetchLiveScores(): Promise<any[]> {
  try {
    // Use API-Football free tier or similar
    const apiKey = process.env.FOOTBALL_API_KEY;
    if (!apiKey) return [];
    
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?live=all`,
      {
        headers: { 'x-apisports-key': apiKey },
        next: { revalidate: 30 }
      }
    );
    
    if (!response.ok) return [];
    const data = await response.json();
    return data.response || [];
  } catch (error) {
    return [];
  }
}

// Generate realistic matches with proper sorting
function generateMatches(userCountryCode?: string): MatchData[] {
  const matches: MatchData[] = [];
  const now = new Date();
  
  // Match counts by sport (more for popular sports)
  const matchCounts: Record<number, number> = {
    1: 60,  // Football - most matches
    2: 25,  // Basketball
    3: 20,  // Tennis
    4: 15,  // Cricket
    5: 20,  // American Football
    6: 15,  // Baseball
    7: 15,  // Ice Hockey
    8: 10,  // Rugby
    27: 8,  // MMA
    26: 6,  // Boxing
    29: 5,  // Formula 1
    33: 15, // Esports
  };
  
  // Get league priority for user's country
  const leaguePriority = userCountryCode 
    ? COUNTRY_LEAGUES[userCountryCode.toUpperCase()] || EUROPEAN_TOP_5_LEAGUES
    : EUROPEAN_TOP_5_LEAGUES;
  
  ALL_SPORTS.forEach(sport => {
    const count = matchCounts[sport.id] || 5;
    const sportLeagues = ALL_LEAGUES.filter(l => l.sportId === sport.id);
    
    if (sportLeagues.length === 0) return;
    
    for (let i = 0; i < count; i++) {
      // Prioritize leagues based on user location
      let league: typeof sportLeagues[0];
      if (i < sportLeagues.length && leaguePriority.includes(sportLeagues[i].id)) {
        league = sportLeagues.find(l => leaguePriority.includes(l.id)) || sportLeagues[0];
      } else {
        league = sportLeagues[Math.floor(Math.random() * sportLeagues.length)];
      }
      
      // Get teams
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
      
      // Generate times - spread throughout day, more upcoming than live
      let kickoffTime: Date;
      let status: MatchData['status'];
      
      const rand = Math.random();
      if (rand < 0.12) {
        // Live matches (12%)
        const minutesAgo = Math.floor(Math.random() * 90);
        kickoffTime = new Date(now.getTime() - minutesAgo * 60 * 1000);
        status = minutesAgo > 45 && minutesAgo < 60 ? 'halftime' : 'live';
      } else if (rand < 0.22) {
        // Finished matches (10%)
        kickoffTime = new Date(now.getTime() - (Math.floor(Math.random() * 12) + 2) * 60 * 60 * 1000);
        status = 'finished';
      } else {
        // Upcoming matches (78%) - sorted by time
        const hoursFromNow = (i / count) * 48; // Spread over 48 hours
        kickoffTime = new Date(now.getTime() + hoursFromNow * 60 * 60 * 1000);
        status = 'scheduled';
      }
      
      // Generate scores for live/finished
      let homeScore: number | null = null;
      let awayScore: number | null = null;
      
      if (status === 'live' || status === 'halftime' || status === 'finished') {
        const maxGoals = sport.slug === 'basketball' ? 120 : sport.slug === 'american-football' ? 35 : 5;
        homeScore = Math.floor(Math.random() * maxGoals);
        awayScore = Math.floor(Math.random() * maxGoals);
      }
      
      // Generate odds
      const homeOdds = 1.5 + Math.random() * 2.5;
      const awayOdds = 1.5 + Math.random() * 3;
      const drawOdds = 2.8 + Math.random() * 1.5;
      
      // Generate all markets
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
        {
          key: 'double_chance',
          name: 'Double Chance',
          outcomes: [
            { name: 'Home/Draw', price: Math.round((1.3 + Math.random() * 0.3) * 100) / 100 },
            { name: 'Away/Draw', price: Math.round((1.4 + Math.random() * 0.3) * 100) / 100 },
            { name: 'Home/Away', price: Math.round((1.2 + Math.random() * 0.2) * 100) / 100 },
          ]
        },
        {
          key: 'correct_score',
          name: 'Correct Score',
          outcomes: [
            { name: '1-0', price: Math.round((6 + Math.random() * 3) * 100) / 100 },
            { name: '2-1', price: Math.round((8 + Math.random() * 4) * 100) / 100 },
            { name: '2-0', price: Math.round((7 + Math.random() * 3) * 100) / 100 },
            { name: '0-0', price: Math.round((9 + Math.random() * 4) * 100) / 100 },
            { name: '1-1', price: Math.round((6 + Math.random() * 2) * 100) / 100 },
          ]
        },
      ];
      
      matches.push({
        id: `${sport.slug}-${league.slug}-${i}-${Date.now()}`,
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
      });
    }
  });
  
  // Sort matches: Sport priority > League priority > Status > Time
  return matches.sort((a, b) => {
    // 1. Sport priority (Football first)
    const sportPriorityA = SPORT_PRIORITY[a.sportId] ?? 99;
    const sportPriorityB = SPORT_PRIORITY[b.sportId] ?? 99;
    if (sportPriorityA !== sportPriorityB) return sportPriorityA - sportPriorityB;
    
    // 2. League priority (local leagues first)
    const leaguePriorityA = leaguePriority.indexOf(a.leagueId);
    const leaguePriorityB = leaguePriority.indexOf(b.leagueId);
    const leagueOrderA = leaguePriorityA === -1 ? 999 : leaguePriorityA;
    const leagueOrderB = leaguePriorityB === -1 ? 999 : leaguePriorityB;
    if (leagueOrderA !== leagueOrderB) return leagueOrderA - leagueOrderB;
    
    // 3. Live matches first
    const statusOrder = { live: 0, halftime: 1, scheduled: 2, finished: 3, postponed: 4 };
    const statusOrderA = statusOrder[a.status] ?? 5;
    const statusOrderB = statusOrder[b.status] ?? 5;
    if (statusOrderA !== statusOrderB) return statusOrderA - statusOrderB;
    
    // 4. Sort by kickoff time (soonest first)
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
    // Generate matches with user's country priority
    let matches = generateMatches(countryCode);
    
    // Try to fetch real odds data for main sports
    if (!sportId || sportId === '1') {
      try {
        const realOdds = await fetchRealOdds('soccer_epl');
        // Merge real odds with generated matches if available
        if (realOdds.length > 0) {
          // Map real odds to our format
          realOdds.slice(0, 10).forEach((game: any, idx: number) => {
            if (matches[idx] && game.bookmakers?.[0]?.markets?.[0]?.outcomes) {
              const h2h = game.bookmakers[0].markets.find((m: any) => m.key === 'h2h');
              if (h2h) {
                matches[idx].odds = {
                  home: h2h.outcomes.find((o: any) => o.name === game.home_team)?.price || matches[idx].odds?.home || 2.0,
                  draw: h2h.outcomes.find((o: any) => o.name === 'Draw')?.price || matches[idx].odds?.draw || 3.5,
                  away: h2h.outcomes.find((o: any) => o.name === game.away_team)?.price || matches[idx].odds?.away || 3.0,
                };
              }
            }
          });
        }
      } catch (e) {
        // Continue with generated data
      }
    }
    
    // Filter by specific match ID
    if (matchId) {
      const match = matches.find(m => m.id === matchId);
      return NextResponse.json({ match });
    }
    
    // Apply filters
    if (sportId) {
      matches = matches.filter(m => m.sportId === parseInt(sportId));
    }
    
    if (leagueId) {
      matches = matches.filter(m => m.leagueId === parseInt(leagueId));
    }
    
    if (status && status !== 'all') {
      if (status === 'live') {
        matches = matches.filter(m => m.status === 'live' || m.status === 'halftime');
      } else {
        matches = matches.filter(m => m.status === status);
      }
    }
    
    // Calculate stats
    const stats = {
      total: matches.length,
      live: matches.filter(m => m.status === 'live' || m.status === 'halftime').length,
      today: matches.filter(m => {
        const matchDate = new Date(m.kickoffTime).toDateString();
        return matchDate === new Date().toDateString();
      }).length,
      upcoming: matches.filter(m => m.status === 'scheduled').length,
    };
    
    return NextResponse.json({ 
      matches,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in matches API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}
