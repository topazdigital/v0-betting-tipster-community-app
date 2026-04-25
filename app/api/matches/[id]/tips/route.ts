import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// ─── In-memory store of user-submitted tips, keyed by matchId ───
// Persists for the lifetime of the dev server / serverless instance.
interface SubmittedTip {
  id: string;
  matchId: string;
  prediction: string;
  market: string;
  odds: number;
  stake: number;
  confidence: number;
  analysis: string;
  isPremium: boolean;
  status: string;
  likes: number;
  dislikes: number;
  comments: number;
  createdAt: string;
  tipster: {
    id: string;
    displayName: string;
    totalTips: number;
    wonTips: number;
    winRate: number;
    roi: number;
    streak: number;
    rank: number;
    isPremium: boolean;
    monthlyPrice: number;
    followers: number;
    verified: boolean;
  };
}
const submittedTipsStore: Map<string, SubmittedTip[]> = (globalThis as { __tipsStore?: Map<string, SubmittedTip[]> }).__tipsStore
  || new Map<string, SubmittedTip[]>();
(globalThis as { __tipsStore?: Map<string, SubmittedTip[]> }).__tipsStore = submittedTipsStore;

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function hashCode(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const TIPSTERS = [
  { id: '1', displayName: 'KingOfTips', totalTips: 342, wonTips: 234, roi: 12.4, streak: 8, rank: 1, isPremium: true, monthlyPrice: 9.99, followers: 1523, verified: true },
  { id: '2', displayName: 'AcePredicts', totalTips: 215, wonTips: 155, roi: 15.8, streak: 12, rank: 2, isPremium: true, monthlyPrice: 14.99, followers: 982, verified: true },
  { id: '3', displayName: 'LuckyStriker', totalTips: 178, wonTips: 108, roi: 9.2, streak: 5, rank: 3, isPremium: false, monthlyPrice: 0, followers: 678, verified: false },
  { id: '4', displayName: 'EuroExpert', totalTips: 156, wonTips: 91, roi: 7.5, streak: 3, rank: 4, isPremium: true, monthlyPrice: 7.99, followers: 534, verified: true },
  { id: '5', displayName: 'GoalMachine', totalTips: 421, wonTips: 245, roi: 5.3, streak: -2, rank: 8, isPremium: false, monthlyPrice: 0, followers: 312, verified: false },
  { id: '6', displayName: 'BetWizard', totalTips: 89, wonTips: 62, roi: 18.1, streak: 15, rank: 6, isPremium: true, monthlyPrice: 19.99, followers: 1102, verified: true },
];

const PREDICTIONS = [
  { prediction: 'Home Win', market: 'Match Result (1X2)' },
  { prediction: 'Away Win', market: 'Match Result (1X2)' },
  { prediction: 'Draw', market: 'Match Result (1X2)' },
  { prediction: 'Both Teams to Score', market: 'BTTS' },
  { prediction: 'Over 2.5 Goals', market: 'Over/Under 2.5' },
  { prediction: 'Under 2.5 Goals', market: 'Over/Under 2.5' },
  { prediction: 'Home or Draw (1X)', market: 'Double Chance' },
  { prediction: 'Away or Draw (X2)', market: 'Double Chance' },
];

const ANALYSES = [
  (home: string, away: string) => `${home} has been incredibly consistent at home this season, winning 7 of their last 9 matches. ${away} has struggled defensively away from home, conceding in every away game this month.`,
  (home: string, away: string) => `Statistical models show ${home} has a 67% probability based on recent form. Key injuries in ${away}'s backline could prove decisive here.`,
  (home: string, away: string) => `Both teams have scored in 8 of the last 10 H2H meetings. ${home} averages 2.1 goals at home while ${away} scores 1.4 away.`,
  (home: string, away: string) => `${away} has been exceptional on the road lately with 4 wins from last 5. ${home} have been unconvincing defensively despite home advantage.`,
  (home: string, away: string) => `This fixture historically produces goals — 78% of meetings since 2018 have gone over 2.5. Current form backs this trend continuing.`,
  (home: string, away: string) => `Tactical breakdown: ${home} presses high and creates chances but ${away}'s counter-attack is lethal. Expect an entertaining, open match.`,
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params;
  const { searchParams } = new URL(request.url);
  const homeTeam = searchParams.get('home') || 'Home Team';
  const awayTeam = searchParams.get('away') || 'Away Team';

  const seed = hashCode(matchId);

  const tipCount = 3 + (seed % 4);
  const tips = [];

  const usedTipsterIds = new Set<string>();

  for (let i = 0; i < tipCount; i++) {
    const tipsterIdx = Math.floor(seededRandom(seed + i * 37) * TIPSTERS.length);
    const tipster = TIPSTERS[tipsterIdx];

    if (usedTipsterIds.has(tipster.id)) continue;
    usedTipsterIds.add(tipster.id);

    const predIdx = Math.floor(seededRandom(seed + i * 53) * PREDICTIONS.length);
    const { prediction, market } = PREDICTIONS[predIdx];

    const analysisIdx = Math.floor(seededRandom(seed + i * 71) * ANALYSES.length);
    const analysis = ANALYSES[analysisIdx](homeTeam, awayTeam);

    const baseOdds = 1.4 + seededRandom(seed + i * 17) * 2.8;
    const odds = Math.round(baseOdds * 100) / 100;

    const confidence = 55 + Math.floor(seededRandom(seed + i * 43) * 40);
    const stake = 1 + Math.floor(seededRandom(seed + i * 29) * 5);

    const isPremium = tipster.isPremium && seededRandom(seed + i * 61) > 0.4;

    const hoursAgo = Math.floor(seededRandom(seed + i * 13) * 8);
    const createdAt = new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString();

    const likes = 8 + Math.floor(seededRandom(seed + i * 83) * 60);
    const dislikes = Math.floor(seededRandom(seed + i * 97) * 8);
    const comments = Math.floor(seededRandom(seed + i * 107) * 15);

    tips.push({
      id: `${matchId}-${i + 1}`,
      matchId,
      prediction,
      market,
      odds,
      stake,
      confidence,
      analysis,
      isPremium,
      status: 'pending',
      likes,
      dislikes,
      comments,
      createdAt,
      tipster: {
        ...tipster,
        winRate: Math.round((tipster.wonTips / tipster.totalTips) * 100 * 10) / 10,
      },
    });
  }

  // Merge in any user-submitted tips for this match
  const userTips = submittedTipsStore.get(matchId) || [];

  const merged = [...userTips, ...tips];
  merged.sort((a, b) => b.confidence - a.confidence);

  return NextResponse.json({ tips: merged, total: merged.length });
}

// ─── POST: tipsters submit a new tip on this match ───
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let body: {
    prediction?: string;
    predictionLabel?: string;
    odds?: number;
    stake?: number;
    confidence?: number;
    analysis?: string;
    isPremium?: boolean;
    marketKey?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.predictionLabel || typeof body.odds !== 'number' || typeof body.confidence !== 'number') {
    return NextResponse.json({ error: 'Missing required fields: predictionLabel, odds, confidence' }, { status: 400 });
  }
  if (!body.analysis || body.analysis.length < 20) {
    return NextResponse.json({ error: 'Analysis must be at least 20 characters' }, { status: 400 });
  }

  const newTip: SubmittedTip = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    matchId,
    prediction: body.predictionLabel,
    market: body.marketKey || 'h2h',
    odds: Math.round(body.odds * 100) / 100,
    stake: body.stake || 3,
    confidence: body.confidence,
    analysis: body.analysis,
    isPremium: !!body.isPremium && (user.role === 'admin' || user.role === 'tipster'),
    status: 'pending',
    likes: 0,
    dislikes: 0,
    comments: 0,
    createdAt: new Date().toISOString(),
    tipster: {
      id: String(user.userId),
      displayName: user.email.split('@')[0],
      totalTips: 1,
      wonTips: 0,
      winRate: 0,
      roi: 0,
      streak: 0,
      rank: 999,
      isPremium: user.role === 'admin' || user.role === 'tipster',
      monthlyPrice: 0,
      followers: 0,
      verified: user.role === 'admin',
    },
  };

  const existing = submittedTipsStore.get(matchId) || [];
  existing.unshift(newTip);
  submittedTipsStore.set(matchId, existing);

  return NextResponse.json({ tip: newTip, ok: true });
}
