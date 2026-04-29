'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Star, Calendar, TrendingUp, Trophy, Sparkles, ChevronRight, Users,
  Target, Wallet, BadgeCheck, Flame, Activity, Percent, ArrowRight,
  Zap, Clock,
} from 'lucide-react';
import { TeamLogo } from '@/components/ui/team-logo';
import { FlagIcon } from '@/components/ui/flag-icon';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/contexts/auth-context';
import { useAuthModal } from '@/contexts/auth-modal-context';
import { formatDate, formatTime, getBrowserTimezone } from '@/lib/utils/timezone';
import { cn } from '@/lib/utils';
import { matchIdToSlug } from '@/lib/utils/match-url';
import { teamHref } from '@/lib/utils/slug';

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

interface TipsterLatestTip {
  id: number | string;
  market: string;
  selection: string;
  odds: number;
  confidence: number;
  status: string;
  createdAt: string;
  match: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    league: string;
    sport: string;
    kickoffTime: string;
    homeScore: number | null;
    awayScore: number | null;
  };
}

interface FollowedTipster {
  id: number;
  username: string;
  displayName: string;
  avatar: string | null;
  countryCode?: string | null;
  winRate: number;
  roi: number;
  totalTips: number;
  streak: number;
  isPro?: boolean;
  verified?: boolean;
  latestTip?: TipsterLatestTip | null;
}

interface FeedTip {
  id: number;
  market: string;
  selection: string;
  odds: number;
  stake: number;
  status: 'pending' | 'won' | 'lost' | 'void' | string;
  confidence: number;
  createdAt: string;
  match: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    league: string;
    sport: string;
    homeScore: number | null;
    awayScore: number | null;
    kickoffTime: string;
  };
  tipster: { id: number; displayName: string; username: string; avatar: string | null };
}

interface DashboardStats {
  teamsFollowed: number;
  tipstersFollowed: number;
  tipsWon: number;
  tipsLost: number;
  tipsPending: number;
  winRate: number;
  avgFollowedWinRate: number;
  avgFollowedRoi: number;
}

interface DashboardData {
  authenticated: boolean;
  teams: FollowedTeam[];
  upcomingMatches: DashboardEvent[];
  recentResults: DashboardEvent[];
  followedTipsters: number[];
  tipsters?: FollowedTipster[];
  recentTips?: FeedTip[];
  stats?: DashboardStats;
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { open: openAuthModal } = useAuthModal();
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
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('register')}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted"
            >
              Create account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasTeams = data.teams.length > 0;
  const hasTipsters = (data.tipsters?.length ?? 0) > 0;
  if (!hasTeams && !hasTipsters) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <Star className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h1 className="mt-4 text-2xl font-bold">Build your personal feed</h1>
          <p className="mt-2 text-muted-foreground">
            Follow your favourite teams and tipsters and we&apos;ll build a custom feed of fixtures, results, AI tips, and the latest picks just for you.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/matches" className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Browse matches <ChevronRight className="h-4 w-4" />
            </Link>
            <Link href="/tipsters" className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted">
              Discover tipsters <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-5">
      {/* Hero header — compact */}
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Your dashboard
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Personalised fixtures, results & live tips from people you follow.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {(user?.role === 'tipster' || user?.role === 'admin') && (
            <Link href="/dashboard/payment-settings" className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 text-primary px-2.5 py-1.5 text-xs font-semibold hover:bg-primary/10">
              <Wallet className="h-3.5 w-3.5" /> Payouts
            </Link>
          )}
          <Link href="/notifications" className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-muted">
            Notifications <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </header>

      {/* Compact stats strip */}
      {data.stats && (data.stats.tipstersFollowed > 0 || data.stats.teamsFollowed > 0) && (
        <section className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <StatCard icon={<Users className="h-3.5 w-3.5" />} label="Teams" value={data.stats.teamsFollowed} tone="primary" />
          <StatCard icon={<BadgeCheck className="h-3.5 w-3.5" />} label="Tipsters" value={data.stats.tipstersFollowed} tone="primary" />
          <StatCard
            icon={<Percent className="h-3.5 w-3.5" />}
            label="Avg win"
            value={data.stats.tipstersFollowed > 0 ? `${data.stats.avgFollowedWinRate}%` : '—'}
            tone="emerald"
          />
          <StatCard
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            label="Avg ROI"
            value={data.stats.tipstersFollowed > 0 ? `${data.stats.avgFollowedRoi > 0 ? '+' : ''}${data.stats.avgFollowedRoi}%` : '—'}
            tone={data.stats.avgFollowedRoi >= 0 ? 'emerald' : 'rose'}
          />
        </section>
      )}

      {/* Two-column main grid: left = your feeds, right = tipsters */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left column = followed teams + matches */}
        <div className="space-y-4 lg:col-span-2">
          {/* Followed teams chips */}
          {hasTeams && (
            <section className="rounded-xl border border-border bg-card p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> Following teams ({data.teams.length})
                </h2>
                <Link href="/matches" className="text-[11px] font-medium text-primary hover:underline">
                  Find more →
                </Link>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {data.teams.map(t => (
                  <Link
                    key={t.teamId}
                    href={teamHref(t.teamName, t.teamId)}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    <div className="h-5 w-5 overflow-hidden rounded-full">
                      <TeamLogo teamName={t.teamName} logoUrl={t.teamLogo || undefined} sportSlug={t.sportSlug || undefined} size="sm" className="h-full w-full" />
                    </div>
                    <span className="font-medium">{t.teamName}</span>
                    {t.countryCode && <FlagIcon countryCode={t.countryCode} size="xs" />}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Upcoming + Results — compact two-column on desktop, stacked on mobile */}
          {hasTeams && (
            <div className="grid gap-4 sm:grid-cols-2">
              <section>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" /> Upcoming
                  </h2>
                  {data.upcomingMatches.length > 0 && (
                    <span className="text-[10px] text-muted-foreground">{data.upcomingMatches.length}</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {data.upcomingMatches.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      No upcoming matches yet.
                    </div>
                  )}
                  {data.upcomingMatches.slice(0, 6).map((ev, i) => (
                    <DashboardMatchRow key={ev.id + i} ev={ev} tz={tz} kind="upcoming" />
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5" /> Results
                  </h2>
                  {data.recentResults.length > 0 && (
                    <span className="text-[10px] text-muted-foreground">{data.recentResults.length}</span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {data.recentResults.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      No recent results yet.
                    </div>
                  )}
                  {data.recentResults.slice(0, 6).map((ev, i) => (
                    <DashboardMatchRow key={ev.id + i} ev={ev} tz={tz} kind="result" />
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* AI Tips strip for upcoming matches */}
          {data.upcomingMatches.length > 0 && (
            <section>
              <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Target className="h-3.5 w-3.5 text-amber-500" /> AI picks for your teams
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {data.upcomingMatches.slice(0, 6).map((ev, i) => (
                  <AiTipCard key={ev.id + 'tip' + i} ev={ev} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column = followed tipsters with their latest tip inline */}
        <div className="lg:col-span-1">
          {hasTipsters && data.tipsters && (
            <section>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <BadgeCheck className="h-3.5 w-3.5" /> Following tipsters ({data.tipsters.length})
                </h2>
                <Link href="/tipsters" className="text-[11px] font-medium text-primary hover:underline">
                  Discover →
                </Link>
              </div>
              <div className="space-y-2">
                {data.tipsters.map((t) => (
                  <TipsterCardWithTip key={t.id} t={t} tz={tz} />
                ))}
              </div>
              {data.stats && (data.stats.tipsWon + data.stats.tipsLost) > 0 && (
                <div className="mt-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
                  Recent feed record:{' '}
                  <strong className="text-emerald-600">{data.stats.tipsWon}W</strong>{' · '}
                  <strong className="text-rose-600">{data.stats.tipsLost}L</strong>{' · '}
                  {data.stats.tipsPending} pending
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Latest tips feed across all followed tipsters */}
      {(data.recentTips?.length ?? 0) > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Activity className="h-3.5 w-3.5 text-primary" /> Latest tips from your tipsters
          </h2>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {data.recentTips!.slice(0, 9).map((t) => (
              <FeedTipCard key={`${t.tipster.id}-${t.id}`} t={t} tz={tz} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({
  icon, label, value, tone = 'primary',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone?: 'primary' | 'emerald' | 'rose';
}) {
  const toneClasses =
    tone === 'emerald' ? 'text-emerald-600 bg-emerald-500/10' :
    tone === 'rose' ? 'text-rose-600 bg-rose-500/10' :
    'text-primary bg-primary/10';
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-2.5">
      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', toneClasses)}>{icon}</span>
      <div className="min-w-0">
        <div className="text-base font-bold leading-tight tabular-nums">{value}</div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function TipsterCardWithTip({ t, tz }: { t: FollowedTipster; tz: string }) {
  const initials = (t.displayName || t.username || '?').slice(0, 2).toUpperCase();
  const tip = t.latestTip;
  return (
    <div className="rounded-xl border border-border bg-card p-2.5 transition-colors hover:border-primary/40">
      {/* Tipster header — clickable */}
      <Link href={`/tipsters/${t.id}`} className="group flex items-center gap-2.5">
        {t.avatar ? (
          <Image src={t.avatar} alt={t.displayName} width={36} height={36} className="h-9 w-9 rounded-full object-cover ring-2 ring-background" unoptimized />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary ring-2 ring-background">{initials}</div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 truncate text-sm font-bold group-hover:text-primary">
            {t.displayName}
            {t.verified && <BadgeCheck className="h-3 w-3 shrink-0 text-primary" />}
          </div>
          <div className="flex items-center gap-1.5 truncate text-[10px] text-muted-foreground">
            <span>@{t.username}</span>
            {t.countryCode && <FlagIcon countryCode={t.countryCode} size="xs" />}
            <span>·</span>
            <span className="text-emerald-600">{t.winRate.toFixed(0)}% win</span>
            <span>·</span>
            <span className={cn(t.roi >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
              {t.roi >= 0 ? '+' : ''}{t.roi.toFixed(1)}% ROI
            </span>
          </div>
        </div>
        {t.streak >= 3 && (
          <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
            <Flame className="h-2.5 w-2.5" />
            {t.streak}
          </div>
        )}
      </Link>

      {/* Inline latest tip */}
      {tip ? (
        <Link
          href={`/matches/${matchIdToSlug(tip.match.id)}`}
          className="mt-2 block rounded-lg border border-border bg-gradient-to-br from-primary/5 to-transparent p-2 transition-colors hover:border-primary/40"
        >
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            <Zap className="h-2.5 w-2.5 text-primary" />
            Latest tip
            <span
              className={cn(
                'ml-auto rounded px-1 py-px font-bold',
                tip.status === 'won' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' :
                tip.status === 'lost' ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400' :
                'bg-amber-500/15 text-amber-700 dark:text-amber-400',
              )}
            >
              {tip.status}
            </span>
          </div>
          <div className="mt-1 truncate text-xs font-semibold">
            {tip.match.homeTeam}
            <span className="px-1 text-muted-foreground">vs</span>
            {tip.match.awayTeam}
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground">{tip.market}</div>
              <div className="truncate text-xs font-medium">{tip.selection}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-primary tabular-nums">@{tip.odds.toFixed(2)}</div>
              <div className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                {formatDate(new Date(tip.match.kickoffTime), tz)}
              </div>
            </div>
          </div>
        </Link>
      ) : (
        <div className="mt-2 rounded-lg border border-dashed border-border p-2 text-center text-[11px] text-muted-foreground">
          No recent tips yet
        </div>
      )}
    </div>
  );
}

function FeedTipCard({ t, tz }: { t: FeedTip; tz: string }) {
  const status = t.status;
  const statusBadge =
    status === 'won' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' :
    status === 'lost' ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400' :
    status === 'pending' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400' :
    'bg-muted text-muted-foreground';
  const initials = (t.tipster.displayName || t.tipster.username || '?').slice(0, 2).toUpperCase();
  const created = new Date(t.createdAt);
  return (
    <div className="rounded-lg border border-border bg-card p-2.5 transition-colors hover:border-primary/40">
      <div className="flex items-center gap-1.5">
        <Link href={`/tipsters/${t.tipster.id}`} className="flex items-center gap-1.5 group">
          {t.tipster.avatar ? (
            <Image src={t.tipster.avatar} alt={t.tipster.displayName} width={22} height={22} className="h-5 w-5 rounded-full object-cover" unoptimized />
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">{initials}</div>
          )}
          <span className="truncate text-[11px] font-semibold group-hover:text-primary">{t.tipster.displayName}</span>
        </Link>
        <span className="ml-auto text-[10px] text-muted-foreground">{formatDate(created, tz)}</span>
        <span className={cn('rounded px-1 py-px text-[10px] font-bold uppercase', statusBadge)}>{status}</span>
      </div>
      <Link
        href={`/matches/${matchIdToSlug(t.match.id)}`}
        className="mt-1.5 block text-xs font-semibold hover:text-primary"
      >
        {t.match.homeTeam}
        {t.match.homeScore != null && ` ${t.match.homeScore}`}
        <span className="px-1 text-muted-foreground">vs</span>
        {t.match.awayTeam}
        {t.match.awayScore != null && ` ${t.match.awayScore}`}
      </Link>
      <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
        {t.match.league} · {t.match.sport}
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2 rounded-md bg-muted/40 p-1.5">
        <div className="min-w-0">
          <div className="text-[10px] uppercase text-muted-foreground">{t.market}</div>
          <div className="truncate text-[11px] font-semibold">{t.selection}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-primary tabular-nums">{t.odds.toFixed(2)}</div>
          <div className="text-[10px] text-muted-foreground">{t.confidence}%</div>
        </div>
      </div>
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
      href={`/matches/${matchIdToSlug(ev.id)}`}
      className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 hover:border-primary/40 transition-colors"
    >
      <div className="w-12 shrink-0 text-center">
        <div className="text-[11px] font-medium leading-tight">{formatDate(date, tz)}</div>
        <div className="text-[10px] text-muted-foreground leading-tight">{formatTime(date, tz)}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-xs font-semibold truncate">
          <span className="truncate">{ev.team.name}</span>
          <span className="text-muted-foreground">{ev.isHome ? 'vs' : '@'}</span>
          <span className="truncate text-muted-foreground">{oppName}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
          {ev.league?.countryCode && <FlagIcon countryCode={ev.league.countryCode} size="xs" />}
          <span className="truncate">{ev.league?.name || 'League'}</span>
        </div>
      </div>
      {kind === 'result' && ev.score && (
        <div className={cn(
          'shrink-0 rounded px-1.5 py-0.5 text-xs font-bold tabular-nums',
          won ? 'bg-emerald-500/10 text-emerald-600' : lost ? 'bg-rose-500/10 text-rose-600' : 'bg-muted text-foreground',
        )}>
          {ev.score.team}–{ev.score.opponent}
        </div>
      )}
      {kind === 'upcoming' && ev.odds?.home && (
        <div className="hidden sm:flex items-center gap-0.5 text-[10px] tabular-nums">
          <span className="rounded bg-muted px-1 py-0.5">{ev.odds.home.toFixed(2)}</span>
          {ev.odds.draw && <span className="rounded bg-muted px-1 py-0.5">{ev.odds.draw.toFixed(2)}</span>}
          {ev.odds.away && <span className="rounded bg-muted px-1 py-0.5">{ev.odds.away.toFixed(2)}</span>}
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
      href={`/matches/${matchIdToSlug(ev.id)}`}
      className="block rounded-lg border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent p-2.5 hover:border-amber-500/40 transition-colors"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase text-amber-600">AI Pick</span>
        <Trophy className="h-3 w-3 text-amber-500" />
      </div>
      <p className="mt-1 truncate text-xs font-semibold">vs {oppName}</p>
      <p className="mt-1 truncate text-[11px] text-muted-foreground">{market}</p>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="text-base font-bold text-amber-600 tabular-nums">@{odds.toFixed(2)}</span>
        <span className="text-[10px] text-muted-foreground">{confidence}% conf.</span>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1 truncate">
          {ev.league?.countryCode && <FlagIcon countryCode={ev.league.countryCode} size="xs" />}
          <span className="truncate">{ev.league?.name || 'League'}</span>
        </span>
        <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  );
}
