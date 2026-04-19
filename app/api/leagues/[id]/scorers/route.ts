import { NextRequest, NextResponse } from 'next/server';
import { ALL_LEAGUES, TEAMS_DATABASE } from '@/lib/sports-data';

export const dynamic = 'force-dynamic';
export const revalidate = 600; // Cache for 10 minutes

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Real player names for top scorers
const REAL_PLAYER_NAMES: Record<number, string[]> = {
  // Premier League (id: 1)
  1: [
    "Erling Haaland", "Mohamed Salah", "Cole Palmer", "Alexander Isak",
    "Ollie Watkins", "Darwin Nunez", "Dominic Solanke", "Bryan Mbeumo",
    "Nicolas Jackson", "Bukayo Saka"
  ],
  // La Liga (id: 2)
  2: [
    "Robert Lewandowski", "Kylian Mbappe", "Vinicius Junior", "Antoine Griezmann",
    "Alexander Sorloth", "Ayoze Perez", "Raphinha", "Williams",
    "Sergi Canós", "Alvaro Morata"
  ],
  // Bundesliga (id: 3)
  3: [
    "Harry Kane", "Serhou Guirassy", "Lois Openda", "Tim Kleindienst",
    "Deniz Undav", "Omar Marmoush", "Jonathan Burkardt", "Hugo Ekitike",
    "Florian Wirtz", "Jamal Musiala"
  ],
  // Serie A (id: 4)
  4: [
    "Lautaro Martinez", "Marcus Thuram", "Dusan Vlahovic", "Mateo Retegui",
    "Ademola Lookman", "Moise Kean", "Christian Pulisic", "Rafael Leao",
    "Khvicha Kvaratskhelia", "Victor Osimhen"
  ],
  // Ligue 1 (id: 5)
  5: [
    "Jonathan David", "Bradley Barcola", "Mason Greenwood", "Folarin Balogun",
    "Pierre-Emerick Aubameyang", "Alexandre Lacazette", "Martin Terrier", 
    "Elye Wahi", "Ousmane Dembele", "Randal Kolo Muani"
  ]
};

// Player photos (using placeholder service for now)
function getPlayerPhoto(playerName: string): string {
  // In production, would fetch from API or use stored URLs
  const firstName = playerName.split(' ')[0].toLowerCase();
  const lastName = playerName.split(' ').slice(-1)[0].toLowerCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(playerName)}&background=random&size=100`;
}

// Team assignment based on real data
const PLAYER_TEAMS: Record<string, { team: string; leagueId: number }> = {
  "Erling Haaland": { team: "Manchester City", leagueId: 1 },
  "Mohamed Salah": { team: "Liverpool", leagueId: 1 },
  "Cole Palmer": { team: "Chelsea", leagueId: 1 },
  "Alexander Isak": { team: "Newcastle United", leagueId: 1 },
  "Ollie Watkins": { team: "Aston Villa", leagueId: 1 },
  "Harry Kane": { team: "Bayern Munich", leagueId: 3 },
  "Robert Lewandowski": { team: "Barcelona", leagueId: 2 },
  "Kylian Mbappe": { team: "Real Madrid", leagueId: 2 },
  "Lautaro Martinez": { team: "Inter Milan", leagueId: 4 },
  "Jonathan David": { team: "Lille", leagueId: 5 },
};

// Generate realistic top scorers
function generateTopScorers(leagueId: number, season: string = '2025-26') {
  const league = ALL_LEAGUES.find(l => l.id === leagueId);
  const leagueTeams = TEAMS_DATABASE.filter(t => t.leagueId === leagueId);
  
  // Use real names if available for this league
  const playerNames = REAL_PLAYER_NAMES[leagueId] || Array.from({ length: 10 }, (_, i) => `Player ${i + 1}`);
  
  return playerNames.slice(0, 10).map((name, idx) => {
    // Get team - use real mapping or random from league
    const playerTeamInfo = PLAYER_TEAMS[name];
    let teamName: string;
    
    if (playerTeamInfo && playerTeamInfo.leagueId === leagueId) {
      teamName = playerTeamInfo.team;
    } else if (leagueTeams.length > 0) {
      teamName = leagueTeams[idx % leagueTeams.length].name;
    } else {
      teamName = `${league?.country || 'Team'} FC ${idx + 1}`;
    }
    
    // Goals decrease with position
    const baseGoals = 25 - idx * 2;
    const goals = Math.max(1, baseGoals + Math.floor((Math.random() - 0.5) * 4));
    
    return {
      position: idx + 1,
      player: {
        id: 10000 + leagueId * 100 + idx,
        name,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(-1)[0],
        photo: getPlayerPhoto(name),
        nationality: "International",
        position: idx < 3 ? "Forward" : idx < 7 ? "Midfielder" : "Forward"
      },
      team: {
        name: teamName,
        logo: undefined
      },
      stats: {
        goals,
        assists: Math.floor(goals * 0.4 + Math.random() * 5),
        appearances: 30 + Math.floor(Math.random() * 8),
        minutesPlayed: (28 + Math.floor(Math.random() * 10)) * 90,
        penaltyGoals: Math.floor(goals * 0.15),
        goalsPerMatch: +(goals / (30 + Math.floor(Math.random() * 8))).toFixed(2)
      }
    };
  }).sort((a, b) => b.stats.goals - a.stats.goals);
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const season = searchParams.get('season') || '2025-26';
  
  const leagueId = parseInt(id);
  
  if (isNaN(leagueId)) {
    return NextResponse.json(
      { error: 'Invalid league ID' },
      { status: 400 }
    );
  }
  
  try {
    const scorers = generateTopScorers(leagueId, season);
    const league = ALL_LEAGUES.find(l => l.id === leagueId);
    
    return NextResponse.json({
      leagueId,
      leagueName: league?.name || 'Unknown League',
      country: league?.country || 'Unknown',
      season,
      scorers,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Error fetching scorers:', error);
    
    const scorers = generateTopScorers(leagueId);
    const league = ALL_LEAGUES.find(l => l.id === leagueId);
    
    return NextResponse.json({
      leagueId,
      leagueName: league?.name || 'Unknown League',
      country: league?.country || 'Unknown',
      season: '2025-26',
      scorers,
      timestamp: new Date().toISOString()
    });
  }
}
