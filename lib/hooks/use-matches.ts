'use client';

import useSWR from 'swr';
import { 
  generateAllMatches, 
  getLiveMatches, 
  getTodayMatches, 
  getUpcomingMatches,
  getFinishedMatches,
  filterMatches,
  groupMatchesByLeague,
  groupMatchesBySport,
  type Match,
  type MatchFilters
} from '@/lib/api/sports-api';

// Cache for matches - regenerate every 30 seconds to simulate live updates
let matchesCache: Match[] | null = null;
let lastGenerated = 0;
const CACHE_DURATION = 30000; // 30 seconds

function getMatches(): Match[] {
  const now = Date.now();
  if (!matchesCache || now - lastGenerated > CACHE_DURATION) {
    matchesCache = generateAllMatches();
    lastGenerated = now;
  }
  return matchesCache;
}

// Fetcher function
const matchesFetcher = async (): Promise<Match[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100));
  return getMatches();
};

// Main hook for all matches
export function useMatches(filters?: MatchFilters) {
  const { data, error, isLoading, mutate } = useSWR('matches', matchesFetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: false,
  });

  const matches = data || [];
  const filteredMatches = filters ? filterMatches(matches, filters) : matches;

  return {
    matches: filteredMatches,
    allMatches: matches,
    isLoading,
    error,
    mutate,
  };
}

// Hook for live matches only
export function useLiveMatches() {
  const { data, error, isLoading } = useSWR('matches', matchesFetcher, {
    refreshInterval: 10000, // Refresh more frequently for live
    revalidateOnFocus: true,
  });

  return {
    matches: data ? getLiveMatches(data) : [],
    isLoading,
    error,
  };
}

// Hook for today's matches
export function useTodayMatches() {
  const { data, error, isLoading } = useSWR('matches', matchesFetcher, {
    refreshInterval: 30000,
  });

  return {
    matches: data ? getTodayMatches(data) : [],
    isLoading,
    error,
  };
}

// Hook for upcoming matches
export function useUpcomingMatches(limit?: number) {
  const { data, error, isLoading } = useSWR('matches', matchesFetcher, {
    refreshInterval: 60000,
  });

  const upcoming = data ? getUpcomingMatches(data) : [];
  const limited = limit ? upcoming.slice(0, limit) : upcoming;

  return {
    matches: limited,
    total: upcoming.length,
    isLoading,
    error,
  };
}

// Hook for finished matches
export function useFinishedMatches(date?: Date) {
  const { data, error, isLoading } = useSWR('matches', matchesFetcher, {
    refreshInterval: 60000,
  });

  let finished = data ? getFinishedMatches(data) : [];
  
  if (date) {
    const dateStr = date.toDateString();
    finished = finished.filter(m => new Date(m.kickoffTime).toDateString() === dateStr);
  }

  return {
    matches: finished,
    isLoading,
    error,
  };
}

// Hook for a single match
export function useMatch(matchId: string) {
  const { data, error, isLoading } = useSWR('matches', matchesFetcher, {
    refreshInterval: 10000,
  });

  const match = data?.find(m => m.id === matchId);

  return {
    match,
    isLoading,
    error,
  };
}

// Hook for matches grouped by league
export function useMatchesByLeague(sportId?: number) {
  const { data, error, isLoading } = useSWR('matches', matchesFetcher, {
    refreshInterval: 30000,
  });

  let matches = data || [];
  if (sportId) {
    matches = matches.filter(m => m.sportId === sportId);
  }

  return {
    groups: groupMatchesByLeague(matches),
    isLoading,
    error,
  };
}

// Hook for matches grouped by sport
export function useMatchesBySport() {
  const { data, error, isLoading } = useSWR('matches', matchesFetcher, {
    refreshInterval: 30000,
  });

  return {
    groups: groupMatchesBySport(data || []),
    isLoading,
    error,
  };
}

// Stats hook
export function useMatchStats() {
  const { data, isLoading } = useSWR('matches', matchesFetcher, {
    refreshInterval: 30000,
  });

  const matches = data || [];

  return {
    total: matches.length,
    live: getLiveMatches(matches).length,
    today: getTodayMatches(matches).length,
    upcoming: getUpcomingMatches(matches).length,
    finished: getFinishedMatches(matches).length,
    isLoading,
  };
}
