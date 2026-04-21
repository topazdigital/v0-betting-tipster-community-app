import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Mock tipsters data - in production this would come from the database
const TIPSTERS = [
  {
    id: 1,
    username: 'KingOfTips',
    displayName: 'King of Tips',
    avatar: null,
    bio: 'Professional tipster with 5+ years experience. Specializing in Premier League and La Liga.',
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
    specialties: ['Football', 'Over/Under', 'Premier League'],
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
  {
    id: 2,
    username: 'AcePredicts',
    displayName: 'Ace Predicts',
    avatar: null,
    bio: 'Data-driven predictions. Over 2.5 goals specialist with consistent returns.',
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
    specialties: ['Football', 'BTTS', 'Over/Under'],
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
  {
    id: 3,
    username: 'LuckyStriker',
    displayName: 'Lucky Striker',
    avatar: null,
    bio: 'African football expert. KPL and CAF specialist with local insights.',
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
    specialties: ['African Football', '1X2', 'CAF'],
    verified: true,
    country: 'Kenya',
    countryCode: 'KE',
    joinedAt: '2023-01-10T00:00:00Z',
    lastActive: new Date().toISOString(),
    socials: {
      telegram: 'luckystriker_tips'
    }
  },
  {
    id: 4,
    username: 'EuroExpert',
    displayName: 'Euro Expert',
    avatar: null,
    bio: 'European leagues analyst. Bundesliga and Serie A focus with detailed match analysis.',
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
  {
    id: 5,
    username: 'BasketKing',
    displayName: 'Basket King',
    avatar: null,
    bio: 'NBA and EuroLeague specialist. Point spreads and totals expert.',
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
    specialties: ['Basketball', 'NBA', 'Point Spreads'],
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
  {
    id: 6,
    username: 'TennisPro',
    displayName: 'Tennis Pro',
    avatar: null,
    bio: 'Former tennis coach turned tipster. ATP and WTA tours covered.',
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
    specialties: ['Tennis', 'ATP', 'WTA'],
    verified: true,
    country: 'Spain',
    countryCode: 'ES',
    joinedAt: '2023-02-15T00:00:00Z',
    lastActive: new Date().toISOString(),
    socials: {
      instagram: 'tennispro_tips'
    }
  },
  {
    id: 7,
    username: 'UFCAnalyst',
    displayName: 'UFC Analyst',
    avatar: null,
    bio: 'MMA expert covering UFC, Bellator and ONE Championship. Method of victory specialist.',
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
    specialties: ['MMA', 'UFC', 'Method of Victory'],
    verified: true,
    country: 'USA',
    countryCode: 'US',
    joinedAt: '2023-05-20T00:00:00Z',
    lastActive: new Date().toISOString(),
    socials: {
      twitter: 'ufcanalyst'
    }
  },
  {
    id: 8,
    username: 'CricketGuru',
    displayName: 'Cricket Guru',
    avatar: null,
    bio: 'IPL and international cricket specialist. Toss, top batsman and match winner predictions.',
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
    specialties: ['Cricket', 'IPL', 'T20'],
    verified: true,
    country: 'India',
    countryCode: 'IN',
    joinedAt: '2023-03-01T00:00:00Z',
    lastActive: new Date().toISOString(),
    socials: {
      telegram: 'cricketguru_official'
    }
  }
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const filter = searchParams.get('filter');
  const sortBy = searchParams.get('sortBy') || 'rank';
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  
  let tipsters = [...TIPSTERS];
  
  // Search filter
  if (search) {
    const searchLower = search.toLowerCase();
    tipsters = tipsters.filter(t => 
      t.username.toLowerCase().includes(searchLower) ||
      t.displayName.toLowerCase().includes(searchLower) ||
      t.specialties.some(s => s.toLowerCase().includes(searchLower))
    );
  }
  
  // Type filter
  if (filter === 'pro') {
    tipsters = tipsters.filter(t => t.isPro);
  } else if (filter === 'free') {
    tipsters = tipsters.filter(t => !t.isPro);
  } else if (filter === 'verified') {
    tipsters = tipsters.filter(t => t.verified);
  }
  
  // Sorting
  switch (sortBy) {
    case 'winRate':
      tipsters.sort((a, b) => b.winRate - a.winRate);
      break;
    case 'roi':
      tipsters.sort((a, b) => b.roi - a.roi);
      break;
    case 'followers':
      tipsters.sort((a, b) => b.followers - a.followers);
      break;
    case 'streak':
      tipsters.sort((a, b) => b.streak - a.streak);
      break;
    case 'totalTips':
      tipsters.sort((a, b) => b.totalTips - a.totalTips);
      break;
    default:
      tipsters.sort((a, b) => a.rank - b.rank);
  }
  
  // Pagination
  const total = tipsters.length;
  tipsters = tipsters.slice(offset, offset + limit);
  
  return NextResponse.json({
    tipsters,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    },
    stats: {
      totalTipsters: TIPSTERS.length,
      proTipsters: TIPSTERS.filter(t => t.isPro).length,
      avgWinRate: Math.round(TIPSTERS.reduce((sum, t) => sum + t.winRate, 0) / TIPSTERS.length * 10) / 10,
      totalTips: TIPSTERS.reduce((sum, t) => sum + t.totalTips, 0)
    }
  });
}
