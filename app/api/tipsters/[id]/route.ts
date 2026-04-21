import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Mock tipsters data
const TIPSTERS: Record<string, {
  id: number;
  username: string;
  displayName: string;
  avatar: string | null;
  bio: string;
  winRate: number;
  roi: number;
  totalTips: number;
  wonTips: number;
  lostTips: number;
  pendingTips: number;
  avgOdds: number;
  streak: number;
  rank: number;
  followers: number;
  following: number;
  isPro: boolean;
  subscriptionPrice: number | null;
  currency: string;
  specialties: string[];
  verified: boolean;
  country: string;
  countryCode: string;
  joinedAt: string;
  lastActive: string;
  socials: Record<string, string>;
}> = {
  '1': {
    id: 1,
    username: 'KingOfTips',
    displayName: 'King of Tips',
    avatar: null,
    bio: 'Professional tipster with 5+ years experience. Specializing in Premier League and La Liga. I focus on value bets with odds between 1.70-2.20. My approach combines statistical analysis with match insights.',
    winRate: 68.5,
    roi: 12.4,
    totalTips: 342,
    wonTips: 234,
    lostTips: 96,
    pendingTips: 12,
    avgOdds: 1.92,
    streak: 8,
    rank: 1,
    followers: 1523,
    following: 45,
    isPro: true,
    subscriptionPrice: 500,
    currency: 'KES',
    specialties: ['Football', 'Over/Under', 'Premier League', 'La Liga'],
    verified: true,
    country: 'Kenya',
    countryCode: 'KE',
    joinedAt: '2022-03-15T00:00:00Z',
    lastActive: new Date().toISOString(),
    socials: {
      twitter: 'kingoftips',
      telegram: 'kingoftips_channel'
    }
  },
  '2': {
    id: 2,
    username: 'AcePredicts',
    displayName: 'Ace Predicts',
    avatar: null,
    bio: 'Data-driven predictions using advanced analytics. Over 2.5 goals specialist with consistent returns. I analyze expected goals, shot patterns and defensive weaknesses.',
    winRate: 72.1,
    roi: 15.8,
    totalTips: 215,
    wonTips: 155,
    lostTips: 54,
    pendingTips: 6,
    avgOdds: 1.85,
    streak: 12,
    rank: 2,
    followers: 982,
    following: 23,
    isPro: true,
    subscriptionPrice: 400,
    currency: 'KES',
    specialties: ['Football', 'BTTS', 'Over/Under', 'Goals Markets'],
    verified: true,
    country: 'Nigeria',
    countryCode: 'NG',
    joinedAt: '2022-06-20T00:00:00Z',
    lastActive: new Date().toISOString(),
    socials: {
      twitter: 'acepredicts',
      instagram: 'ace_predicts'
    }
  },
  '3': {
    id: 3,
    username: 'LuckyStriker',
    displayName: 'Lucky Striker',
    avatar: null,
    bio: 'African football expert. KPL and CAF specialist with local insights that international bookmakers often miss. Been following African football for 10+ years.',
    winRate: 65.3,
    roi: 9.2,
    totalTips: 178,
    wonTips: 116,
    lostTips: 58,
    pendingTips: 4,
    avgOdds: 1.78,
    streak: 5,
    rank: 3,
    followers: 654,
    following: 89,
    isPro: false,
    subscriptionPrice: null,
    currency: 'KES',
    specialties: ['African Football', '1X2', 'CAF Champions League', 'Kenya Premier League'],
    verified: true,
    country: 'Kenya',
    countryCode: 'KE',
    joinedAt: '2023-01-10T00:00:00Z',
    lastActive: new Date().toISOString(),
    socials: {
      telegram: 'luckystriker_tips'
    }
  },
  '4': {
    id: 4,
    username: 'EuroExpert',
    displayName: 'Euro Expert',
    avatar: null,
    bio: 'European leagues analyst. Bundesliga and Serie A focus with detailed match analysis. I track team news, injuries and tactical patterns.',
    winRate: 61.8,
    roi: 7.5,
    totalTips: 156,
    wonTips: 96,
    lostTips: 56,
    pendingTips: 4,
    avgOdds: 1.95,
    streak: 3,
    rank: 4,
    followers: 421,
    following: 34,
    isPro: false,
    subscriptionPrice: null,
    currency: 'KES',
    specialties: ['Bundesliga', 'Serie A', 'European Football'],
    verified: false,
    country: 'Germany',
    countryCode: 'DE',
    joinedAt: '2023-04-05T00:00:00Z',
    lastActive: new Date().toISOString(),
    socials: {}
  },
  '5': {
    id: 5,
    username: 'BasketKing',
    displayName: 'Basket King',
    avatar: null,
    bio: 'NBA and EuroLeague specialist. Point spreads and totals expert. I focus on player props and game totals based on pace and defensive efficiency.',
    winRate: 64.2,
    roi: 11.3,
    totalTips: 289,
    wonTips: 185,
    lostTips: 98,
    pendingTips: 6,
    avgOdds: 1.88,
    streak: 6,
    rank: 5,
    followers: 876,
    following: 56,
    isPro: true,
    subscriptionPrice: 350,
    currency: 'KES',
    specialties: ['Basketball', 'NBA', 'Point Spreads', 'EuroLeague'],
    verified: true,
    country: 'USA',
    countryCode: 'US',
    joinedAt: '2022-11-01T00:00:00Z',
    lastActive: new Date().toISOString(),
    socials: {
      twitter: 'basketking_tips',
      discord: 'BasketKing#1234'
    }
  },
  '6': {
    id: 6,
    username: 'TennisPro',
    displayName: 'Tennis Pro',
    avatar: null,
    bio: 'Former tennis coach turned tipster. ATP and WTA tours covered. I analyze serve percentages, surface preferences and head-to-head records.',
    winRate: 67.8,
    roi: 14.1,
    totalTips: 198,
    wonTips: 134,
    lostTips: 58,
    pendingTips: 6,
    avgOdds: 1.75,
    streak: 4,
    rank: 6,
    followers: 543,
    following: 28,
    isPro: true,
    subscriptionPrice: 300,
    currency: 'KES',
    specialties: ['Tennis', 'ATP', 'WTA', 'Grand Slams'],
    verified: true,
    country: 'Spain',
    countryCode: 'ES',
    joinedAt: '2023-02-15T00:00:00Z',
    lastActive: new Date().toISOString(),
    socials: {
      instagram: 'tennispro_tips'
    }
  },
  '7': {
    id: 7,
    username: 'UFCAnalyst',
    displayName: 'UFC Analyst',
    avatar: null,
    bio: 'MMA expert covering UFC, Bellator and ONE Championship. Method of victory specialist. I study fighting styles, reach advantages and ground game stats.',
    winRate: 59.4,
    roi: 18.2,
    totalTips: 124,
    wonTips: 73,
    lostTips: 50,
    pendingTips: 1,
    avgOdds: 2.35,
    streak: 2,
    rank: 7,
    followers: 398,
    following: 67,
    isPro: true,
    subscriptionPrice: 250,
    currency: 'KES',
    specialties: ['MMA', 'UFC', 'Method of Victory', 'Bellator'],
    verified: true,
    country: 'USA',
    countryCode: 'US',
    joinedAt: '2023-05-20T00:00:00Z',
    lastActive: new Date().toISOString(),
    socials: {
      twitter: 'ufcanalyst'
    }
  },
  '8': {
    id: 8,
    username: 'CricketGuru',
    displayName: 'Cricket Guru',
    avatar: null,
    bio: 'IPL and international cricket specialist. Toss, top batsman and match winner predictions. Deep knowledge of pitch conditions and player form.',
    winRate: 63.5,
    roi: 10.8,
    totalTips: 167,
    wonTips: 106,
    lostTips: 57,
    pendingTips: 4,
    avgOdds: 1.82,
    streak: 7,
    rank: 8,
    followers: 712,
    following: 45,
    isPro: false,
    subscriptionPrice: null,
    currency: 'KES',
    specialties: ['Cricket', 'IPL', 'T20', 'International Cricket'],
    verified: true,
    country: 'India',
    countryCode: 'IN',
    joinedAt: '2023-03-01T00:00:00Z',
    lastActive: new Date().toISOString(),
    socials: {
      telegram: 'cricketguru_official'
    }
  }
};

// Generate recent tips for a tipster
function generateRecentTips(tipsterId: number, count: number = 20) {
  const outcomes = ['won', 'lost', 'pending'] as const;
  const markets = ['1X2', 'Over/Under', 'BTTS', 'Asian Handicap', 'Double Chance', 'Correct Score'];
  const teams = [
    ['Arsenal', 'Chelsea'], ['Real Madrid', 'Barcelona'], ['Bayern Munich', 'Dortmund'],
    ['PSG', 'Lyon'], ['Inter Milan', 'AC Milan'], ['Man City', 'Liverpool'],
    ['LA Lakers', 'Golden State'], ['Boston Celtics', 'Miami Heat'],
    ['Nadal', 'Djokovic'], ['Alcaraz', 'Sinner'],
    ['Chiefs', 'Eagles'], ['Cowboys', '49ers']
  ];
  
  return Array.from({ length: count }, (_, i) => {
    const teamPair = teams[Math.floor(Math.random() * teams.length)];
    const odds = +(1.5 + Math.random() * 1.5).toFixed(2);
    const status = i < 3 ? 'pending' : outcomes[Math.floor(Math.random() * 2)];
    const daysAgo = i < 3 ? 0 : Math.floor(i / 2);
    
    return {
      id: tipsterId * 1000 + i,
      match: {
        id: `match_${tipsterId}_${i}`,
        homeTeam: teamPair[0],
        awayTeam: teamPair[1],
        kickoffTime: new Date(Date.now() + (i < 3 ? 1 : -1) * daysAgo * 24 * 60 * 60 * 1000).toISOString(),
        league: ['Premier League', 'La Liga', 'Bundesliga', 'NBA', 'ATP Tour'][Math.floor(Math.random() * 5)],
        sport: ['Football', 'Basketball', 'Tennis'][Math.floor(Math.random() * 3)],
        homeScore: status !== 'pending' ? Math.floor(Math.random() * 4) : null,
        awayScore: status !== 'pending' ? Math.floor(Math.random() * 3) : null,
      },
      market: markets[Math.floor(Math.random() * markets.length)],
      selection: [`${teamPair[0]} Win`, `${teamPair[1]} Win`, 'Over 2.5', 'BTTS Yes', 'Draw'][Math.floor(Math.random() * 5)],
      odds,
      stake: Math.floor(Math.random() * 5) + 1,
      analysis: [
        `Strong home form - ${teamPair[0]} unbeaten in last 5 at home.`,
        `H2H favors this selection with 7 wins in last 10 meetings.`,
        `Both teams averaging 2.8 goals per game this season.`,
        `Key players fit and ready for this crucial match.`,
        `Value spot with bookmakers underestimating team quality.`
      ][Math.floor(Math.random() * 5)],
      status,
      confidence: Math.floor(Math.random() * 25) + 65,
      likes: Math.floor(Math.random() * 50),
      createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    };
  });
}

// Generate monthly performance stats
function generateMonthlyStats(tipster: typeof TIPSTERS[string]) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  return months.slice(0, currentMonth + 1).map((month, i) => ({
    month,
    tips: Math.floor(tipster.totalTips / 12 + Math.random() * 10),
    won: Math.floor((tipster.totalTips / 12) * (tipster.winRate / 100) + Math.random() * 5),
    lost: Math.floor((tipster.totalTips / 12) * ((100 - tipster.winRate) / 100) + Math.random() * 3),
    profit: +(tipster.roi / 12 * (1 + (Math.random() - 0.5) * 0.5)).toFixed(1),
    winRate: +(tipster.winRate + (Math.random() - 0.5) * 10).toFixed(1),
  }));
}

// Generate sport breakdown
function generateSportBreakdown(specialties: string[]) {
  const sportMapping: Record<string, string> = {
    'Football': 'football',
    'Premier League': 'football',
    'La Liga': 'football',
    'Bundesliga': 'football',
    'Serie A': 'football',
    'African Football': 'football',
    'CAF': 'football',
    'Basketball': 'basketball',
    'NBA': 'basketball',
    'EuroLeague': 'basketball',
    'Tennis': 'tennis',
    'ATP': 'tennis',
    'WTA': 'tennis',
    'MMA': 'mma',
    'UFC': 'mma',
    'Cricket': 'cricket',
    'IPL': 'cricket',
    'T20': 'cricket',
  };
  
  const sports = new Set<string>();
  specialties.forEach(s => {
    const sport = sportMapping[s] || 'other';
    sports.add(sport);
  });
  
  const breakdown: { sport: string; percentage: number; tips: number }[] = [];
  const sportsArr = Array.from(sports);
  let remaining = 100;
  
  sportsArr.forEach((sport, i) => {
    const isLast = i === sportsArr.length - 1;
    const percentage = isLast ? remaining : Math.floor(remaining / (sportsArr.length - i) + Math.random() * 20);
    remaining -= percentage;
    breakdown.push({
      sport: sport.charAt(0).toUpperCase() + sport.slice(1),
      percentage,
      tips: Math.floor(percentage * 3.5),
    });
  });
  
  return breakdown.sort((a, b) => b.percentage - a.percentage);
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  
  const tipster = TIPSTERS[id];
  
  if (!tipster) {
    return NextResponse.json(
      { error: 'Tipster not found' },
      { status: 404 }
    );
  }
  
  const { searchParams } = new URL(request.url);
  const includeTips = searchParams.get('includeTips') !== 'false';
  const includeStats = searchParams.get('includeStats') !== 'false';
  
  const response: {
    tipster: typeof tipster;
    recentTips?: ReturnType<typeof generateRecentTips>;
    monthlyStats?: ReturnType<typeof generateMonthlyStats>;
    sportBreakdown?: ReturnType<typeof generateSportBreakdown>;
  } = {
    tipster
  };
  
  if (includeTips) {
    response.recentTips = generateRecentTips(tipster.id);
  }
  
  if (includeStats) {
    response.monthlyStats = generateMonthlyStats(tipster);
    response.sportBreakdown = generateSportBreakdown(tipster.specialties);
  }
  
  return NextResponse.json(response);
}
