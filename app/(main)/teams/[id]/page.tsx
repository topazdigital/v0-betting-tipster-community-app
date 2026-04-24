'use client';

import { use } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
  ArrowLeft, MapPin, Calendar, Trophy, TrendingUp,
  ChevronRight, Shield, Flame
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamLogo } from '@/components/ui/team-logo';
import { cn } from '@/lib/utils';
import { formatDate, getBrowserTimezone, formatTime } from '@/lib/utils/timezone';

interface PageProps { params: Promise<{ id: string }> }

const fetcher = (url: string) => fetch(url).then(r => r.json());

function ResultBadge({ result }: { result: string | null }) {
  if (!result) return null;
  return (
    <span className={cn(
      'inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white',
      result === 'W' ? 'bg-green-500' : result === 'L' ? 'bg-red-500' : 'bg-yellow-500'
    )}>
      {result}
    </span>
  );
}

function FormBar({ past }: { past: Array<{ result: string | null }> }) {
  const last5 = [...past].reverse().slice(0, 5);
  return (
    <div className="flex items-center gap-1">
      {last5.map((m, i) => (
        <span
          key={i}
          className={cn(
            'h-2.5 w-2.5 rounded-full',
            m.result === 'W' ? 'bg-green-500' : m.result === 'L' ? 'bg-red-500' : 'bg-yellow-500'
          )}
          title={m.result || '?'}
        />
      ))}
    </div>
  );
}

interface MatchEvent {
  id: string;
  date: string;
  name?: string;
  status: string;
  isHome: boolean;
  opponent: { id: string; name: string; shortName: string; logo?: string } | null;
  score: { team: number; opponent: number } | null;
  result: string | null;
  venue?: string;
  odds?: { home?: number; draw?: number; away?: number };
}

function MatchRow({ event, timezone, teamName }: { event: MatchEvent; timezone: string; teamName: string }) {
  const kickoff = new Date(event.date);
  const isLive = event.status === 'live';
  const isFinished = event.status === 'finished';
  const won = event.result === 'W';
  const lost = event.result === 'L';

  return (
    <div className={cn(
      'flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/30',
      isLive && 'border-live/30 bg-live/5'
    )}>
      {/* Date / status */}
      <div className="w-16 shrink-0 text-center text-xs text-muted-foreground">
        {isLive ? (
          <span className="font-bold text-live">LIVE</span>
        ) : (
          <>
            <div className="font-medium">{formatDate(kickoff, timezone)}</div>
            <div>{formatTime(kickoff, timezone)}</div>
          </>
        )}
      </div>

      {/* Home/Away badge */}
      <span className={cn(
        'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold',
        event.isHome ? 'bg-blue-500/10 text-blue-600' : 'bg-muted text-muted-foreground'
      )}>
        {event.isHome ? 'H' : 'A'}
      </span>

      {/* Opponent */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {event.opponent ? (
          <>
            <TeamLogo teamName={event.opponent.name} logoUrl={event.opponent.logo} size="xs" />
            <span className="truncate text-sm font-medium">{event.opponent.name}</span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Unknown</span>
        )}
      </div>

      {/* Score / odds */}
      {isFinished && event.score ? (
        <div className="flex items-center gap-2">
          <span className={cn(
            'font-mono text-sm font-bold',
            won ? 'text-green-500' : lost ? 'text-red-500' : 'text-yellow-500'
          )}>
            {event.score.team}–{event.score.opponent}
          </span>
          <ResultBadge result={event.result} />
        </div>
      ) : !isFinished && event.odds ? (
        <div className="flex items-center gap-1 text-xs">
          <span className="rounded bg-secondary px-1.5 py-0.5 font-mono font-semibold">
            {event.odds.home?.toFixed(2)}
          </span>
          {event.odds.draw && (
            <span className="rounded bg-secondary px-1.5 py-0.5 font-mono font-semibold">
              {event.odds.draw?.toFixed(2)}
            </span>
          )}
          <span className="rounded bg-secondary px-1.5 py-0.5 font-mono font-semibold">
            {event.odds.away?.toFixed(2)}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export default function TeamPage({ params }: PageProps) {
  const { id } = use(params);
  const timezone = getBrowserTimezone();

  const { data, isLoading, error } = useSWR(
    `/api/teams/${encodeURIComponent(id)}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
        <span className="ml-3 text-muted-foreground">Loading team...</span>
      </div>
    );
  }

  if (error || data?.error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
        <Shield className="h-12 w-12 text-muted-foreground/40" />
        <div>
          <p className="font-semibold">Team not found</p>
          <p className="text-sm text-muted-foreground">{data?.error || 'Could not load team data'}</p>
        </div>
        <Link href="/matches" className="text-sm text-primary hover:underline">← Back to matches</Link>
      </div>
    );
  }

  const { team, past, upcoming } = data || {};
  if (!team) return null;

  // Stats from past matches
  const wins = past?.filter((m: MatchEvent) => m.result === 'W').length || 0;
  const draws = past?.filter((m: MatchEvent) => m.result === 'D').length || 0;
  const losses = past?.filter((m: MatchEvent) => m.result === 'L').length || 0;
  const played = wins + draws + losses;
  const goalsFor = past?.reduce((sum: number, m: MatchEvent) => sum + (m.score?.team || 0), 0) || 0;
  const goalsAgainst = past?.reduce((sum: number, m: MatchEvent) => sum + (m.score?.opponent || 0), 0) || 0;

  const accentColor = team.color || '#3b82f6';

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      {/* Back nav */}
      <Link
        href="/matches"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Matches
      </Link>

      {/* Team Hero */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{ background: `linear-gradient(135deg, ${accentColor}22 0%, transparent 60%)` }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{ background: `radial-gradient(circle at top right, ${accentColor}, transparent 70%)` }}
        />
        <div className="relative flex items-center gap-5">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
            <TeamLogo teamName={team.name} logoUrl={team.logo} size="xl" className="h-full w-full" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{team.name}</h1>
            {team.nickname && team.nickname !== team.name && (
              <p className="text-sm text-muted-foreground">{team.nickname}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {team.venue && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {team.venue}
                </span>
              )}
              {team.founded && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Est. {team.founded}
                </span>
              )}
              {team.record && (
                <Badge variant="outline" className="text-xs">{team.record}</Badge>
              )}
              {team.standing?.position && (
                <span className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  {team.standing.position}
                </span>
              )}
            </div>
            {past?.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Form:</span>
                <FormBar past={past} />
              </div>
            )}
          </div>
        </div>

        {/* Season stats */}
        {played > 0 && (
          <div className="relative mt-5 grid grid-cols-5 gap-2">
            {[
              { label: 'P', value: played },
              { label: 'W', value: wins, color: 'text-green-500' },
              { label: 'D', value: draws, color: 'text-yellow-500' },
              { label: 'L', value: losses, color: 'text-red-500' },
              { label: 'GD', value: `${goalsFor > 0 ? '+' : ''}${goalsFor - goalsAgainst}`, color: (goalsFor - goalsAgainst) >= 0 ? 'text-green-500' : 'text-red-500' },
            ].map(s => (
              <div key={s.label} className="rounded-lg border border-border bg-card/60 p-2 text-center">
                <div className={cn('text-lg font-bold', s.color)}>{s.value}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming">
        <TabsList className="w-full">
          <TabsTrigger value="upcoming" className="flex-1">
            <Flame className="mr-1.5 h-4 w-4" />
            Upcoming
            {upcoming?.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 px-1.5 py-0">{upcoming.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="results" className="flex-1">
            <TrendingUp className="mr-1.5 h-4 w-4" />
            Results
            {past?.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 px-1.5 py-0">{past.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Upcoming Matches */}
        <TabsContent value="upcoming" className="mt-4 space-y-2">
          {upcoming?.length > 0 ? (
            upcoming.map((event: MatchEvent) => (
              <MatchRow key={event.id} event={event} timezone={timezone} teamName={team.name} />
            ))
          ) : (
            <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
              <Calendar className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No upcoming matches scheduled</p>
            </div>
          )}
        </TabsContent>

        {/* Past Results */}
        <TabsContent value="results" className="mt-4 space-y-2">
          {past?.length > 0 ? (
            past.map((event: MatchEvent) => (
              <MatchRow key={event.id} event={event} timezone={timezone} teamName={team.name} />
            ))
          ) : (
            <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed">
              <TrendingUp className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No recent results</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick links */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">Quick Links</h3>
        <div className="flex flex-wrap gap-2">
          <Link href="/matches" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
            All Matches <ChevronRight className="h-3.5 w-3.5" />
          </Link>
          <Link href="/leaderboard" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
            Tipster Leaderboard <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
