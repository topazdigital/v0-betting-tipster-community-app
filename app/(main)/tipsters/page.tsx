'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, Trophy, TrendingUp, Flame, Users, Star, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SidebarNew } from '@/components/layout/sidebar-new';
import { cn } from '@/lib/utils';

// Mock tipsters data
const tipsters = [
  {
    id: 1,
    username: 'KingOfTips',
    displayName: 'King of Tips',
    avatar: 'K',
    bio: 'Professional tipster with 5+ years experience. Specializing in Premier League and La Liga.',
    winRate: 68.5,
    roi: 12.4,
    totalTips: 342,
    wonTips: 234,
    streak: 8,
    rank: 1,
    followers: 1523,
    isPro: true,
    subscriptionPrice: 500,
    specialties: ['Football', 'Over/Under'],
    verified: true,
  },
  {
    id: 2,
    username: 'AcePredicts',
    displayName: 'Ace Predicts',
    avatar: 'A',
    bio: 'Data-driven predictions. Over 2.5 goals specialist with consistent returns.',
    winRate: 72.1,
    roi: 15.8,
    totalTips: 215,
    wonTips: 155,
    streak: 12,
    rank: 2,
    followers: 982,
    isPro: true,
    subscriptionPrice: 400,
    specialties: ['Football', 'BTTS'],
    verified: true,
  },
  {
    id: 3,
    username: 'LuckyStriker',
    displayName: 'Lucky Striker',
    avatar: 'L',
    bio: 'African football expert. KPL and CAF specialist with local insights.',
    winRate: 65.3,
    roi: 9.2,
    totalTips: 178,
    wonTips: 116,
    streak: 5,
    rank: 3,
    followers: 654,
    isPro: false,
    subscriptionPrice: null,
    specialties: ['African Football', '1X2'],
    verified: true,
  },
  {
    id: 4,
    username: 'EuroExpert',
    displayName: 'Euro Expert',
    avatar: 'E',
    bio: 'European leagues analyst. Bundesliga and Serie A focus with detailed match analysis.',
    winRate: 61.8,
    roi: 7.5,
    totalTips: 156,
    wonTips: 96,
    streak: 3,
    rank: 4,
    followers: 421,
    isPro: false,
    subscriptionPrice: null,
    specialties: ['Bundesliga', 'Serie A'],
    verified: false,
  },
  {
    id: 5,
    username: 'BasketKing',
    displayName: 'Basket King',
    avatar: 'B',
    bio: 'NBA and EuroLeague specialist. Point spreads and totals expert.',
    winRate: 64.2,
    roi: 11.3,
    totalTips: 289,
    wonTips: 185,
    streak: 6,
    rank: 5,
    followers: 876,
    isPro: true,
    subscriptionPrice: 350,
    specialties: ['Basketball', 'NBA'],
    verified: true,
  },
  {
    id: 6,
    username: 'TennisPro',
    displayName: 'Tennis Pro',
    avatar: 'T',
    bio: 'Former tennis coach turned tipster. ATP and WTA tours covered.',
    winRate: 67.8,
    roi: 14.1,
    totalTips: 198,
    wonTips: 134,
    streak: 4,
    rank: 6,
    followers: 543,
    isPro: true,
    subscriptionPrice: 300,
    specialties: ['Tennis', 'ATP'],
    verified: true,
  },
];

const sortOptions = [
  { value: 'rank', label: 'Rank' },
  { value: 'winRate', label: 'Win Rate' },
  { value: 'roi', label: 'ROI' },
  { value: 'followers', label: 'Followers' },
  { value: 'streak', label: 'Hot Streak' },
];

const filterOptions = [
  { value: 'all', label: 'All Tipsters' },
  { value: 'pro', label: 'Pro Only' },
  { value: 'free', label: 'Free Only' },
  { value: 'verified', label: 'Verified' },
];

export default function TipstersPage() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('rank');
  const [filterBy, setFilterBy] = useState('all');

  const filteredTipsters = tipsters
    .filter(t => {
      if (search) {
        const searchLower = search.toLowerCase();
        return t.username.toLowerCase().includes(searchLower) || 
               t.displayName.toLowerCase().includes(searchLower);
      }
      return true;
    })
    .filter(t => {
      if (filterBy === 'pro') return t.isPro;
      if (filterBy === 'free') return !t.isPro;
      if (filterBy === 'verified') return t.verified;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'winRate': return b.winRate - a.winRate;
        case 'roi': return b.roi - a.roi;
        case 'followers': return b.followers - a.followers;
        case 'streak': return b.streak - a.streak;
        default: return a.rank - b.rank;
      }
    });

  return (
    <div className="flex">
      <SidebarNew />
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Tipsters</h1>
            <p className="text-sm text-muted-foreground">
              Follow expert tipsters and get winning predictions
            </p>
          </div>

          {/* Stats Cards */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <Users className="mx-auto h-5 w-5 text-primary" />
              <div className="mt-2 text-2xl font-bold">{tipsters.length}</div>
              <div className="text-xs text-muted-foreground">Active Tipsters</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <Trophy className="mx-auto h-5 w-5 text-warning" />
              <div className="mt-2 text-2xl font-bold">{tipsters.filter(t => t.isPro).length}</div>
              <div className="text-xs text-muted-foreground">Pro Tipsters</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <TrendingUp className="mx-auto h-5 w-5 text-success" />
              <div className="mt-2 text-2xl font-bold">
                {Math.round(tipsters.reduce((sum, t) => sum + t.winRate, 0) / tipsters.length)}%
              </div>
              <div className="text-xs text-muted-foreground">Avg Win Rate</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <Flame className="mx-auto h-5 w-5 text-live" />
              <div className="mt-2 text-2xl font-bold">
                {tipsters.reduce((sum, t) => sum + t.totalTips, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total Tips</div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tipsters..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-36">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <div className="mb-4 text-sm text-muted-foreground">
            {filteredTipsters.length} tipster{filteredTipsters.length !== 1 ? 's' : ''} found
          </div>

          {/* Tipsters Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTipsters.map((tipster, index) => (
              <Link
                key={tipster.id}
                href={`/tipsters/${tipster.id}`}
                className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-lg"
              >
                {/* Header */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                        {tipster.avatar}
                      </div>
                      {tipster.rank <= 3 && (
                        <div className={cn(
                          'absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                          tipster.rank === 1 && 'bg-yellow-500 text-yellow-950',
                          tipster.rank === 2 && 'bg-gray-300 text-gray-700',
                          tipster.rank === 3 && 'bg-amber-700 text-amber-100'
                        )}>
                          #{tipster.rank}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground group-hover:text-primary">
                          {tipster.displayName}
                        </span>
                        {tipster.verified && (
                          <Check className="h-4 w-4 rounded-full bg-primary p-0.5 text-primary-foreground" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">@{tipster.username}</div>
                    </div>
                  </div>
                  {tipster.isPro && (
                    <Badge variant="default" className="bg-gradient-to-r from-primary to-primary/80">
                      <Star className="mr-1 h-3 w-3" />
                      PRO
                    </Badge>
                  )}
                </div>

                {/* Bio */}
                <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                  {tipster.bio}
                </p>

                {/* Specialties */}
                <div className="mb-4 flex flex-wrap gap-1">
                  {tipster.specialties.map(spec => (
                    <Badge key={spec} variant="secondary" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-success/10 px-2 py-2">
                    <div className="text-lg font-bold text-success">{tipster.winRate}%</div>
                    <div className="text-[10px] text-muted-foreground">Win Rate</div>
                  </div>
                  <div className="rounded-lg bg-primary/10 px-2 py-2">
                    <div className="text-lg font-bold text-primary">+{tipster.roi}%</div>
                    <div className="text-[10px] text-muted-foreground">ROI</div>
                  </div>
                  <div className="rounded-lg bg-warning/10 px-2 py-2">
                    <div className="flex items-center justify-center gap-0.5 text-lg font-bold text-warning">
                      {tipster.streak > 0 && <Flame className="h-4 w-4" />}
                      {tipster.streak}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Streak</div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {tipster.followers.toLocaleString()} followers
                  </div>
                  <div>{tipster.totalTips} tips</div>
                </div>

                {/* CTA */}
                {tipster.isPro && tipster.subscriptionPrice && (
                  <Button className="mt-3 w-full" size="sm">
                    Subscribe KES {tipster.subscriptionPrice}/mo
                  </Button>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
