'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar, Search, Filter, Clock, Flame, ChevronDown } from 'lucide-react';
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

const statusOptions = [
  { value: 'all', label: 'All Matches' },
  { value: 'live', label: 'Live Now' },
  { value: 'scheduled', label: 'Upcoming' },
  { value: 'finished', label: 'Finished' },
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

  // Get matches with filters
  const { matches, isLoading } = useMatches({
    sportId: selectedSportId || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });
  const stats = useMatchStats();

  // Calculate match counts per sport
  const matchCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    matches.forEach(m => {
      counts[m.sportId] = (counts[m.sportId] || 0) + 1;
    });
    return counts;
  }, [matches]);

  // Get relevant leagues for selected sport
  const relevantLeagues = useMemo(() => {
    if (!selectedSportId) return ALL_LEAGUES.slice(0, 20);
    return ALL_LEAGUES.filter(l => l.sportId === selectedSportId);
  }, [selectedSportId]);

  // Apply additional filters
  const filteredMatches = useMemo(() => {
    let result = matches;

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
  }, [matches, leagueFilter, search]);

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
              {groupedMatches.map(({ key, sport, league, matches: leagueMatches }) => (
                <div key={key}>
                  <div className="mb-2 flex items-center justify-between border-b border-border/60 pb-2">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <SportIcon sportSlug={sport.slug} size="sm" />
                      <LeagueFlag countryCode={league.countryCode} size="xs" />
                      <span className="text-muted-foreground text-xs uppercase tracking-wide">{league.country}</span>
                      <span>{league.name}</span>
                      <Badge variant="secondary" className="ml-1 text-xs">{leagueMatches.length}</Badge>
                    </h2>
                  </div>
                  <div className="space-y-1.5">
                    {leagueMatches.map(match => (
                      <MatchCardNew key={match.id} match={match} variant="compact" showLeague={false} />
                    ))}
                  </div>
                </div>
              ))}
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
