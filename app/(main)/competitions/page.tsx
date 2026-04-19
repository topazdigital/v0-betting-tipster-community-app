'use client';

import { useState } from 'react';
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
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SidebarNew } from '@/components/layout/sidebar-new';
import { cn } from '@/lib/utils';

// Mock competitions data
const competitions = [
  {
    id: 1,
    name: 'Weekly Tipster Challenge',
    description: 'Compete with other tipsters for the highest win rate this week! Top 10 win prizes.',
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
    description: 'The ultimate monthly competition for serious tipsters. Bigger stakes, bigger rewards!',
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
  {
    id: 3,
    name: 'Football Weekend Blitz',
    description: 'Football-only competition! Predict weekend matches and win big.',
    type: 'weekend',
    status: 'upcoming',
    startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
    prizePool: 30000,
    entryFee: 50,
    maxParticipants: 1000,
    currentParticipants: 0,
    yourRank: null,
    prizes: [
      { place: '1st', amount: 12000 },
      { place: '2nd', amount: 8000 },
      { place: '3rd', amount: 5000 },
      { place: '4-10th', amount: 714 },
    ],
  },
  {
    id: 4,
    name: 'NBA Playoffs Special',
    description: 'Basketball fans! Predict NBA playoff games for a chance to win.',
    type: 'special',
    status: 'active',
    startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    prizePool: 75000,
    entryFee: 200,
    maxParticipants: 300,
    currentParticipants: 245,
    yourRank: 8,
    prizes: [
      { place: '1st', amount: 30000 },
      { place: '2nd', amount: 20000 },
      { place: '3rd', amount: 12000 },
      { place: '4-10th', amount: 1857 },
    ],
  },
];

const pastCompetitions = [
  {
    id: 101,
    name: 'March Madness Challenge',
    type: 'special',
    prizePool: 100000,
    winner: 'KingOfTips',
    yourRank: 5,
    endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: 102,
    name: 'Weekly Challenge #12',
    type: 'weekly',
    prizePool: 50000,
    winner: 'AcePredicts',
    yourRank: 12,
    endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
];

export default function CompetitionsPage() {
  const [activeTab, setActiveTab] = useState('active');

  const activeComps = competitions.filter(c => c.status === 'active');
  const upcomingComps = competitions.filter(c => c.status === 'upcoming');

  const formatTimeLeft = (endDate: Date) => {
    const diff = endDate.getTime() - Date.now();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return 'Ending soon';
  };

  const formatStartsIn = (startDate: Date) => {
    const diff = startDate.getTime() - Date.now();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `Starts in ${days}d ${hours}h`;
    if (hours > 0) return `Starts in ${hours}h`;
    return 'Starting soon';
  };

  return (
    <div className="flex">
      <SidebarNew />
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 py-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
                <Trophy className="h-7 w-7 text-warning" />
                Competitions
              </h1>
              <p className="text-sm text-muted-foreground">
                Compete with other tipsters and win prizes
              </p>
            </div>
            <Button asChild>
              <Link href="/leaderboard">
                <Star className="mr-2 h-4 w-4" />
                View Leaderboard
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-gradient-to-br from-warning/10 to-transparent p-4 text-center">
              <Gift className="mx-auto h-6 w-6 text-warning" />
              <div className="mt-2 text-2xl font-bold text-warning">
                KES {competitions.reduce((sum, c) => sum + c.prizePool, 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Total Prize Pool</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <Zap className="mx-auto h-6 w-6 text-primary" />
              <div className="mt-2 text-2xl font-bold">{activeComps.length}</div>
              <div className="text-xs text-muted-foreground">Active Now</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <Users className="mx-auto h-6 w-6 text-success" />
              <div className="mt-2 text-2xl font-bold">
                {competitions.reduce((sum, c) => sum + c.currentParticipants, 0)}
              </div>
              <div className="text-xs text-muted-foreground">Participants</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <Target className="mx-auto h-6 w-6 text-live" />
              <div className="mt-2 text-2xl font-bold">
                {competitions.filter(c => c.yourRank).length}
              </div>
              <div className="text-xs text-muted-foreground">Your Entries</div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="active">
                Active ({activeComps.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingComps.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({pastCompetitions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-6">
              <div className="grid gap-6">
                {activeComps.map(comp => (
                  <CompetitionCard key={comp.id} competition={comp} formatTimeLeft={formatTimeLeft} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="upcoming" className="mt-6">
              <div className="grid gap-6">
                {upcomingComps.map(comp => (
                  <div 
                    key={comp.id}
                    className="rounded-xl border border-dashed border-border bg-card p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="secondary" className="mb-2">
                          <Clock className="mr-1 h-3 w-3" />
                          {formatStartsIn(comp.startDate)}
                        </Badge>
                        <h3 className="text-xl font-bold">{comp.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{comp.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-warning">
                          KES {comp.prizePool.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Prize Pool</div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Entry: KES {comp.entryFee}</span>
                      <span>Max {comp.maxParticipants} participants</span>
                    </div>
                    <Button className="mt-4" disabled>
                      <Clock className="mr-2 h-4 w-4" />
                      Notify Me
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="past" className="mt-6">
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Competition</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Winner</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Prize Pool</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Your Rank</th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">Ended</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastCompetitions.map(comp => (
                      <tr key={comp.id} className="border-b border-border hover:bg-muted/50">
                        <td className="px-4 py-4">
                          <div className="font-medium">{comp.name}</div>
                          <Badge variant="outline" className="mt-1 text-xs">{comp.type}</Badge>
                        </td>
                        <td className="px-4 py-4">
                          <Link href={`/tipsters/${comp.winner}`} className="flex items-center gap-2 hover:text-primary">
                            <Trophy className="h-4 w-4 text-warning" />
                            {comp.winner}
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-center font-semibold text-warning">
                          KES {comp.prizePool.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-center">
                          {comp.yourRank ? (
                            <Badge variant="secondary">#{comp.yourRank}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center text-sm text-muted-foreground">
                          {comp.endDate.toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
  competition: typeof competitions[0]; 
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
          <Button variant="outline" asChild>
            <Link href={`/competitions/${competition.id}`}>
              View Details
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button asChild>
            <Link href={`/competitions/${competition.id}`}>
              Join Competition
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
