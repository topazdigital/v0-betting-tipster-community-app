'use client';

import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Calendar, Search, Filter, Clock, Flame, ChevronDown, ChevronRight, CalendarDays, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SidebarNew } from '@/components/layout/sidebar-new';
import { SportsFilter } from '@/components/sports/sports-filter';
import { MatchCardNew } from '@/components/matches/match-card-new';
import { SportIcon, LeagueFlag } from '@/components/ui/team-logo';
import { Spinner } from '@/components/ui/spinner';
import { useMatches, useMatchStats } from '@/lib/hooks/use-matches';
import { ALL_SPORTS, ALL_LEAGUES } from '@/lib/sports-data';
import type { Match } from '@/lib/api/sports-api';
import { cn } from '@/lib/utils';
import { getBrowserTimezone, isToday as isTodayTz } from '@/lib/utils/timezone';

type DateTab = 'today' | 'upcoming' | 'calendar';

function toLocalISODate(d: Date): string {
  // YYYY-MM-DD in browser tz so <input type="date"> matches
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const statusOptions = [
  { value: 'all', label: 'All (Live & Upcoming)' },
  { value: 'live', label: 'Live Now' },
  { value: 'scheduled', label: 'Upcoming Only' },
];

function MatchesContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [selectedSportId, setSelectedSportId] = useState<number | null>(
    searchParams.get('sport') ? ALL_SPORTS.find(s => s.slug === searchParams.get('sport'))?.id || null : null
  );
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get('status') || 'all'
  );
  const [leagueFilter, setLeagueFilter] = useState(
    searchParams.get('league') || 'all'
  );
  const [showFilters, setShowFilters] = useState(false);
  const [dateTab, setDateTab] = useState<DateTab>('today');
  const [calendarDate, setCalendarDate] = useState<string>(toLocalISODate(new Date()));

  // Get matches with filters
  const { matches, isLoading } = useMatches({
    sportId: selectedSportId || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });
  // Unfiltered fetch — used to compute per-sport totals (Oddspedia-style)
  // so the count badges don't change when a sport tab is selected.
  const { matches: allMatches } = useMatches();
  const stats = useMatchStats();

  // Calculate match counts per sport from the UNFILTERED list.
  const matchCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    allMatches.forEach(m => {
      counts[m.sportId] = (counts[m.sportId] || 0) + 1;
    });
    return counts;
  }, [allMatches]);

  // Get relevant leagues for selected sport
  const relevantLeagues = useMemo(() => {
    if (!selectedSportId) return ALL_LEAGUES.slice(0, 20);
    return ALL_LEAGUES.filter(l => l.sportId === selectedSportId);
  }, [selectedSportId]);

  // Apply additional filters
  const filteredMatches = useMemo(() => {
    // Always exclude finished matches — those are in the Results page
    let result = matches.filter(m => m.status !== 'finished');
    const tz = getBrowserTimezone();

    // Date tab filter — applies on top of all other filters
    // Use local-tz YYYY-MM-DD comparison (works regardless of browser TZ)
    // EXCEPTION: when filtering by "Live Now" we want every live match
    // regardless of when it kicked off (late games crossing midnight, etc).
    const todayKey = toLocalISODate(new Date());
    if (statusFilter !== 'live') {
      if (dateTab === 'today') {
        // "Today" should include every match scheduled for today in the
        // user's local timezone — finished, live, or upcoming. This lets
        // visitors see the full daily slate (final scores + still-to-play)
        // without bouncing between tabs.
        result = result.filter(m => toLocalISODate(new Date(m.kickoffTime)) === todayKey);
      } else if (dateTab === 'upcoming') {
        result = result.filter(m => {
          const k = toLocalISODate(new Date(m.kickoffTime));
          return k > todayKey && m.status === 'scheduled';
        });
      } else if (dateTab === 'calendar' && calendarDate) {
        result = result.filter(m => toLocalISODate(new Date(m.kickoffTime)) === calendarDate);
      }
    }
    void tz; void isTodayTz;

    // League filter
    if (leagueFilter !== 'all') {
      const league = ALL_LEAGUES.find(l => l.slug === leagueFilter);
      if (league) {
        result = result.filter(m => m.leagueId === league.id);
      }
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(m => 
        m.homeTeam.name.toLowerCase().includes(searchLower) ||
        m.awayTeam.name.toLowerCase().includes(searchLower) ||
        m.league.name.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [matches, leagueFilter, search, dateTab, calendarDate]);

  // Group matches by league — preserves the API's sport priority → league priority → time order
  // (filteredMatches is already sorted by sportPriority -> leaguePriority -> status -> kickoff)
  const groupedMatches = useMemo(() => {
    const groups = new Map<string, { sport: Match['sport']; league: Match['league']; matches: Match[] }>();

    filteredMatches.forEach(match => {
      const key = `${match.sport.id}-${match.league.id}-${match.league.name}`;
      const existing = groups.get(key);
      if (existing) {
        existing.matches.push(match);
      } else {
        groups.set(key, { sport: match.sport, league: match.league, matches: [match] });
      }
    });

    // Map preserves insertion order — that's exactly what we want
    return Array.from(groups.entries()).map(([key, group]) => ({
      key,
      sport: group.sport,
      league: group.league,
      matches: group.matches,
    }));
  }, [filteredMatches]);

  return (
    <div className="flex">
      <SidebarNew selectedSportId={selectedSportId} onSelectSport={setSelectedSportId} />
      
      <div className="flex-1 overflow-hidden">
        {/* Sports Filter Bar */}
        <div className="border-b border-border bg-card/50 px-4 py-2">
          <div className="mx-auto max-w-5xl">
            <SportsFilter 
              selectedSportId={selectedSportId}
              onSelectSport={setSelectedSportId}
              matchCounts={matchCounts}
            />
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-3">
          {/* Header */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-lg font-bold text-foreground">
                {selectedSportId 
                  ? ALL_SPORTS.find(s => s.id === selectedSportId)?.name + ' Matches'
                  : 'All Matches'
                }
              </h1>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-3">
              <Badge 
                variant={statusFilter === 'live' ? 'destructive' : 'outline'}
                className="cursor-pointer gap-1"
                onClick={() => setStatusFilter(statusFilter === 'live' ? 'all' : 'live')}
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-live"></span>
                </span>
                {stats.live} Live
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {stats.today} Today
              </Badge>
            </div>
          </div>

          {/* Today / Upcoming / Calendar tabs */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-border bg-card p-1">
              {([
                { v: 'today' as DateTab,    label: 'Today',    Icon: Clock },
                { v: 'upcoming' as DateTab, label: 'Upcoming', Icon: CalendarClock },
                { v: 'calendar' as DateTab, label: 'Calendar', Icon: CalendarDays },
              ]).map(({ v, label, Icon }) => (
                <button
                  key={v}
                  onClick={() => setDateTab(v)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    dateTab === v
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
            {dateTab === 'calendar' && (
              <Input
                type="date"
                value={calendarDate}
                onChange={(e) => setCalendarDate(e.target.value)}
                className="w-44"
              />
            )}
          </div>

          {/* Filters */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search teams, leagues..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={leagueFilter} onValueChange={setLeagueFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Leagues" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leagues</SelectItem>
                {relevantLeagues.map(league => (
                  <SelectItem key={league.id} value={league.slug}>
                    {league.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setLeagueFilter('all');
                setSelectedSportId(null);
              }}
            >
              Clear All
            </Button>
          </div>

          {/* Results Count */}
          <div className="mb-2 text-xs text-muted-foreground">
            {filteredMatches.length} match{filteredMatches.length !== 1 ? 'es' : ''} found
            {statusFilter === 'live' && (
              <span className="ml-2 text-live">• Updating every 10 seconds</span>
            )}
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Spinner className="h-8 w-8" />
            </div>
          ) : filteredMatches.length > 0 ? (
            /* Match Lists Grouped by League */
            <div className="space-y-3">
              {groupedMatches.map(({ key, sport, league, matches: leagueMatches }) => {
                const leagueSlug = league.slug || league.name.toLowerCase().replace(/\s+/g, '-');
                return (
                <div key={key}>
                  <div className="mb-2 flex items-center justify-between border-b border-border/60 pb-2">
                    <Link
                      href={`/leagues/${leagueSlug}`}
                      className="group flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
                    >
                      <SportIcon sportSlug={sport.slug} size="sm" />
                      <LeagueFlag countryCode={league.countryCode} size="xs" />
                      <span className="text-muted-foreground text-xs uppercase tracking-wide group-hover:text-primary/70">{league.country}</span>
                      <span className="group-hover:underline underline-offset-4">{league.name}</span>
                      <Badge variant="secondary" className="ml-1 text-xs">{leagueMatches.length}</Badge>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </div>
                  <div className="space-y-1.5">
                    {leagueMatches.map(match => (
                      <MatchCardNew key={match.id} match={match} variant="compact" showLeague={false} />
                    ))}
                  </div>
                </div>
              );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-xl border border-border bg-card p-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">No matches found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Try adjusting your filters or check back later
              </p>
              <Button 
                className="mt-4"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setLeagueFilter('all');
                  setSelectedSportId(null);
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MatchesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    }>
      <MatchesContent />
    </Suspense>
  );
}
