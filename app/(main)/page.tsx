'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Flame, 
  TrendingUp, 
  Clock, 
  ChevronRight, 
  Trophy,
  Target,
  Users,
  Star,
  ArrowRight,
  Zap,
  Shield
} from 'lucide-react';
import { SidebarNew } from '@/components/layout/sidebar-new';
import { SportsFilter } from '@/components/sports/sports-filter';
import { MatchCardNew } from '@/components/matches/match-card-new';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useMatches, useLiveMatches, useMatchStats } from '@/lib/hooks/use-matches';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { ALL_SPORTS, getSportIcon } from '@/lib/sports-data';

// Mock top tipsters data
const topTipsters = [
  { id: 1, name: 'KingOfTips', winRate: 68.5, streak: 8, avatar: 'K', roi: 12.4, tips: 342 },
  { id: 2, name: 'AcePredicts', winRate: 72.1, streak: 12, avatar: 'A', roi: 15.8, tips: 215 },
  { id: 3, name: 'LuckyStriker', winRate: 65.3, streak: 5, avatar: 'L', roi: 9.2, tips: 178 },
  { id: 4, name: 'EuroExpert', winRate: 61.8, streak: 3, avatar: 'E', roi: 7.5, tips: 156 },
];

export default function HomePage() {
  const [selectedSportId, setSelectedSportId] = useState<number | null>(null);
  
  const { matches, isLoading } = useMatches(
    selectedSportId ? { sportId: selectedSportId } : undefined
  );
  const { matches: liveMatches } = useLiveMatches();
  const stats = useMatchStats();

  // Calculate match counts per sport
  const matchCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    matches.forEach(m => {
      counts[m.sportId] = (counts[m.sportId] || 0) + 1;
    });
    return counts;
  }, [matches]);

  // Get featured/upcoming matches
  const upcomingMatches = useMemo(() => {
    return matches
      .filter(m => m.status === 'scheduled')
      .slice(0, 12);
  }, [matches]);

  // Get today's matches
  const todayMatches = useMemo(() => {
    const today = new Date().toDateString();
    return matches.filter(m => 
      new Date(m.kickoffTime).toDateString() === today
    ).slice(0, 20);
  }, [matches]);

  // Group upcoming by sport for variety display
  const upcomingBySport = useMemo(() => {
    const groups: Record<string, typeof matches> = {};
    upcomingMatches.forEach(m => {
      if (!groups[m.sport.name]) groups[m.sport.name] = [];
      if (groups[m.sport.name].length < 4) {
        groups[m.sport.name].push(m);
      }
    });
    return groups;
  }, [upcomingMatches]);

  return (
    <div className="flex">
      <SidebarNew selectedSportId={selectedSportId} onSelectSport={setSelectedSportId} />
      
      <div className="flex-1 overflow-hidden">
        {/* Hero Section — compact */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-background via-background to-primary/5">
          <div className="mx-auto max-w-6xl px-4 py-4 sm:py-6">
            <div className="grid gap-4 lg:grid-cols-2 lg:gap-8">
              {/* Left: Main content */}
              <div className="flex flex-col justify-center">
                <Badge variant="secondary" className="mb-2 w-fit text-[10px]">
                  <Zap className="mr-1 h-3 w-3" />
                  Trusted by 50,000+ tipsters
                </Badge>
                <h1 className="mb-2 text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                  The Complete Platform for
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"> Sports Betting Tips</span>
                </h1>
                <p className="mb-3 text-pretty text-sm text-muted-foreground">
                  Expert predictions across 35+ sports — track performance and compete worldwide.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" asChild>
                    <Link href="/register">
                      Get Started Free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/matches">
                      Browse Matches
                    </Link>
                  </Button>
                </div>

                {/* Quick Stats */}
                <div className="mt-4 grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{stats.live ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Live Now</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{stats.today ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Today</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">35+</div>
                    <div className="text-xs text-muted-foreground">Sports</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">50K+</div>
                    <div className="text-xs text-muted-foreground">Tipsters</div>
                  </div>
                </div>
              </div>

              {/* Right: Featured live match or card */}
              <div className="hidden lg:flex lg:items-center lg:justify-center">
                <div className="relative w-full max-w-md">
                  {/* Live matches preview */}
                  {liveMatches.length > 0 ? (
                    <div className="rounded-2xl border border-live/30 bg-gradient-to-br from-live/10 to-transparent p-6 shadow-xl shadow-live/10">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75"></span>
                          <span className="relative inline-flex h-3 w-3 rounded-full bg-live"></span>
                        </span>
                        <span className="font-semibold text-live">Live Now</span>
                        <span className="ml-auto text-sm text-muted-foreground">{liveMatches.length} matches</span>
                      </div>
                      <div className="space-y-3">
                        {liveMatches.slice(0, 3).map(match => (
                          <Link 
                            key={match.id} 
                            href={`/matches/${match.id}`}
                            className="block rounded-lg bg-card/50 p-3 transition-colors hover:bg-card"
                          >
                            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                              <span>{match.sport.icon} {match.league.name}</span>
                              <span className="font-mono text-live">{match.minute}&apos;</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{match.homeTeam.name}</span>
                              <span className="font-mono text-lg font-bold text-live">{match.homeScore}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{match.awayTeam.name}</span>
                              <span className="font-mono text-lg font-bold text-live">{match.awayScore}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <Button variant="ghost" className="mt-4 w-full" asChild>
                        <Link href="/matches?status=live">
                          View all live matches
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
                      <div className="mb-2 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Coming Up</span>
                      </div>
                      <div className="space-y-3">
                        {upcomingMatches.slice(0, 3).map(match => (
                          <Link 
                            key={match.id} 
                            href={`/matches/${match.id}`}
                            className="block rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
                          >
                            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                              <span>{match.sport.icon} {match.league.name}</span>
                              <span>
                                {new Date(match.kickoffTime).toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  hour12: false 
                                })}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{match.homeTeam.name}</span>
                              <span className="font-mono text-sm font-semibold text-primary">{match.odds?.home.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{match.awayTeam.name}</span>
                              <span className="font-mono text-sm font-semibold text-primary">{match.odds?.away.toFixed(2)}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sports Filter */}
        <section className="border-b border-border bg-card/50 px-4 py-2">
          <div className="mx-auto max-w-6xl">
            <SportsFilter 
              selectedSportId={selectedSportId}
              onSelectSport={setSelectedSportId}
              matchCounts={matchCounts}
            />
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-4">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Spinner className="h-8 w-8" />
            </div>
          ) : (
            <>
              {/* Live Matches Section */}
              {liveMatches.length > 0 && (
                <section className="mb-5">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-3 w-3">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75"></span>
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-live"></span>
                      </span>
                      <h2 className="text-xl font-bold text-foreground">Live Now</h2>
                      <Badge variant="destructive">{liveMatches.length}</Badge>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/matches?status=live">
                        View all
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex gap-4 pb-4">
                      {liveMatches.map(match => (
                        <div key={match.id} className="w-80 shrink-0">
                          <MatchCardNew match={match} showSport />
                        </div>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </section>
              )}

              {/* Top Tipsters */}
              <section className="mb-5">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-warning" />
                    <h2 className="text-xl font-bold text-foreground">Top Tipsters</h2>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/leaderboard">
                      Leaderboard
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {topTipsters.map((tipster, index) => (
                    <Link 
                      key={tipster.id}
                      href={`/tipsters/${tipster.id}`}
                      className="group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-lg"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <div className="relative">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                            {tipster.avatar}
                          </div>
                          {index < 3 && (
                            <div className={cn(
                              'absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                              index === 0 && 'bg-yellow-500 text-yellow-950',
                              index === 1 && 'bg-gray-300 text-gray-700',
                              index === 2 && 'bg-amber-700 text-amber-100'
                            )}>
                              #{index + 1}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground group-hover:text-primary">
                            {tipster.name}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{tipster.tips} tips</span>
                            {tipster.streak > 0 && (
                              <span className="flex items-center gap-0.5 text-success">
                                <Flame className="h-3 w-3" />
                                {tipster.streak}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="rounded-lg bg-success/10 px-2 py-1.5">
                          <div className="text-lg font-bold text-success">{tipster.winRate}%</div>
                          <div className="text-[10px] text-muted-foreground">Win Rate</div>
                        </div>
                        <div className="rounded-lg bg-primary/10 px-2 py-1.5">
                          <div className="text-lg font-bold text-primary">+{tipster.roi}%</div>
                          <div className="text-[10px] text-muted-foreground">ROI</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Today's Matches by League */}
              <section className="mb-5">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold text-foreground">Today&apos;s Matches</h2>
                    <Badge variant="secondary">{todayMatches.length}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/matches">
                      All matches
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                
                {todayMatches.length > 0 ? (
                  <div className="space-y-3">
                    {todayMatches.slice(0, 10).map(match => (
                      <MatchCardNew key={match.id} match={match} variant="compact" showSport />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-card p-6 text-center">
                    <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No matches today</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Check back later or browse upcoming matches
                    </p>
                    <Button className="mt-4" asChild>
                      <Link href="/matches">Browse Matches</Link>
                    </Button>
                  </div>
                )}
              </section>

              {/* Multi-Sport Section */}
              {Object.keys(upcomingBySport).length > 1 && (
                <section className="mb-5">
                  <div className="mb-2 flex items-center gap-3">
                    <Target className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold text-foreground">Across All Sports</h2>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(upcomingBySport).slice(0, 6).map(([sportName, sportMatches]) => (
                      <div key={sportName} className="rounded-xl border border-border bg-card p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{sportMatches[0]?.sport.icon}</span>
                            <h3 className="font-semibold">{sportName}</h3>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/matches?sport=${sportMatches[0]?.sport.slug}`}>
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {sportMatches.slice(0, 3).map(match => (
                            <Link 
                              key={match.id}
                              href={`/matches/${match.id}`}
                              className="block rounded-lg bg-muted/50 p-2 transition-colors hover:bg-muted"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="truncate font-medium">{match.homeTeam.name}</span>
                                <span className="ml-2 shrink-0 font-mono">{match.odds?.home.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="truncate font-medium">{match.awayTeam.name}</span>
                                <span className="ml-2 shrink-0 font-mono">{match.odds?.away.toFixed(2)}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Features Section */}
              <section className="mb-5">
                <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 p-4">
                  <h2 className="mb-3 text-center text-xl font-bold">Why Choose Betcheza?</h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="text-center">
                      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="mb-1 font-semibold">Expert Predictions</h3>
                      <p className="text-sm text-muted-foreground">AI-powered tips with detailed analysis</p>
                    </div>
                    <div className="text-center">
                      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                        <TrendingUp className="h-5 w-5 text-success" />
                      </div>
                      <h3 className="mb-1 font-semibold">Track Performance</h3>
                      <p className="text-sm text-muted-foreground">Detailed stats and ROI tracking</p>
                    </div>
                    <div className="text-center">
                      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
                        <Users className="h-5 w-5 text-warning" />
                      </div>
                      <h3 className="mb-1 font-semibold">Community</h3>
                      <p className="text-sm text-muted-foreground">Connect with top tipsters worldwide</p>
                    </div>
                    <div className="text-center">
                      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                        <Shield className="h-5 w-5 text-destructive" />
                      </div>
                      <h3 className="mb-1 font-semibold">Verified Results</h3>
                      <p className="text-sm text-muted-foreground">Transparent and audited statistics</p>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
