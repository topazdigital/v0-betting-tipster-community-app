'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trophy, Medal, TrendingUp, Flame, Calendar, ChevronRight, Crown, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SidebarNew } from '@/components/layout/sidebar-new';
import { cn } from '@/lib/utils';

// Mock leaderboard data
const leaderboardData = {
  daily: [
    { rank: 1, username: 'AcePredicts', displayName: 'Ace Predicts', avatar: 'A', winRate: 85.7, tips: 7, won: 6, roi: 24.5, streak: 6, change: 2 },
    { rank: 2, username: 'KingOfTips', displayName: 'King of Tips', avatar: 'K', winRate: 80.0, tips: 5, won: 4, roi: 18.3, streak: 4, change: -1 },
    { rank: 3, username: 'LuckyStriker', displayName: 'Lucky Striker', avatar: 'L', winRate: 75.0, tips: 8, won: 6, roi: 15.2, streak: 3, change: 1 },
    { rank: 4, username: 'EuroExpert', displayName: 'Euro Expert', avatar: 'E', winRate: 66.7, tips: 6, won: 4, roi: 12.1, streak: 2, change: 0 },
    { rank: 5, username: 'BasketKing', displayName: 'Basket King', avatar: 'B', winRate: 60.0, tips: 5, won: 3, roi: 8.5, streak: 1, change: 3 },
  ],
  weekly: [
    { rank: 1, username: 'KingOfTips', displayName: 'King of Tips', avatar: 'K', winRate: 72.5, tips: 40, won: 29, roi: 16.8, streak: 8, change: 0 },
    { rank: 2, username: 'AcePredicts', displayName: 'Ace Predicts', avatar: 'A', winRate: 70.0, tips: 30, won: 21, roi: 15.2, streak: 12, change: 1 },
    { rank: 3, username: 'TennisPro', displayName: 'Tennis Pro', avatar: 'T', winRate: 68.5, tips: 35, won: 24, roi: 14.1, streak: 4, change: 2 },
    { rank: 4, username: 'LuckyStriker', displayName: 'Lucky Striker', avatar: 'L', winRate: 65.0, tips: 28, won: 18, roi: 11.3, streak: 5, change: -2 },
    { rank: 5, username: 'BasketKing', displayName: 'Basket King', avatar: 'B', winRate: 64.0, tips: 25, won: 16, roi: 10.5, streak: 6, change: 0 },
  ],
  monthly: [
    { rank: 1, username: 'AcePredicts', displayName: 'Ace Predicts', avatar: 'A', winRate: 72.1, tips: 120, won: 86, roi: 15.8, streak: 12, change: 1 },
    { rank: 2, username: 'KingOfTips', displayName: 'King of Tips', avatar: 'K', winRate: 68.5, tips: 150, won: 103, roi: 12.4, streak: 8, change: -1 },
    { rank: 3, username: 'TennisPro', displayName: 'Tennis Pro', avatar: 'T', winRate: 67.8, tips: 90, won: 61, roi: 14.1, streak: 4, change: 0 },
    { rank: 4, username: 'LuckyStriker', displayName: 'Lucky Striker', avatar: 'L', winRate: 65.3, tips: 85, won: 55, roi: 9.2, streak: 5, change: 2 },
    { rank: 5, username: 'BasketKing', displayName: 'Basket King', avatar: 'B', winRate: 64.2, tips: 100, won: 64, roi: 11.3, streak: 6, change: 0 },
  ],
  alltime: [
    { rank: 1, username: 'KingOfTips', displayName: 'King of Tips', avatar: 'K', winRate: 68.5, tips: 342, won: 234, roi: 12.4, streak: 8, change: 0 },
    { rank: 2, username: 'AcePredicts', displayName: 'Ace Predicts', avatar: 'A', winRate: 72.1, tips: 215, won: 155, roi: 15.8, streak: 12, change: 0 },
    { rank: 3, username: 'BasketKing', displayName: 'Basket King', avatar: 'B', winRate: 64.2, tips: 289, won: 185, roi: 11.3, streak: 6, change: 0 },
    { rank: 4, username: 'TennisPro', displayName: 'Tennis Pro', avatar: 'T', winRate: 67.8, tips: 198, won: 134, roi: 14.1, streak: 4, change: 0 },
    { rank: 5, username: 'LuckyStriker', displayName: 'Lucky Striker', avatar: 'L', winRate: 65.3, tips: 178, won: 116, roi: 9.2, streak: 5, change: 0 },
  ],
};

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'alltime'>('weekly');
  const data = leaderboardData[period];

  return (
    <div className="flex">
      <SidebarNew />
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto max-w-5xl px-3 py-2.5">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-1.5 text-lg font-bold text-foreground">
                <Trophy className="h-5 w-5 text-warning" />
                Leaderboard
              </h1>
              <p className="text-xs text-muted-foreground">
                Top performing tipsters ranked by performance
              </p>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
              <Link href="/competitions">
                <Star className="mr-1.5 h-3.5 w-3.5" />
                View Competitions
              </Link>
            </Button>
          </div>

          {/* Top 3 Podium */}
          <div className="mb-4 grid grid-cols-3 gap-2">
            {/* Second Place */}
            <div className="mt-6 flex flex-col items-center">
              <div className="relative mb-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gray-200 to-gray-400 text-xl font-bold text-gray-700 ring-2 ring-gray-300">
                  {data[1]?.avatar}
                </div>
                <div className="absolute -bottom-1.5 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full bg-gray-300 text-[10px] font-bold text-gray-700">
                  2
                </div>
              </div>
              <Link href={`/tipsters/${data[1]?.username}`} className="text-center hover:text-primary">
                <div className="text-xs font-semibold">{data[1]?.displayName}</div>
                <div className="text-[10px] text-success font-bold">{data[1]?.winRate}%</div>
              </Link>
            </div>
            
            {/* First Place */}
            <div className="flex flex-col items-center">
              <Crown className="mb-1 h-5 w-5 text-yellow-500" />
              <div className="relative mb-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 text-2xl font-bold text-yellow-900 ring-2 ring-yellow-300 shadow-lg shadow-yellow-500/20">
                  {data[0]?.avatar}
                </div>
                <div className="absolute -bottom-1.5 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-yellow-900">
                  1
                </div>
              </div>
              <Link href={`/tipsters/${data[0]?.username}`} className="text-center hover:text-primary">
                <div className="text-sm font-bold">{data[0]?.displayName}</div>
                <div className="text-[11px] text-success font-bold">{data[0]?.winRate}%</div>
              </Link>
            </div>
            
            {/* Third Place */}
            <div className="mt-10 flex flex-col items-center">
              <div className="relative mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-lg font-bold text-amber-100 ring-2 ring-amber-600">
                  {data[2]?.avatar}
                </div>
                <div className="absolute -bottom-1.5 left-1/2 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full bg-amber-700 text-[9px] font-bold text-amber-100">
                  3
                </div>
              </div>
              <Link href={`/tipsters/${data[2]?.username}`} className="text-center hover:text-primary">
                <div className="text-xs font-semibold">{data[2]?.displayName}</div>
                <div className="text-[10px] text-success font-bold">{data[2]?.winRate}%</div>
              </Link>
            </div>
          </div>

          {/* Period Tabs */}
          <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)} className="mb-4">
            <TabsList className="grid w-full grid-cols-4 h-8">
              <TabsTrigger value="daily" className="text-xs px-2">
                <Calendar className="mr-1 h-3 w-3" />
                Daily
              </TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs px-2">
                <Calendar className="mr-1 h-3 w-3" />
                Weekly
              </TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs px-2">
                <Calendar className="mr-1 h-3 w-3" />
                Monthly
              </TabsTrigger>
              <TabsTrigger value="alltime" className="text-xs px-2">
                <Trophy className="mr-1 h-3 w-3" />
                All Time
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Full Leaderboard Table */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-3 py-2 text-left text-[11px] font-medium uppercase text-muted-foreground tracking-wider">Rank</th>
                  <th className="px-3 py-2 text-left text-[11px] font-medium uppercase text-muted-foreground tracking-wider">Tipster</th>
                  <th className="px-3 py-2 text-center text-[11px] font-medium uppercase text-muted-foreground tracking-wider">Win Rate</th>
                  <th className="px-3 py-2 text-center text-[11px] font-medium uppercase text-muted-foreground tracking-wider">Tips</th>
                  <th className="px-3 py-2 text-center text-[11px] font-medium uppercase text-muted-foreground tracking-wider">ROI</th>
                  <th className="px-3 py-2 text-center text-[11px] font-medium uppercase text-muted-foreground tracking-wider">Streak</th>
                  <th className="px-3 py-2 text-center text-[11px] font-medium uppercase text-muted-foreground tracking-wider">Change</th>
                </tr>
              </thead>
              <tbody>
                {data.map((entry, index) => (
                  <tr 
                    key={entry.username} 
                    className={cn(
                      'border-b border-border transition-colors hover:bg-muted/30',
                      index < 3 && 'bg-muted/10'
                    )}
                  >
                    <td className="px-3 py-1.5">
                      <div className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold',
                        entry.rank === 1 && 'bg-yellow-500 text-yellow-950',
                        entry.rank === 2 && 'bg-gray-300 text-gray-700',
                        entry.rank === 3 && 'bg-amber-700 text-amber-100',
                        entry.rank > 3 && 'bg-muted text-muted-foreground'
                      )}>
                        {entry.rank}
                      </div>
                    </td>
                    <td className="px-3 py-1.5">
                      <Link href={`/tipsters/${entry.username}`} className="flex items-center gap-2.5 hover:text-primary">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shrink-0">
                          {entry.avatar}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-xs truncate">{entry.displayName}</div>
                          <div className="text-[10px] text-muted-foreground truncate">@{entry.username}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <div className="font-semibold text-xs text-success">{entry.winRate}%</div>
                      <div className="text-[10px] text-muted-foreground">{entry.won}/{entry.tips}</div>
                    </td>
                    <td className="px-3 py-1.5 text-center font-medium text-xs">{entry.tips}</td>
                    <td className="px-3 py-1.5 text-center">
                      <span className="font-semibold text-xs text-primary">+{entry.roi}%</span>
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      {entry.streak > 0 && (
                        <div className="inline-flex items-center gap-0.5 rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-warning">
                          <Flame className="h-2.5 w-2.5" />
                          {entry.streak}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-center text-[10px]">
                      {entry.change > 0 && (
                        <span className="text-success">+{entry.change}</span>
                      )}
                      {entry.change < 0 && (
                        <span className="text-destructive">{entry.change}</span>
                      )}
                      {entry.change === 0 && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Load More */}
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm" className="h-8 text-xs px-4">
              Load More
              <ChevronRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
