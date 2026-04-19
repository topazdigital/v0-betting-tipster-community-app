import { NextRequest, NextResponse } from 'next/server';
import { getMatchById } from '@/lib/api/unified-sports-api';
import { ALL_SPORTS, ALL_LEAGUES, TEAMS_DATABASE, getSportIcon, BOOKMAKERS } from '@/lib/sports-data';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Generate bookmaker odds for a match
function generateBookmakerOdds(homeOdds: number, drawOdds: number, awayOdds: number) {
  return BOOKMAKERS.filter(b => b.featured).slice(0, 6).map(b => ({
    name: b.name,
    slug: b.slug,
    homeOdds: +(homeOdds + (Math.random() - 0.5) * 0.3).toFixed(2),
    drawOdds: +(drawOdds + (Math.random() - 0.5) * 0.3).toFixed(2),
    awayOdds: +(awayOdds + (Math.random() - 0.5) * 0.3).toFixed(2),
    affiliateUrl: b.affiliateUrl
  }));
}

// Generate H2H data
function generateH2H(homeTeam: string, awayTeam: string) {
  const homeWins = Math.floor(Math.random() * 5) + 2;
  const draws = Math.floor(Math.random() * 3);
  const awayWins = Math.floor(Math.random() * 5) + 1;
  
  return {
    played: homeWins + draws + awayWins,
    homeWins,
    draws,
    awayWins,
    recentMatches: Array.from({ length: 5 }, (_, i) => {
      const homeScore = Math.floor(Math.random() * 4);
      const awayScore = Math.floor(Math.random() * 4);
      const date = new Date();
      date.setMonth(date.getMonth() - (i + 1));
      
      return {
        date: date.toISOString(),
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
        competition: "League Match"
      };
    })
  };
}

// Generate match stats
function generateStats() {
  return [
    { name: "Possession", home: 45 + Math.floor(Math.random() * 20), away: 0 },
    { name: "Shots", home: Math.floor(Math.random() * 15) + 5, away: Math.floor(Math.random() * 15) + 3 },
    { name: "Shots on Target", home: Math.floor(Math.random() * 8) + 2, away: Math.floor(Math.random() * 8) + 1 },
    { name: "Corners", home: Math.floor(Math.random() * 8) + 2, away: Math.floor(Math.random() * 8) + 1 },
    { name: "Fouls", home: Math.floor(Math.random() * 15) + 5, away: Math.floor(Math.random() * 15) + 5 },
  ].map(s => ({
    ...s,
    away: s.name === "Possession" ? 100 - s.home : s.away
  }));
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  
  try {
    // Try to fetch from the unified API first
    let match = await getMatchById(id);
    
    // If no match found from API, try to parse from the fallback ID format
    if (!match && id.startsWith('fallback-')) {
      // Parse fallback ID: fallback-{sport}-{league}-{index}-{timestamp}
      const parts = id.split('-');
      const sportSlug = parts[1];
      const leagueSlug = parts[2];
      
      const sport = ALL_SPORTS.find(s => s.slug === sportSlug);
      const league = ALL_LEAGUES.find(l => l.slug === leagueSlug);
      
      if (sport && league) {
        const leagueTeams = TEAMS_DATABASE.filter(t => t.leagueId === league.id);
        const shuffled = [...leagueTeams].sort(() => Math.random() - 0.5);
        
        const homeTeam = shuffled[0] || { id: 1, name: `${league.country} Team 1`, shortName: 'T1' };
        const awayTeam = shuffled[1] || { id: 2, name: `${league.country} Team 2`, shortName: 'T2' };
        
        const statuses = ['scheduled', 'live', 'finished'] as const;
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
        
        match = {
          id,
          sportId: sport.id,
          leagueId: league.id,
          homeTeam: {
            id: homeTeam.id,
            name: homeTeam.name,
            shortName: homeTeam.shortName || homeTeam.name.substring(0, 3).toUpperCase(),
            logo: undefined
          },
          awayTeam: {
            id: awayTeam.id,
            name: awayTeam.name,
            shortName: awayTeam.shortName || awayTeam.name.substring(0, 3).toUpperCase(),
            logo: undefined
          },
          kickoffTime: kickoffTime.toISOString(),
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
          source: 'fallback'
        };
      }
    }
    
    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }
    
    // Generate additional data
    const homeOdds = match.odds?.home || 2.0;
    const drawOdds = match.odds?.draw || 3.0;
    const awayOdds = match.odds?.away || 2.5;
    
    const bookmakerOdds = generateBookmakerOdds(homeOdds, drawOdds, awayOdds);
    const h2h = generateH2H(match.homeTeam.name, match.awayTeam.name);
    const stats = generateStats();
    
    return NextResponse.json({
      match,
      bookmakerOdds,
      h2h,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching match:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match' },
      { status: 500 }
    );
  }
}
