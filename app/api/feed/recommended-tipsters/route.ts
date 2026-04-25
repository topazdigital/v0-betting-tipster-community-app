import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { listFollowedTipsters } from '@/lib/follows-store';

export const dynamic = 'force-dynamic';

const FEATURED = [
  { id: 1, username: 'KingOfTips',   displayName: 'King of Tips',   winRate: 68.5, roi: 12.4, streak: 8,  followers: 1523, isPro: true,  specialty: 'Premier League' },
  { id: 2, username: 'AcePredicts',  displayName: 'Ace Predicts',   winRate: 72.1, roi: 15.8, streak: 12, followers: 982,  isPro: true,  specialty: 'Over/Under' },
  { id: 3, username: 'LuckyStriker', displayName: 'Lucky Striker',  winRate: 65.3, roi: 9.2,  streak: 5,  followers: 654,  isPro: false, specialty: 'KPL & CAF' },
  { id: 7, username: 'UFCAnalyst',   displayName: 'UFC Analyst',    winRate: 59.4, roi: 18.2, streak: 2,  followers: 398,  isPro: true,  specialty: 'MMA' },
  { id: 6, username: 'TennisPro',    displayName: 'Tennis Pro',     winRate: 67.8, roi: 14.1, streak: 4,  followers: 543,  isPro: true,  specialty: 'ATP / WTA' },
  { id: 5, username: 'BasketKing',   displayName: 'Basket King',    winRate: 64.2, roi: 11.3, streak: 6,  followers: 876,  isPro: true,  specialty: 'NBA' },
];

export async function GET() {
  const user = await getCurrentUser();
  let followed = new Set<number>();
  if (user) {
    try {
      followed = new Set(await listFollowedTipsters(user.userId));
    } catch {}
  }
  const tipsters = FEATURED.map(t => ({ ...t, following: followed.has(t.id) }));
  return NextResponse.json({ tipsters });
}
