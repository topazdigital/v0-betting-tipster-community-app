'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, Calendar, TrendingUp, Trophy, Sparkles, ChevronRight, Users, Target } from 'lucide-react';
import { TeamLogo } from '@/components/ui/team-logo';
import { FlagIcon } from '@/components/ui/flag-icon';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/contexts/auth-context';
import { formatDate, formatTime, getBrowserTimezone } from '@/lib/utils/timezone';
import { cn } from '@/lib/utils';

interface FollowedTeam {
  teamId: string;
  teamName: string;
  teamLogo?: string | null;
  leagueName?: string | null;
  leagueSlug?: string | null;
  countryCode?: string | null;
  sportSlug?: string | null;
  followedAt: string;
}

interface DashboardEvent {
  id: string;
  date: string;
  status: string;
  isHome: boolean;
  opponent: { id: string; name: string; logo?: string } | null;
  score?: { team: number; opponent: number } | null;
  result?: string | null;
  team: { id: string; name: string; logo?: string };
  league?: { name?: string | null; slug?: string | null; countryCode?: string | null };
  odds?: { home?: number; draw?: number; away?: number };
}

interface DashboardData {
  authenticated: boolean;
  teams: FollowedTeam[];
  upcomingMatches: DashboardEvent[];
  recentResults: DashboardEvent[];
  followedTipsters: number[];
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tz] = useState<string>(() => getBrowserTimezone());

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData({ authenticated: false, teams: [], upcomingMatches: [], recentResults: [], followedTipsters: [] }))
      .finally(() => setLoading(false));
  }, []);

  if (authLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user || !data?.authenticated) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <Star className="mx-auto h-12 w-12 text-amber-500" />
          <h1 className="mt-4 text-2xl font-bold">Your personal dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to follow teams, get AI tips for your favourites, and never miss a fixture.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link href="/login?next=/dashboard" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Sign in
            </Link>
            <Link href="/register" className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (data.teams.length === 0) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <Star className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h1 className="mt-4 text-2xl font-bold">Follow your favourite teams</h1>
          <p className="mt-2 text-muted-foreground">
            Tap the <strong>Follow Team</strong> button on any team page and we’ll build a custom feed of fixtures, results, and AI-powered tips just for you.
          </p>
          <Link href="/matches" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Browse matches <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" />
            Your dashboard
          </h1>
          <p className="text-sm text-muted-foreground">Personalised fixtures, results & AI tips for the teams you follow.</p>
        </div>
        <Link href="/notifications" className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted">
          Notifications <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      {/* Followed Teams */}
      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Users className="h-4 w-4" /> Following ({data.teams.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {data.teams.map(t => (
            <Link
              key={t.teamId}
              href={`/teams/${encodeURIComponent(t.teamId)}`}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:border-primary/40"
            >
              <div className="h-6 w-6 overflow-hidden rounded-full">
                <TeamLogo teamName={t.teamName} logoUrl={t.teamLogo || undefined} sportSlug={t.sportSlug || undefined} size="sm" className="h-full w-full" />
              </div>
              <span className="font-medium">{t.teamName}</span>
              {t.countryCode && <FlagIcon countryCode={t.countryCode} size="xs" />}
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Calendar className="h-4 w-4" /> Upcoming matches
          </h2>
          <div className="space-y-2">
            {data.upcomingMatches.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No upcoming matches for your teams.
              </div>
            )}
            {data.upcomingMatches.map((ev, i) => (
              <DashboardMatchRow key={ev.id + i} ev={ev} tz={tz} kind="upcoming" />
            ))}
          </div>
        </section>

        {/* Results */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <TrendingUp className="h-4 w-4" /> Recent results
          </h2>
          <div className="space-y-2">
            {data.recentResults.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No recent results yet.
              </div>
            )}
            {data.recentResults.map((ev, i) => (
              <DashboardMatchRow key={ev.id + i} ev={ev} tz={tz} kind="result" />
            ))}
          </div>
        </section>
      </div>

      {/* AI Tips section */}
      {data.upcomingMatches.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Target className="h-4 w-4 text-amber-500" /> AI Tips for your teams
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.upcomingMatches.slice(0, 6).map((ev, i) => (
              <AiTipCard key={ev.id + 'tip' + i} ev={ev} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function DashboardMatchRow({ ev, tz, kind }: { ev: DashboardEvent; tz: string; kind: 'upcoming' | 'result' }) {
  const date = new Date(ev.date);
  const won = ev.result === 'W';
  const lost = ev.result === 'L';
  const oppName = ev.opponent?.name || 'Opponent';
  return (
    <Link
      href={`/matches/${encodeURIComponent(ev.id)}`}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/40 transition-colors"
    >
      <div className="w-14 shrink-0 text-center">
        <div className="text-xs font-medium">{formatDate(date, tz)}</div>
        <div className="text-[10px] text-muted-foreground">{formatTime(date, tz)}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm font-semibold truncate">
          <span className="truncate">{ev.team.name}</span>
          <span className="text-muted-foreground">{ev.isHome ? 'vs' : '@'}</span>
          <span className="truncate text-muted-foreground">{oppName}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {ev.league?.countryCode && <FlagIcon countryCode={ev.league.countryCode} size="xs" />}
          <span className="truncate">{ev.league?.name || 'League'}</span>
        </div>
      </div>
      {kind === 'result' && ev.score && (
        <div className={cn(
          'shrink-0 rounded-md px-2 py-1 text-sm font-bold tabular-nums',
          won ? 'bg-emerald-500/10 text-emerald-600' : lost ? 'bg-rose-500/10 text-rose-600' : 'bg-muted text-foreground'
        )}>
          {ev.score.team}–{ev.score.opponent}
        </div>
      )}
      {kind === 'upcoming' && ev.odds?.home && (
        <div className="hidden sm:flex items-center gap-1 text-[11px] tabular-nums">
          <span className="rounded bg-muted px-1.5 py-0.5">{ev.odds.home.toFixed(2)}</span>
          {ev.odds.draw && <span className="rounded bg-muted px-1.5 py-0.5">{ev.odds.draw.toFixed(2)}</span>}
          {ev.odds.away && <span className="rounded bg-muted px-1.5 py-0.5">{ev.odds.away.toFixed(2)}</span>}
        </div>
      )}
    </Link>
  );
}

function AiTipCard({ ev }: { ev: DashboardEvent }) {
  const oppName = ev.opponent?.name || 'Opponent';
  const o = ev.odds || {};
  const teamOdds = ev.isHome ? o.home : o.away;
  const oppOdds = ev.isHome ? o.away : o.home;
  let market = `${ev.team.name} to win`;
  let odds = teamOdds || 2.0;
  let confidence = 60;
  if (teamOdds && oppOdds) {
    const teamFav = teamOdds < oppOdds;
    if (!teamFav) {
      market = 'Double chance — ' + ev.team.name + ' or draw';
      odds = Math.max(1.5, teamOdds * 0.7);
      confidence = 55;
    } else {
      confidence = Math.min(85, Math.round((1 / teamOdds) / (1/teamOdds + 1/oppOdds + (o.draw ? 1/o.draw : 0)) * 100));
    }
  }
  return (
    <Link
      href={`/matches/${encodeURIComponent(ev.id)}`}
      className="block rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent p-3 hover:border-amber-500/40 transition-colors"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase text-amber-600">AI Pick</span>
        <Trophy className="h-3.5 w-3.5 text-amber-500" />
      </div>
      <p className="mt-1 text-sm font-semibold truncate">vs {oppName}</p>
      <p className="text-xs text-muted-foreground truncate">{market}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-base font-bold text-primary tabular-nums">{odds.toFixed(2)}</span>
        <span className={cn(
          'rounded-full px-2 py-0.5 text-[10px] font-bold',
          confidence >= 70 ? 'bg-emerald-500/15 text-emerald-600' :
          confidence >= 55 ? 'bg-amber-500/15 text-amber-600' : 'bg-rose-500/15 text-rose-600'
        )}>
          {confidence}%
        </span>
      </div>
    </Link>
  );
}
