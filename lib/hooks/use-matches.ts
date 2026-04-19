'use client';

import useSWR from 'swr';
import { useState, useEffect } from 'react';
import type { Match } from '@/lib/api/sports-api';

// User's detected country code
let detectedCountryCode: string | null = null;

// Detect user's country from browser
async function detectUserCountry(): Promise<string> {
  if (detectedCountryCode) return detectedCountryCode;
  
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    const timezoneCountryMap: Record<string, string> = {
      'Africa/Nairobi': 'KE',
      'Africa/Lagos': 'NG',
      'Africa/Accra': 'GH',
      'Africa/Cairo': 'EG',
      'Africa/Johannesburg': 'ZA',
      'Europe/London': 'GB',
      'Europe/Madrid': 'ES',
      'Europe/Berlin': 'DE',
      'Europe/Rome': 'IT',
      'Europe/Paris': 'FR',
      'Europe/Amsterdam': 'NL',
      'Europe/Lisbon': 'PT',
      'Europe/Istanbul': 'TR',
      'Europe/Brussels': 'BE',
      'Europe/Moscow': 'RU',
      'America/New_York': 'US',
      'America/Los_Angeles': 'US',
      'America/Chicago': 'US',
      'America/Sao_Paulo': 'BR',
      'America/Argentina/Buenos_Aires': 'AR',
      'America/Mexico_City': 'MX',
      'Asia/Tokyo': 'JP',
      'Asia/Seoul': 'KR',
      'Asia/Shanghai': 'CN',
      'Asia/Riyadh': 'SA',
      'Asia/Kolkata': 'IN',
      'Australia/Sydney': 'AU',
      'Australia/Melbourne': 'AU',
    };
    
    detectedCountryCode = timezoneCountryMap[timezone] || 'GB';
    return detectedCountryCode;
  } catch {
    detectedCountryCode = 'GB';
    return 'GB';
  }
}

// Hook to get user's country code
export function useUserCountry() {
  const [countryCode, setCountryCode] = useState<string>('GB');
  
  useEffect(() => {
    detectUserCountry().then(setCountryCode);
  }, []);
  
  return countryCode;
}

// Sport priority constants
const SPORT_PRIORITY: Record<number, number> = {
  1: 0,   // Football - highest priority
  2: 1,   // Basketball
  3: 2,   // Tennis
  4: 3,   // Cricket
  5: 4,   // American Football
  6: 5,   // Baseball
  7: 6,   // Ice Hockey
  8: 7,   // Rugby
  27: 8,  // MMA
  26: 9,  // Boxing
  29: 10, // Formula 1
  33: 11, // Esports
};

// API response type
interface MatchesAPIResponse {
  matches: Match[];
  stats: {
    total: number;
    live: number;
    today: number;
    upcoming: number;
  };
  timestamp: string;
}

// Fetcher for API calls
const matchesFetcher = async (url: string): Promise<Match[]> => {
  const res = await fetch(url);
  if (!res.ok) {
    console.error('[v0] Failed to fetch matches:', res.status);
    throw new Error('Failed to fetch matches');
  }
  const data: MatchesAPIResponse = await res.json();
  // API returns { matches, stats }, we extract just matches
  return data.matches || [];
};

// Sort matches: Sport priority > League > Live status > Time
function sortMatchesWithPriority(matches: Match[], countryCode?: string): Match[] {
  return [...matches].sort((a, b) => {
    // 1. Sport priority (Football first)
    const sportPriorityA = SPORT_PRIORITY[a.sportId] ?? 99;
    const sportPriorityB = SPORT_PRIORITY[b.sportId] ?? 99;
    if (sportPriorityA !== sportPriorityB) return sportPriorityA - sportPriorityB;
    
    // 2. League tier (lower tier = higher priority)
    const leagueTierA = a.league?.tier ?? 99;
    const leagueTierB = b.league?.tier ?? 99;
    if (leagueTierA !== leagueTierB) return leagueTierA - leagueTierB;
    
    // 3. Live matches first
    const statusOrder: Record<string, number> = { live: 0, halftime: 1, scheduled: 2, finished: 3, postponed: 4 };
    const statusOrderA = statusOrder[a.status] ?? 5;
    const statusOrderB = statusOrder[b.status] ?? 5;
    if (statusOrderA !== statusOrderB) return statusOrderA - statusOrderB;
    
    // 4. Sort by kickoff time
    return new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime();
  });
}

// Filter helper functions
function getLiveMatches(matches: Match[]): Match[] {
  return matches
    .filter(m => m.status === 'live' || m.status === 'halftime')
    .sort((a, b) => {
      const sportPriorityA = SPORT_PRIORITY[a.sportId] ?? 99;
      const sportPriorityB = SPORT_PRIORITY[b.sportId] ?? 99;
      if (sportPriorityA !== sportPriorityB) return sportPriorityA - sportPriorityB;
      return (b.minute || 0) - (a.minute || 0);
    });
}

function getTodayMatches(matches: Match[]): Match[] {
  const today = new Date().toDateString();
  return matches
    .filter(m => new Date(m.kickoffTime).toDateString() === today)
    .sort((a, b) => {
      const statusOrder: Record<string, number> = { live: 0, halftime: 1, scheduled: 2, finished: 3, postponed: 4 };
      const statusOrderA = statusOrder[a.status] ?? 5;
      const statusOrderB = statusOrder[b.status] ?? 5;
      if (statusOrderA !== statusOrderB) return statusOrderA - statusOrderB;
      return new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime();
    });
}

function getUpcomingMatches(matches: Match[]): Match[] {
  const now = new Date();
  return matches
    .filter(m => m.status === 'scheduled' && new Date(m.kickoffTime) > now)
    .sort((a, b) => new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime());
}

function getFinishedMatches(matches: Match[]): Match[] {
  return matches
    .filter(m => m.status === 'finished')
    .sort((a, b) => new Date(b.kickoffTime).getTime() - new Date(a.kickoffTime).getTime());
}

export interface MatchFilters {
  sportId?: number;
  leagueId?: number;
  status?: string;
}

// Main hook for all matches - FETCHES FROM REAL API
export function useMatches(filters?: MatchFilters) {
  const countryCode = useUserCountry();
  
  // Build query params
  const params = new URLSearchParams();
  if (filters?.sportId) params.set('sportId', filters.sportId.toString());
  if (filters?.leagueId) params.set('leagueId', filters.leagueId.toString());
  if (filters?.status) params.set('status', filters.status);
  
  const queryString = params.toString();
  const url = `/api/matches${queryString ? `?${queryString}` : ''}`;
  
  const { data, error, isLoading, mutate } = useSWR<Match[]>(
    url,
    matchesFetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  const matches = data || [];
  const sortedMatches = sortMatchesWithPriority(matches, countryCode);

  return {
    matches: sortedMatches,
    allMatches: matches,
    userCountryCode: countryCode,
    isLoading,
    error,
    mutate,
  };
}

// Hook for live matches only
export function useLiveMatches() {
  const { data, error, isLoading } = useSWR<Match[]>(
    '/api/matches?status=live',
    matchesFetcher,
    {
      refreshInterval: 10000, // Refresh every 10 seconds for live
      revalidateOnFocus: true,
    }
  );

  return {
    matches: data ? getLiveMatches(data) : [],
    isLoading,
    error,
  };
}

// Hook for today's matches
export function useTodayMatches() {
  const { data, error, isLoading } = useSWR<Match[]>(
    '/api/matches',
    matchesFetcher,
    {
      refreshInterval: 30000,
    }
  );

  return {
    matches: data ? getTodayMatches(data) : [],
    isLoading,
    error,
  };
}

// Hook for upcoming matches
export function useUpcomingMatches(limit?: number) {
  const { data, error, isLoading } = useSWR<Match[]>(
    '/api/matches?status=scheduled',
    matchesFetcher,
    {
      refreshInterval: 60000,
    }
  );

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
  const { data, error, isLoading } = useSWR<Match[]>(
    '/api/matches?status=finished',
    matchesFetcher,
    {
      refreshInterval: 60000,
    }
  );

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
  const { data, error, isLoading } = useSWR<Match[]>(
    '/api/matches',
    matchesFetcher,
    {
      refreshInterval: 10000,
    }
  );

  const match = data?.find(m => m.id === matchId);

  return {
    match,
    isLoading,
    error,
  };
}

// Group matches by league
export function groupMatchesByLeague(matches: Match[]): Record<string, Match[]> {
  const groups: Record<string, Match[]> = {};
  
  const sortedMatches = [...matches].sort((a, b) => {
    const sportPriorityA = SPORT_PRIORITY[a.sportId] ?? 99;
    const sportPriorityB = SPORT_PRIORITY[b.sportId] ?? 99;
    return sportPriorityA - sportPriorityB;
  });
  
  sortedMatches.forEach(match => {
    const key = `${match.sport.name} - ${match.league.name}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(match);
  });
  
  return groups;
}

// Group matches by sport
export function groupMatchesBySport(matches: Match[]): Record<string, Match[]> {
  const groups: Record<string, Match[]> = {};
  
  matches.forEach(match => {
    const sportName = match.sport.name;
    if (!groups[sportName]) groups[sportName] = [];
    groups[sportName].push(match);
  });
  
  // Sort by sport priority
  const sortedGroups: Record<string, Match[]> = {};
  Object.entries(groups)
    .sort(([, matchesA], [, matchesB]) => {
      const priorityA = SPORT_PRIORITY[matchesA[0]?.sportId] ?? 99;
      const priorityB = SPORT_PRIORITY[matchesB[0]?.sportId] ?? 99;
      return priorityA - priorityB;
    })
    .forEach(([key, value]) => {
      sortedGroups[key] = value;
    });
  
  return sortedGroups;
}

// Hook for matches grouped by league
export function useMatchesByLeague(sportId?: number) {
  const params = sportId ? `?sportId=${sportId}` : '';
  
  const { data, error, isLoading } = useSWR<Match[]>(
    `/api/matches${params}`,
    matchesFetcher,
    {
      refreshInterval: 30000,
    }
  );

  return {
    groups: groupMatchesByLeague(data || []),
    isLoading,
    error,
  };
}

// Hook for matches grouped by sport
export function useMatchesBySport() {
  const { data, error, isLoading } = useSWR<Match[]>(
    '/api/matches',
    matchesFetcher,
    {
      refreshInterval: 30000,
    }
  );

  return {
    groups: groupMatchesBySport(data || []),
    isLoading,
    error,
  };
}

// Stats hook
export function useMatchStats() {
  const { data, isLoading } = useSWR<Match[]>(
    '/api/matches',
    matchesFetcher,
    {
      refreshInterval: 30000,
    }
  );

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
