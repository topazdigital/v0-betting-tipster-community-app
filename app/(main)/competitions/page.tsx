'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Trophy, 
  Calendar, 
  Users, 
  Clock, 
  Star, 
  Zap, 
  Gift,
  ChevronRight,
  Timer,
  Target,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarNew } from '@/components/layout/sidebar-new';
import { cn } from '@/lib/utils';
import { ALL_LEAGUES, TEAMS_DATABASE, getSportIcon, BOOKMAKERS } from '@/lib/sports-data';

// Sport priority for sorting
const SPORT_PRIORITY: Record<number, number> = {
  1: 0,   // Football first
  2: 1,   // Basketball
  3: 2,   // Tennis
  4: 3,   // Cricket
  5: 4,   // American Football
  7: 5,   // Ice Hockey
};

// Mock tipster competitions data
const tipsterCompetitions = [
  {
    id: 1,
    name: 'Weekly Tipster Challenge',
    description: 'Compete with other tipsters for the highest win rate this week!',
    type: 'weekly',
    status: 'active',
    startDate: new Date(),
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    prizePool: 50000,
    entryFee: 100,
    maxParticipants: 500,
    currentParticipants: 342,
    yourRank: 15,
    prizes: [
      { place: '1st', amount: 20000 },
      { place: '2nd', amount: 12000 },
      { place: '3rd', amount: 8000 },
      { place: '4-10th', amount: 1428 },
    ],
  },
  {
    id: 2,
    name: 'Monthly Masters League',
    description: 'The ultimate monthly competition for serious tipsters.',
    type: 'monthly',
    status: 'active',
    startDate: new Date(),
    endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    prizePool: 200000,
    entryFee: 500,
    maxParticipants: 200,
    currentParticipants: 156,
    yourRank: null,
    prizes: [
      { place: '1st', amount: 80000 },
      { place: '2nd', amount: 50000 },
      { place: '3rd', amount: 30000 },
      { place: '4-10th', amount: 5714 },
    ],
  },
];

// Generate outright markets for major leagues
function generateOutrightMarkets() {
  // Football leagues first, then other sports
  const footballLeagues = ALL_LEAGUES.filter(l => l.sportId === 1 && l.tier === 1).slice(0, 8);
  const otherLeagues = ALL_LEAGUES.filter(l => l.sportId !== 1 && l.tier === 1).slice(0, 6);
  
  const leagues = [...footballLeagues, ...otherLeagues].sort((a, b) => {
    const priorityA = SPORT_PRIORITY[a.sportId] ?? 99;
    const priorityB = SPORT_PRIORITY[b.sportId] ?? 99;
    return priorityA - priorityB;
  });
  
  return leagues.map(league => {
    const teams = TEAMS_DATABASE.filter(t => t.leagueId === league.id);
    const topTeams = teams.length >= 3 ? teams.slice(0, 5) : Array.from({ length: 5 }, (_, i) => ({
      id: 8000 + i + league.id * 100,
      name: `Team ${i + 1}`,
      shortName: `T${i + 1}`,
      sportId: league.sportId,
      leagueId: league.id,
      country: league.country
    }));
    
    return {
      league,
      sportIcon: getSportIcon(league.sportId === 1 ? 'football' : 
        league.sportId === 2 ? 'basketball' : 
        league.sportId === 3 ? 'tennis' : 
        league.sportId === 5 ? 'american-football' : 'football'),
      favourite: {
        team: topTeams[0],
        odds: +(1.5 + Math.random() * 2).toFixed(2)
      },
      contenders: topTeams.slice(0, 5).map((team, idx) => ({
        team,
        odds: +(1.5 + (idx * 3) + Math.random() * 3).toFixed(2)
      }))
    };
  });
}

// Country flag helper
function getCountryFlag(countryCode: string): string {
  const codeMap: Record<string, string> = {
    'GB-ENG': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
    'GB-SCT': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}',
    'EU': '\u{1F1EA}\u{1F1FA}',
    'WO': '\u{1F30D}',
    'AF': '\u{1F30D}',
  };
  
  const mapped = codeMap[countryCode];
  if (mapped) return mapped;
  
  try {
    const codePoints = countryCode.substring(0, 2)
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return '\u{1F3C6}';
  }
}

export default function CompetitionsPage() {
  const [activeTab, setActiveTab] = useState('outrights');
  
  const outrightMarkets = useMemo(() => generateOutrightMarkets(), []);
  const activeComps = tipsterCompetitions.filter(c => c.status === 'active');

  const formatTimeLeft = (endDate: Date) => {
    const diff = endDate.getTime() - Date.now();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return 'Ending soon';
  };

  return (
    <div className="flex">
      <SidebarNew />
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 py-3">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Trophy className="h-7 w-7 text-warning" />
                Competitions
              </h1>
              <p className="text-sm text-muted-foreground">
                Outright winners, tipster challenges, and more
              </p>
            </div>
            <Button asChild>
              <Link href="/leaderboard">
                <Star className="mr-2 h-4 w-4" />
                Leaderboard
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-gradient-to-br from-warning/10 to-transparent p-4 text-center">
              <Target className="mx-auto h-6 w-6 text-warning" />
              <div className="mt-2 text-2xl font-bold text-warning">
                {outrightMarkets.length}
              </div>
              <div className="text-xs text-muted-foreground">Outright Markets</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <Zap className="mx-auto h-6 w-6 text-primary" />
              <div className="mt-2 text-2xl font-bold">{activeComps.length}</div>
              <div className="text-xs text-muted-foreground">Active Contests</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <Users className="mx-auto h-6 w-6 text-success" />
              <div className="mt-2 text-2xl font-bold">
                {tipsterCompetitions.reduce((sum, c) => sum + c.currentParticipants, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Participants</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <Gift className="mx-auto h-6 w-6 text-live" />
              <div className="mt-2 text-2xl font-bold">
                KES {tipsterCompetitions.reduce((sum, c) => sum + c.prizePool, 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Prize Pool</div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="outrights" className="gap-2">
                <Target className="h-4 w-4" />
                Outright Winners
              </TabsTrigger>
              <TabsTrigger value="contests" className="gap-2">
                <Trophy className="h-4 w-4" />
                Tipster Contests ({activeComps.length})
              </TabsTrigger>
            </TabsList>

            {/* Outright Winners Tab */}
            <TabsContent value="outrights" className="mt-6">
              <div className="mb-4 text-sm text-muted-foreground">
                Bet on who will win each competition. Football leagues shown first.
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                {outrightMarkets.map(market => (
                  <Card key={market.league.id} className="overflow-hidden transition-all hover:shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{market.sportIcon}</span>
                          <span className="text-sm">{getCountryFlag(market.league.countryCode)}</span>
                          <span>{market.league.name}</span>
                        </div>
                        <Link href={`/leagues/${market.league.slug}`}>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3">
                      {/* Favourite */}
                      <div className="mb-3 flex items-center justify-between rounded-lg bg-warning/10 p-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-warning text-warning-foreground">
                            <Star className="mr-1 h-3 w-3" />
                            Favourite
                          </Badge>
                          <span className="font-semibold">{market.favourite.team.name}</span>
                        </div>
                        <span className="font-mono text-lg font-bold text-success">
                          {market.favourite.odds.toFixed(2)}
                        </span>
                      </div>
                      
                      {/* Other Contenders */}
                      <div className="space-y-2">
                        {market.contenders.slice(1, 4).map((contender, idx) => (
                          <div 
                            key={contender.team.id}
                            className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold",
                                idx === 0 && "bg-gray-300 text-gray-700",
                                idx === 1 && "bg-amber-700 text-amber-100",
                                idx > 1 && "bg-muted"
                              )}>
                                {idx + 2}
                              </span>
                              <span className="text-sm">{contender.team.name}</span>
                            </div>
                            <span className="font-mono font-semibold text-primary">
                              {contender.odds.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <Button variant="outline" className="mt-3 w-full" asChild>
                        <Link href={`/leagues/${market.league.slug}`}>
                          View All Odds & Standings
                          <TrendingUp className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Tipster Contests Tab */}
            <TabsContent value="contests" className="mt-6">
              <div className="grid gap-3">
                {activeComps.map(comp => (
                  <CompetitionCard 
                    key={comp.id} 
                    competition={comp} 
                    formatTimeLeft={formatTimeLeft} 
                  />
                ))}
              </div>
              
              {activeComps.length === 0 && (
                <div className="rounded-xl border border-dashed border-border p-12 text-center">
                  <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No active contests</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Check back soon for new tipster competitions
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function CompetitionCard({ 
  competition, 
  formatTimeLeft 
}: { 
  competition: typeof tipsterCompetitions[0]; 
  formatTimeLeft: (date: Date) => string;
}) {
  const participationPercent = (competition.currentParticipants / competition.maxParticipants) * 100;

  return (
    <div className={cn(
      'rounded-xl border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg',
      competition.yourRank && 'border-primary/30 bg-gradient-to-br from-primary/5 to-transparent'
    )}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="destructive" className="bg-live">
              <Timer className="mr-1 h-3 w-3" />
              {formatTimeLeft(competition.endDate)}
            </Badge>
            <Badge variant="outline">{competition.type}</Badge>
            {competition.yourRank && (
              <Badge variant="default">
                <Trophy className="mr-1 h-3 w-3" />
                You&apos;re #{competition.yourRank}
              </Badge>
            )}
          </div>
          <h3 className="text-xl font-bold">{competition.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{competition.description}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-warning">
            KES {competition.prizePool.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Prize Pool</div>
        </div>
      </div>

      {/* Participation */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {competition.currentParticipants} / {competition.maxParticipants} participants
          </span>
          <span className="font-medium">{Math.round(participationPercent)}% full</span>
        </div>
        <Progress value={participationPercent} className="h-2" />
      </div>

      {/* Prizes */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {competition.prizes.map((prize, idx) => (
          <div 
            key={idx}
            className={cn(
              'rounded-lg p-2 text-center',
              idx === 0 && 'bg-yellow-500/10',
              idx === 1 && 'bg-gray-300/10',
              idx === 2 && 'bg-amber-700/10',
              idx > 2 && 'bg-muted'
            )}
          >
            <div className={cn(
              'text-xs font-medium',
              idx === 0 && 'text-yellow-600',
              idx === 1 && 'text-gray-500',
              idx === 2 && 'text-amber-700',
              idx > 2 && 'text-muted-foreground'
            )}>
              {prize.place}
            </div>
            <div className="font-bold">KES {prize.amount.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <div className="text-sm text-muted-foreground">
          Entry fee: <span className="font-semibold text-foreground">KES {competition.entryFee}</span>
        </div>
        {competition.yourRank ? (
          <Button variant="outline">
            View Details
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button>
            Join Competition
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
