import { NextRequest, NextResponse } from 'next/server';
import { 
  getMatchById, 
  type UnifiedMatch,
  type SportSpecificData
} from '@/lib/api/unified-sports-api';
import { ALL_SPORTS, ALL_LEAGUES, TEAMS_DATABASE, getSportIcon, BOOKMAKERS } from '@/lib/sports-data';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Player names by sport
const PLAYER_NAMES = {
  // Soccer
  goalkeepers: ['Alisson', 'Ederson', 'De Gea', 'Courtois', 'ter Stegen', 'Donnarumma', 'Lloris', 'Oblak', 'Neuer', 'Pickford'],
  defenders: ['Van Dijk', 'Dias', 'Kounde', 'Araujo', 'Bastoni', 'Gvardiol', 'Saliba', 'Gabriel', 'Upamecano', 'Kim', 'Romero', 'Todibo', 'Stones', 'Akanji', 'Konaté'],
  midfielders: ['De Bruyne', 'Rodri', 'Bellingham', 'Rice', 'Saka', 'Pedri', 'Gavi', 'Valverde', 'Modric', 'Kroos', 'Mount', 'Fernandes', 'Odegaard', 'Foden', 'Barella'],
  forwards: ['Haaland', 'Mbappe', 'Vinicius Jr', 'Salah', 'Kane', 'Lewandowski', 'Osimhen', 'Nunez', 'Rashford', 'Martinelli', 'Isak', 'Watkins', 'Olise', 'Son', 'Alvarez'],
  // Basketball
  nbaPlayers: ['James', 'Curry', 'Durant', 'Antetokounmpo', 'Doncic', 'Jokic', 'Embiid', 'Tatum', 'Morant', 'Edwards', 'Booker', 'Mitchell', 'Brown', 'Haliburton', 'SGA'],
  // NFL
  nflPlayers: ['Mahomes', 'Allen', 'Burrow', 'Jackson', 'Hurts', 'Herbert', 'Stroud', 'Love', 'Purdy', 'Tagovailoa', 'Kelce', 'Hill', 'Jefferson', 'Chase', 'Diggs'],
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
function generateRealisticH2H(homeTeam: string, awayTeam: string, sportId: number) {
  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  };
  
  const matchupHash = hashCode(homeTeam + awayTeam);
  const total = 8 + (matchupHash % 7);
  const homeWinRate = 0.35 + ((matchupHash % 30) / 100);
  
  const homeWins = Math.round(total * homeWinRate);
  const draws = sportId === 1 ? Math.round(total * 0.2) : 0; // Only soccer has draws
  const awayWins = total - homeWins - draws;
  
  const recentMatches = Array.from({ length: 5 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (i * 3 + 1));
    
    const isHomeGame = i % 2 === 0;
    const homeScore = sportId === 2 ? 90 + Math.floor(Math.random() * 40) : // Basketball
                      sportId === 5 ? 14 + Math.floor(Math.random() * 28) : // American Football
                      sportId === 6 ? Math.floor(Math.random() * 10) : // Baseball
                      Math.floor(Math.random() * 4); // Soccer
    const awayScore = sportId === 2 ? 85 + Math.floor(Math.random() * 40) :
                      sportId === 5 ? 10 + Math.floor(Math.random() * 28) :
                      sportId === 6 ? Math.floor(Math.random() * 8) :
                      Math.floor(Math.random() * 3);
    
    return {
      date: date.toISOString(),
      homeTeam: isHomeGame ? homeTeam : awayTeam,
      awayTeam: isHomeGame ? awayTeam : homeTeam,
      homeScore,
      awayScore,
      competition: ['League', 'Cup', 'League', 'League', 'Playoffs'][i],
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
    avgGoalsPerMatch: sportId === 2 ? 210 : sportId === 5 ? 45 : sportId === 6 ? 8 : 2.4 + Math.random() * 0.6,
  };
}

// Generate sport-specific statistics
function generateSportSpecificStats(
  sportId: number, 
  homeTeam: string, 
  awayTeam: string,
  homeScore: number | null,
  awayScore: number | null,
  status: string
): { stats: Array<{ name: string; home: number; away: number; unit?: string }>; sportSpecificData: SportSpecificData } {
  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
    }
    return Math.abs(hash);
  };
  
  const matchHash = hashCode(homeTeam + awayTeam);
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const isLiveOrFinished = status === 'live' || status === 'finished' || status === 'halftime';
  
  // Different stats for different sports
  switch (sportId) {
    case 1: { // Soccer/Football
      const possessionHome = 45 + (matchHash % 20);
      const possessionAway = 100 - possessionHome;
      
      const stats = [
        { name: 'Ball Possession', home: possessionHome, away: possessionAway, unit: '%' },
        { name: 'Total Shots', home: rand(5, 18), away: rand(4, 16), unit: '' },
        { name: 'Shots on Target', home: rand(2, 8), away: rand(1, 7), unit: '' },
        { name: 'Corner Kicks', home: rand(2, 10), away: rand(2, 9), unit: '' },
        { name: 'Fouls', home: rand(7, 16), away: rand(8, 17), unit: '' },
        { name: 'Offsides', home: rand(0, 5), away: rand(0, 5), unit: '' },
        { name: 'Yellow Cards', home: rand(0, 4), away: rand(0, 4), unit: '' },
        { name: 'Passes', home: 300 + rand(0, 200), away: 280 + rand(0, 180), unit: '' },
        { name: 'Pass Accuracy', home: rand(72, 92), away: rand(70, 90), unit: '%' },
        { name: 'Tackles Won', home: rand(10, 22), away: rand(10, 22), unit: '' },
      ];
      
      const sportSpecificData: SportSpecificData = {
        possession: { home: possessionHome, away: possessionAway },
        shots: { home: rand(8, 18), away: rand(6, 16) },
        shotsOnTarget: { home: rand(3, 8), away: rand(2, 7) },
        corners: { home: rand(3, 10), away: rand(2, 9) },
        fouls: { home: rand(8, 16), away: rand(9, 17) },
        yellowCards: { home: rand(0, 3), away: rand(0, 3) },
        redCards: { home: rand(0, 1), away: rand(0, 1) },
      };
      
      return { stats, sportSpecificData };
    }
    
    case 2: { // Basketball
      const stats = [
        { name: 'Field Goal %', home: rand(42, 55), away: rand(40, 54), unit: '%' },
        { name: '3-Point %', home: rand(30, 45), away: rand(28, 44), unit: '%' },
        { name: 'Free Throw %', home: rand(72, 92), away: rand(70, 90), unit: '%' },
        { name: 'Rebounds', home: rand(38, 52), away: rand(36, 50), unit: '' },
        { name: 'Assists', home: rand(20, 32), away: rand(18, 30), unit: '' },
        { name: 'Steals', home: rand(5, 12), away: rand(4, 11), unit: '' },
        { name: 'Blocks', home: rand(3, 9), away: rand(2, 8), unit: '' },
        { name: 'Turnovers', home: rand(10, 18), away: rand(9, 17), unit: '' },
        { name: 'Points in Paint', home: rand(30, 52), away: rand(28, 50), unit: '' },
        { name: 'Fast Break Points', home: rand(8, 22), away: rand(6, 20), unit: '' },
      ];
      
      const sportSpecificData: SportSpecificData = {
        quarters: isLiveOrFinished 
          ? { home: [rand(22, 32), rand(20, 30), rand(22, 32), rand(20, 30)], away: [rand(20, 30), rand(22, 32), rand(20, 30), rand(22, 32)] }
          : undefined,
        rebounds: { home: rand(40, 52), away: rand(38, 50) },
        assists: { home: rand(22, 32), away: rand(20, 30) },
        steals: { home: rand(6, 12), away: rand(5, 11) },
        blocks: { home: rand(4, 9), away: rand(3, 8) },
        turnovers: { home: rand(11, 18), away: rand(10, 17) },
        fieldGoalPct: { home: rand(44, 54), away: rand(42, 52) },
        threePointPct: { home: rand(32, 44), away: rand(30, 42) },
        freeThrowPct: { home: rand(75, 90), away: rand(72, 88) },
      };
      
      return { stats, sportSpecificData };
    }
    
    case 5: { // American Football
      const stats = [
        { name: 'Total Yards', home: rand(280, 420), away: rand(260, 400), unit: '' },
        { name: 'Passing Yards', home: rand(180, 320), away: rand(160, 300), unit: '' },
        { name: 'Rushing Yards', home: rand(80, 180), away: rand(70, 160), unit: '' },
        { name: 'First Downs', home: rand(16, 26), away: rand(14, 24), unit: '' },
        { name: '3rd Down Conv.', home: rand(35, 60), away: rand(30, 55), unit: '%' },
        { name: 'Red Zone Eff.', home: rand(50, 85), away: rand(45, 80), unit: '%' },
        { name: 'Turnovers', home: rand(0, 3), away: rand(0, 3), unit: '' },
        { name: 'Sacks', home: rand(1, 5), away: rand(1, 5), unit: '' },
        { name: 'Penalties', home: rand(4, 10), away: rand(4, 10), unit: '' },
        { name: 'Time of Possession', home: rand(26, 34), away: rand(26, 34), unit: 'min' },
      ];
      
      const sportSpecificData: SportSpecificData = {
        passingYards: { home: rand(200, 320), away: rand(180, 300) },
        rushingYards: { home: rand(90, 180), away: rand(80, 160) },
        totalYards: { home: rand(300, 420), away: rand(280, 400) },
        firstDowns: { home: rand(18, 26), away: rand(16, 24) },
        thirdDownConv: { home: `${rand(5, 10)}/${rand(12, 16)}`, away: `${rand(4, 9)}/${rand(12, 16)}` },
        timeOfPossession: { home: `${rand(28, 32)}:${rand(10, 59).toString().padStart(2, '0')}`, away: `${rand(28, 32)}:${rand(10, 59).toString().padStart(2, '0')}` },
        sacks: { home: rand(1, 5), away: rand(1, 5) },
        interceptions: { home: rand(0, 2), away: rand(0, 2) },
        fumbles: { home: rand(0, 2), away: rand(0, 2) },
      };
      
      return { stats, sportSpecificData };
    }
    
    case 3: { // Tennis
      const stats = [
        { name: 'Aces', home: rand(3, 15), away: rand(2, 14), unit: '' },
        { name: 'Double Faults', home: rand(1, 6), away: rand(1, 6), unit: '' },
        { name: '1st Serve %', home: rand(58, 75), away: rand(55, 73), unit: '%' },
        { name: '1st Serve Win %', home: rand(65, 85), away: rand(62, 82), unit: '%' },
        { name: '2nd Serve Win %', home: rand(45, 60), away: rand(42, 58), unit: '%' },
        { name: 'Break Points Won', home: rand(30, 70), away: rand(25, 65), unit: '%' },
        { name: 'Winners', home: rand(18, 45), away: rand(15, 42), unit: '' },
        { name: 'Unforced Errors', home: rand(15, 40), away: rand(18, 42), unit: '' },
        { name: 'Net Points Won', home: rand(55, 80), away: rand(50, 75), unit: '%' },
        { name: 'Total Points Won', home: rand(45, 55), away: rand(45, 55), unit: '%' },
      ];
      
      const sportSpecificData: SportSpecificData = {
        sets: isLiveOrFinished 
          ? { home: [rand(4, 7), rand(4, 7), rand(4, 7)], away: [rand(4, 7), rand(4, 7), rand(4, 7)] }
          : undefined,
        aces: { home: rand(5, 15), away: rand(4, 14) },
        doubleFaults: { home: rand(1, 5), away: rand(1, 5) },
        firstServePct: { home: rand(60, 74), away: rand(58, 72) },
        breakPoints: { home: `${rand(2, 5)}/${rand(5, 10)}`, away: `${rand(2, 5)}/${rand(5, 10)}` },
        winners: { home: rand(20, 45), away: rand(18, 42) },
        unforcedErrors: { home: rand(18, 38), away: rand(20, 40) },
      };
      
      return { stats, sportSpecificData };
    }
    
    case 27: { // MMA
      const stats = [
        { name: 'Significant Strikes', home: rand(25, 80), away: rand(20, 75), unit: '' },
        { name: 'Total Strikes', home: rand(40, 120), away: rand(35, 110), unit: '' },
        { name: 'Takedowns', home: rand(0, 6), away: rand(0, 5), unit: '' },
        { name: 'Takedown Accuracy', home: rand(30, 70), away: rand(25, 65), unit: '%' },
        { name: 'Submission Attempts', home: rand(0, 4), away: rand(0, 3), unit: '' },
        { name: 'Ground Control', home: rand(0, 5), away: rand(0, 4), unit: 'min' },
        { name: 'Strikes Landed %', home: rand(40, 65), away: rand(35, 60), unit: '%' },
        { name: 'Leg Kicks', home: rand(5, 25), away: rand(4, 22), unit: '' },
        { name: 'Head Strikes', home: rand(15, 50), away: rand(12, 45), unit: '' },
        { name: 'Clinch Strikes', home: rand(5, 20), away: rand(4, 18), unit: '' },
      ];
      
      const sportSpecificData: SportSpecificData = {
        round: isLiveOrFinished ? rand(1, 5) : undefined,
        totalRounds: 3,
        strikes: { home: rand(50, 120), away: rand(45, 110) },
        takedowns: { home: rand(1, 6), away: rand(0, 5) },
        significantStrikes: { home: rand(30, 80), away: rand(25, 75) },
      };
      
      return { stats, sportSpecificData };
    }
    
    case 7: { // Ice Hockey
      const stats = [
        { name: 'Shots on Goal', home: rand(25, 40), away: rand(22, 38), unit: '' },
        { name: 'Power Play', home: rand(0, 3), away: rand(0, 3), unit: '' },
        { name: 'Penalty Minutes', home: rand(4, 14), away: rand(4, 14), unit: '' },
        { name: 'Faceoff Wins', home: rand(45, 55), away: rand(45, 55), unit: '%' },
        { name: 'Hits', home: rand(18, 35), away: rand(16, 33), unit: '' },
        { name: 'Blocked Shots', home: rand(10, 22), away: rand(9, 20), unit: '' },
        { name: 'Giveaways', home: rand(5, 12), away: rand(5, 12), unit: '' },
        { name: 'Takeaways', home: rand(4, 10), away: rand(4, 10), unit: '' },
        { name: 'Save %', home: rand(88, 96), away: rand(86, 95), unit: '%' },
        { name: 'Shooting %', home: rand(8, 15), away: rand(7, 14), unit: '%' },
      ];
      
      const sportSpecificData: SportSpecificData = {
        shots: { home: rand(28, 40), away: rand(25, 38) },
        powerPlayGoals: { home: rand(0, 2), away: rand(0, 2) },
        penaltyMinutes: { home: rand(4, 12), away: rand(4, 12) },
        faceoffWins: { home: rand(22, 32), away: rand(20, 30) },
        hitsCount: { home: rand(20, 35), away: rand(18, 33) },
        blockedShots: { home: rand(12, 22), away: rand(10, 20) },
      };
      
      return { stats, sportSpecificData };
    }
    
    case 6: { // Baseball
      const stats = [
        { name: 'Hits', home: rand(5, 14), away: rand(4, 13), unit: '' },
        { name: 'Runs', home: homeScore ?? rand(2, 8), away: awayScore ?? rand(1, 7), unit: '' },
        { name: 'Errors', home: rand(0, 3), away: rand(0, 3), unit: '' },
        { name: 'Home Runs', home: rand(0, 4), away: rand(0, 3), unit: '' },
        { name: 'RBI', home: rand(2, 8), away: rand(1, 7), unit: '' },
        { name: 'Walks', home: rand(1, 6), away: rand(1, 6), unit: '' },
        { name: 'Strikeouts', home: rand(5, 14), away: rand(5, 14), unit: '' },
        { name: 'Batting Average', home: rand(220, 320), away: rand(210, 310), unit: '' },
        { name: 'Left on Base', home: rand(4, 10), away: rand(4, 10), unit: '' },
        { name: 'Pitches Thrown', home: rand(100, 150), away: rand(100, 150), unit: '' },
      ];
      
      const sportSpecificData: SportSpecificData = {
        hits: { home: rand(7, 14), away: rand(6, 13) },
        errors: { home: rand(0, 2), away: rand(0, 2) },
        innings: isLiveOrFinished 
          ? { home: [rand(0, 3), rand(0, 2), rand(0, 3), rand(0, 2), rand(0, 3), rand(0, 2), rand(0, 3), rand(0, 2), rand(0, 3)], 
              away: [rand(0, 3), rand(0, 2), rand(0, 3), rand(0, 2), rand(0, 3), rand(0, 2), rand(0, 3), rand(0, 2), rand(0, 3)] }
          : undefined,
        strikeouts: { home: rand(6, 14), away: rand(6, 14) },
        walks: { home: rand(2, 6), away: rand(2, 6) },
        homeRuns: { home: rand(0, 3), away: rand(0, 3) },
      };
      
      return { stats, sportSpecificData };
    }
    
    case 4: { // Cricket
      const stats = [
        { name: 'Runs', home: homeScore ?? rand(150, 220), away: awayScore ?? rand(140, 210), unit: '' },
        { name: 'Wickets', home: rand(3, 10), away: rand(3, 10), unit: '' },
        { name: 'Run Rate', home: rand(6, 10), away: rand(5, 9), unit: '' },
        { name: 'Boundaries', home: rand(15, 30), away: rand(12, 28), unit: '' },
        { name: 'Sixes', home: rand(4, 15), away: rand(3, 12), unit: '' },
        { name: 'Extras', home: rand(5, 15), away: rand(5, 15), unit: '' },
        { name: 'Dot Balls', home: rand(40, 70), away: rand(45, 75), unit: '' },
        { name: 'Overs Bowled', home: rand(15, 20), away: rand(15, 20), unit: '' },
        { name: 'Economy Rate', home: rand(6, 9), away: rand(6, 9), unit: '' },
        { name: 'Partnership', home: rand(40, 100), away: rand(35, 90), unit: '' },
      ];
      
      const sportSpecificData: SportSpecificData = {
        overs: { home: `${rand(16, 20)}.${rand(0, 5)}`, away: `${rand(16, 20)}.${rand(0, 5)}` },
        wickets: { home: rand(4, 10), away: rand(4, 10) },
        runRate: { home: rand(7, 11), away: rand(6, 10) },
        extras: { home: rand(6, 14), away: rand(6, 14) },
      };
      
      return { stats, sportSpecificData };
    }
    
    case 8: { // Rugby
      const stats = [
        { name: 'Tries', home: rand(1, 5), away: rand(1, 5), unit: '' },
        { name: 'Conversions', home: rand(0, 4), away: rand(0, 4), unit: '' },
        { name: 'Penalties', home: rand(0, 4), away: rand(0, 4), unit: '' },
        { name: 'Possession', home: rand(40, 60), away: rand(40, 60), unit: '%' },
        { name: 'Territory', home: rand(40, 60), away: rand(40, 60), unit: '%' },
        { name: 'Tackles Made', home: rand(80, 140), away: rand(80, 140), unit: '' },
        { name: 'Lineouts Won', home: rand(70, 95), away: rand(65, 90), unit: '%' },
        { name: 'Scrums Won', home: rand(80, 100), away: rand(75, 95), unit: '%' },
        { name: 'Turnovers Won', home: rand(5, 15), away: rand(5, 15), unit: '' },
        { name: 'Offloads', home: rand(5, 15), away: rand(4, 14), unit: '' },
      ];
      
      const sportSpecificData: SportSpecificData = {
        possession: { home: rand(42, 58), away: rand(42, 58) },
      };
      
      return { stats, sportSpecificData };
    }
    
    default: {
      // Generic stats for other sports
      const stats = [
        { name: 'Score', home: homeScore ?? 0, away: awayScore ?? 0, unit: '' },
      ];
      
      return { stats, sportSpecificData: {} };
    }
  }
}

// Generate team form
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

// Generate fallback match
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
      draw: sport.id === 1 ? +(2.5 + Math.random() * 1.5).toFixed(2) : undefined,
      away: +(2 + Math.random() * 3).toFixed(2)
    },
    tipsCount: Math.floor(Math.random() * 50),
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  
  try {
    let match: UnifiedMatch | null = null;
    
    if (!id.startsWith('fallback-')) {
      match = await getMatchById(id);
    }
    
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
    const drawOdds = match.odds?.draw;
    const awayOdds = match.odds?.away || 2.5;
    
    const bookmakerOdds = generateBookmakerOdds(homeOdds, drawOdds, awayOdds);
    const h2h = generateRealisticH2H(match.homeTeam.name, match.awayTeam.name, match.sportId);
    
    // Generate sport-specific statistics
    const { stats, sportSpecificData } = generateSportSpecificStats(
      match.sportId,
      match.homeTeam.name,
      match.awayTeam.name,
      match.homeScore,
      match.awayScore,
      match.status
    );
    
    // Generate lineups (only for team sports)
    const teamSports = [1, 5, 7, 8]; // Soccer, American Football, Ice Hockey, Rugby
    const formations = ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1', '3-4-3'];
    const homeFormation = formations[Math.floor(Math.random() * formations.length)];
    const awayFormation = formations[Math.floor(Math.random() * formations.length)];
    
    const lineups = teamSports.includes(match.sportId) ? {
      home: generateLineup(match.homeTeam.name, homeFormation),
      away: generateLineup(match.awayTeam.name, awayFormation),
      confirmed: match.status === 'live' || match.status === 'finished',
    } : null;
    
    const teamForm = {
      home: generateTeamForm(match.homeTeam.name),
      away: generateTeamForm(match.awayTeam.name),
    };
    
    // Build response
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
      period: match.period,
      league: match.league,
      sport: match.sport,
      odds: match.odds,
      markets: match.markets,
      tipsCount: match.tipsCount,
      venue: `${match.league.country} Stadium`,
      source: match.source,
      sportSpecificData: match.sportSpecificData || sportSpecificData,
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
