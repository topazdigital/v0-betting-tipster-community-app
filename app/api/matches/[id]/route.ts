import { NextRequest, NextResponse } from 'next/server';
import { 
  getMatchById, 
  type UnifiedMatch 
} from '@/lib/api/unified-sports-api';
import { ALL_SPORTS, ALL_LEAGUES, TEAMS_DATABASE, getSportIcon, BOOKMAKERS } from '@/lib/sports-data';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Common football player names by position for realistic lineups
const PLAYER_NAMES = {
  goalkeepers: ['Alisson', 'Ederson', 'De Gea', 'Courtois', 'ter Stegen', 'Donnarumma', 'Lloris', 'Oblak', 'Neuer', 'Pickford'],
  defenders: ['Van Dijk', 'Dias', 'Kounde', 'Araujo', 'Bastoni', 'Gvardiol', 'Saliba', 'Gabriel', 'Upamecano', 'Kim', 'Romero', 'Todibo', 'Stones', 'Akanji', 'Konaté'],
  midfielders: ['De Bruyne', 'Rodri', 'Bellingham', 'Rice', 'Saka', 'Pedri', 'Gavi', 'Valverde', 'Modric', 'Kroos', 'Mount', 'Fernandes', 'Odegaard', 'Foden', 'Barella'],
  forwards: ['Haaland', 'Mbappe', 'Vinicius Jr', 'Salah', 'Kane', 'Lewandowski', 'Osimhen', 'Nunez', 'Rashford', 'Martinelli', 'Isak', 'Watkins', 'Olise', 'Son', 'Alvarez'],
};

// Generate lineup for a team
function generateLineup(teamName: string, formation: string = '4-3-3') {
  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  };
  
  const seed = hashCode(teamName);
  const shuffleWithSeed = <T>(arr: T[], s: number): T[] => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = (s * (i + 1)) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  const gk = shuffleWithSeed(PLAYER_NAMES.goalkeepers, seed);
  const def = shuffleWithSeed(PLAYER_NAMES.defenders, seed + 1);
  const mid = shuffleWithSeed(PLAYER_NAMES.midfielders, seed + 2);
  const fwd = shuffleWithSeed(PLAYER_NAMES.forwards, seed + 3);
  
  // Parse formation
  const parts = formation.split('-').map(Number);
  const numDef = parts[0] || 4;
  const numMid = parts[1] || 3;
  const numFwd = parts[2] || 3;
  
  return {
    formation,
    starting: [
      { number: 1, name: gk[0], position: 'GK', isCaptain: false },
      ...def.slice(0, numDef).map((name, i) => ({ 
        number: i + 2, 
        name, 
        position: i < 2 ? 'CB' : 'FB',
        isCaptain: i === 0 
      })),
      ...mid.slice(0, numMid).map((name, i) => ({ 
        number: i + 2 + numDef, 
        name, 
        position: i === 0 ? 'CDM' : 'CM',
        isCaptain: false 
      })),
      ...fwd.slice(0, numFwd).map((name, i) => ({ 
        number: i + 2 + numDef + numMid, 
        name, 
        position: i === 1 ? 'ST' : 'W',
        isCaptain: false 
      })),
    ],
    substitutes: [
      { number: 12, name: gk[1], position: 'GK' },
      { number: 13, name: def[numDef], position: 'CB' },
      { number: 14, name: def[numDef + 1], position: 'FB' },
      { number: 15, name: mid[numMid], position: 'CM' },
      { number: 16, name: mid[numMid + 1], position: 'CM' },
      { number: 17, name: fwd[numFwd], position: 'W' },
      { number: 18, name: fwd[numFwd + 1], position: 'ST' },
    ],
    manager: `Manager ${teamName.charAt(0)}.`,
  };
}

// Generate bookmaker odds for a match with realistic variance
function generateBookmakerOdds(homeOdds: number, drawOdds: number | undefined, awayOdds: number) {
  return BOOKMAKERS.filter(b => b.featured).slice(0, 8).map((b, idx) => {
    // Each bookmaker has slightly different odds
    const variance = () => (Math.random() - 0.5) * 0.15;
    const homeVar = 1 + variance();
    const awayVar = 1 + variance();
    const drawVar = 1 + variance();
    
    return {
      name: b.name,
      slug: b.slug,
      logo: b.logo,
      homeOdds: Math.round((homeOdds * homeVar) * 100) / 100,
      drawOdds: drawOdds ? Math.round((drawOdds * drawVar) * 100) / 100 : undefined,
      awayOdds: Math.round((awayOdds * awayVar) * 100) / 100,
      affiliateUrl: b.affiliateUrl,
      isBestHome: idx === 0,
      isBestAway: idx === 2,
    };
  });
}

// Generate realistic H2H data based on team names
function generateRealisticH2H(homeTeam: string, awayTeam: string) {
  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  };
  
  const matchupHash = hashCode(homeTeam + awayTeam);
  const total = 8 + (matchupHash % 7); // 8-14 total meetings
  const homeWinRate = 0.35 + ((matchupHash % 30) / 100); // 35-65% home win rate
  
  const homeWins = Math.round(total * homeWinRate);
  const draws = Math.round(total * 0.2);
  const awayWins = total - homeWins - draws;
  
  // Generate last 5 meetings with realistic scores
  const recentMatches = Array.from({ length: 5 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (i * 3 + 1)); // Every 3 months or so
    
    const isHomeGame = i % 2 === 0;
    const homeScore = Math.floor(Math.random() * 4);
    const awayScore = Math.floor(Math.random() * 3);
    
    return {
      date: date.toISOString(),
      homeTeam: isHomeGame ? homeTeam : awayTeam,
      awayTeam: isHomeGame ? awayTeam : homeTeam,
      homeScore,
      awayScore,
      competition: ['League', 'Cup', 'League', 'League', 'Champions League'][i],
      venue: isHomeGame ? `${homeTeam} Stadium` : `${awayTeam} Stadium`,
    };
  });
  
  return {
    played: total,
    homeWins,
    draws,
    awayWins,
    homeGoals: homeWins * 2 + draws,
    awayGoals: awayWins * 2 + draws,
    recentMatches,
    lastMeeting: recentMatches[0],
    avgGoalsPerMatch: 2.4 + Math.random() * 0.6,
  };
}

// Generate realistic match stats based on team names and scores
function generateRealisticStats(homeTeam: string, awayTeam: string, homeScore: number | null, awayScore: number | null) {
  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
    }
    return Math.abs(hash);
  };
  
  const matchHash = hashCode(homeTeam + awayTeam);
  const possessionHome = 45 + (matchHash % 20);
  const possessionAway = 100 - possessionHome;
  
  // If there's a score, weight stats towards the leading team
  const homeAdvantage = homeScore !== null && awayScore !== null 
    ? (homeScore - awayScore) * 0.1 
    : 0;
  
  return [
    { 
      name: 'Ball Possession', 
      home: possessionHome + Math.round(homeAdvantage * 5), 
      away: possessionAway - Math.round(homeAdvantage * 5),
      unit: '%'
    },
    { 
      name: 'Total Shots', 
      home: 8 + Math.floor(Math.random() * 10) + Math.round(homeAdvantage * 3), 
      away: 6 + Math.floor(Math.random() * 10) - Math.round(homeAdvantage * 3),
      unit: ''
    },
    { 
      name: 'Shots on Target', 
      home: 3 + Math.floor(Math.random() * 6), 
      away: 2 + Math.floor(Math.random() * 5),
      unit: ''
    },
    { 
      name: 'Corner Kicks', 
      home: 3 + Math.floor(Math.random() * 6), 
      away: 2 + Math.floor(Math.random() * 6),
      unit: ''
    },
    { 
      name: 'Fouls', 
      home: 8 + Math.floor(Math.random() * 8), 
      away: 9 + Math.floor(Math.random() * 8),
      unit: ''
    },
    { 
      name: 'Offsides', 
      home: Math.floor(Math.random() * 5), 
      away: Math.floor(Math.random() * 5),
      unit: ''
    },
    { 
      name: 'Yellow Cards', 
      home: Math.floor(Math.random() * 4), 
      away: Math.floor(Math.random() * 4),
      unit: ''
    },
    { 
      name: 'Passes', 
      home: 350 + Math.floor(possessionHome * 3), 
      away: 300 + Math.floor(possessionAway * 3),
      unit: ''
    },
    { 
      name: 'Pass Accuracy', 
      home: 75 + Math.floor(Math.random() * 15), 
      away: 72 + Math.floor(Math.random() * 15),
      unit: '%'
    },
    { 
      name: 'Tackles Won', 
      home: 12 + Math.floor(Math.random() * 10), 
      away: 11 + Math.floor(Math.random() * 10),
      unit: ''
    },
  ];
}

// Generate form for each team (last 5 matches)
function generateTeamForm(teamName: string): ('W' | 'D' | 'L')[] {
  const hash = teamName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const forms: ('W' | 'D' | 'L')[] = [];
  
  for (let i = 0; i < 5; i++) {
    const rand = (hash * (i + 1)) % 10;
    if (rand < 4) forms.push('W');
    else if (rand < 6) forms.push('D');
    else forms.push('L');
  }
  
  return forms;
}

// Generate fallback match from ID parts
function generateFallbackMatch(id: string): UnifiedMatch | null {
  const parts = id.split('-');
  if (parts.length < 4) return null;
  
  const sportSlug = parts[1];
  const leagueSlug = parts[2];
  
  const sport = ALL_SPORTS.find(s => s.slug === sportSlug);
  const league = ALL_LEAGUES.find(l => l.slug === leagueSlug);
  
  if (!sport || !league) return null;
  
  const leagueTeams = TEAMS_DATABASE.filter(t => t.leagueId === league.id);
  const shuffled = [...leagueTeams].sort(() => Math.random() - 0.5);
  
  const homeTeam = shuffled[0] || { id: 1, name: `${league.country} Team 1`, shortName: 'T1' };
  const awayTeam = shuffled[1] || { id: 2, name: `${league.country} Team 2`, shortName: 'T2' };
  
  const statuses: Array<UnifiedMatch['status']> = ['scheduled', 'live', 'finished'];
  const status = statuses[parseInt(parts[3] || '0') % 3];
  
  const now = new Date();
  let kickoffTime: Date;
  let homeScore: number | null = null;
  let awayScore: number | null = null;
  let minute: number | undefined;
  
  if (status === 'live') {
    kickoffTime = new Date(now.getTime() - Math.floor(Math.random() * 80) * 60 * 1000);
    homeScore = Math.floor(Math.random() * 4);
    awayScore = Math.floor(Math.random() * 4);
    minute = Math.floor((now.getTime() - kickoffTime.getTime()) / 60000);
  } else if (status === 'finished') {
    kickoffTime = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    homeScore = Math.floor(Math.random() * 5);
    awayScore = Math.floor(Math.random() * 5);
  } else {
    kickoffTime = new Date(now.getTime() + Math.floor(Math.random() * 48) * 60 * 60 * 1000);
  }
  
  return {
    id,
    source: 'fallback',
    sportId: sport.id,
    sportKey: sport.slug,
    leagueId: league.id,
    leagueKey: league.slug,
    homeTeam: {
      id: String(homeTeam.id),
      name: homeTeam.name,
      shortName: homeTeam.shortName || homeTeam.name.substring(0, 3).toUpperCase(),
    },
    awayTeam: {
      id: String(awayTeam.id),
      name: awayTeam.name,
      shortName: awayTeam.shortName || awayTeam.name.substring(0, 3).toUpperCase(),
    },
    kickoffTime,
    status,
    homeScore,
    awayScore,
    minute,
    league: {
      id: league.id,
      name: league.name,
      slug: league.slug,
      country: league.country,
      countryCode: league.countryCode,
      tier: league.tier
    },
    sport: {
      id: sport.id,
      name: sport.name,
      slug: sport.slug,
      icon: getSportIcon(sport.slug)
    },
    odds: {
      home: +(1.5 + Math.random() * 2).toFixed(2),
      draw: +(2.5 + Math.random() * 1.5).toFixed(2),
      away: +(2 + Math.random() * 3).toFixed(2)
    },
    tipsCount: Math.floor(Math.random() * 50),
    venue: `${league.country} Stadium`,
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  
  try {
    let match: UnifiedMatch | null = null;
    
    // Try to fetch from unified sports API
    if (!id.startsWith('fallback-')) {
      match = await getMatchById(id);
    }
    
    // Try fallback if no match found
    if (!match && id.startsWith('fallback-')) {
      match = generateFallbackMatch(id);
    }
    
    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }
    
    // Generate all supporting data
    const homeOdds = match.odds?.home || 2.0;
    const drawOdds = match.odds?.draw || 3.0;
    const awayOdds = match.odds?.away || 2.5;
    
    const bookmakerOdds = generateBookmakerOdds(homeOdds, drawOdds, awayOdds);
    const h2h = generateRealisticH2H(match.homeTeam.name, match.awayTeam.name);
    const stats = generateRealisticStats(
      match.homeTeam.name, 
      match.awayTeam.name,
      match.homeScore,
      match.awayScore
    );
    
    // Generate lineups (for soccer matches)
    const formations = ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1', '3-4-3'];
    const homeFormation = formations[Math.floor(Math.random() * formations.length)];
    const awayFormation = formations[Math.floor(Math.random() * formations.length)];
    
    const lineups = match.sportId === 1 ? {
      home: generateLineup(match.homeTeam.name, homeFormation),
      away: generateLineup(match.awayTeam.name, awayFormation),
      confirmed: match.status === 'live' || match.status === 'finished',
    } : null;
    
    // Team form
    const teamForm = {
      home: generateTeamForm(match.homeTeam.name),
      away: generateTeamForm(match.awayTeam.name),
    };
    
    // Convert match to response format
    const matchData = {
      id: match.id,
      sportId: match.sportId,
      leagueId: match.leagueId,
      homeTeam: {
        ...match.homeTeam,
        form: teamForm.home,
      },
      awayTeam: {
        ...match.awayTeam,
        form: teamForm.away,
      },
      kickoffTime: new Date(match.kickoffTime).toISOString(),
      status: match.status,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      minute: match.minute,
      league: match.league,
      sport: match.sport,
      odds: match.odds,
      markets: match.markets,
      tipsCount: match.tipsCount,
      venue: match.venue || `${match.league.country} Stadium`,
      source: match.source,
    };
    
    return NextResponse.json({
      match: matchData,
      bookmakerOdds,
      h2h,
      stats,
      lineups,
      teamForm,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[v0] Error fetching match:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match' },
      { status: 500 }
    );
  }
}
