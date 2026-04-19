'use client';

import useSWR from 'swr';
import { useState, useEffect } from 'react';
import { 
  generateAllMatches, 
  getLiveMatches, 
  getTodayMatches, 
  getUpcomingMatches,
  getFinishedMatches,
  filterMatches,
  groupMatchesByLeague,
  groupMatchesBySport,
  sortMatchesWithPriority,
  type Match,
  type MatchFilters
} from '@/lib/api/sports-api';

// Cache for matches - regenerate every 30 seconds to simulate live updates
let matchesCache: Match[] | null = null;
let lastGenerated = 0;
const CACHE_DURATION = 30000; // 30 seconds

// User's detected country code
let detectedCountryCode: string | null = null;

// Detect user's country from browser
async function detectUserCountry(): Promise<string> {
  if (detectedCountryCode) return detectedCountryCode;
  
  try {
    // Try to get from browser's timezone or locale
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const locale = navigator.language || 'en-US';
    
    // Common timezone to country mappings
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
    
    detectedCountryCode = timezoneCountryMap[timezone] || 'GB'; // Default to GB
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

function getMatches(userCountryCode?: string): Match[] {
  const now = Date.now();
  if (!matchesCache || now - lastGenerated > CACHE_DURATION) {
    matchesCache = generateAllMatches(userCountryCode);
    lastGenerated = now;
  }
  return matchesCache;
}

// Fetcher function with country code
const createMatchesFetcher = (countryCode: string) => async (): Promise<Match[]> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return getMatches(countryCode);
};

// Main hook for all matches with geo-prioritization
export function useMatches(filters?: MatchFilters) {
  const countryCode = useUserCountry();
  
  const { data, error, isLoading, mutate } = useSWR(
    ['matches', countryCode],
    () => createMatchesFetcher(countryCode)(),
    {
      refreshInterval: 30000,
      revalidateOnFocus: false,
    }
  );

  const matches = data || [];
  
  // Apply filters and maintain sort order
  const filteredMatches = filters 
    ? filterMatches(matches, { ...filters, userCountryCode: countryCode })
    : sortMatchesWithPriority(matches, countryCode);

  return {
    matches: filteredMatches,
    allMatches: matches,
    userCountryCode: countryCode,
    isLoading,
    error,
    mutate,
  };
}

// Hook for live matches only
export function useLiveMatches() {
  const countryCode = useUserCountry();
  
  const { data, error, isLoading } = useSWR(
    ['matches', countryCode],
    () => createMatchesFetcher(countryCode)(),
    {
      refreshInterval: 10000, // Refresh more frequently for live
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
  const countryCode = useUserCountry();
  
  const { data, error, isLoading } = useSWR(
    ['matches', countryCode],
    () => createMatchesFetcher(countryCode)(),
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

// Hook for upcoming matches (sorted by time - soonest first)
export function useUpcomingMatches(limit?: number) {
  const countryCode = useUserCountry();
  
  const { data, error, isLoading } = useSWR(
    ['matches', countryCode],
    () => createMatchesFetcher(countryCode)(),
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
  const countryCode = useUserCountry();
  
  const { data, error, isLoading } = useSWR(
    ['matches', countryCode],
    () => createMatchesFetcher(countryCode)(),
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
  const countryCode = useUserCountry();
  
  const { data, error, isLoading } = useSWR(
    ['matches', countryCode],
    () => createMatchesFetcher(countryCode)(),
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

// Hook for matches grouped by league (with sport priority - football first)
export function useMatchesByLeague(sportId?: number) {
  const countryCode = useUserCountry();
  
  const { data, error, isLoading } = useSWR(
    ['matches', countryCode],
    () => createMatchesFetcher(countryCode)(),
    {
      refreshInterval: 30000,
    }
  );

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

// Hook for matches grouped by sport (football first)
export function useMatchesBySport() {
  const countryCode = useUserCountry();
  
  const { data, error, isLoading } = useSWR(
    ['matches', countryCode],
    () => createMatchesFetcher(countryCode)(),
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
  const countryCode = useUserCountry();
  
  const { data, isLoading } = useSWR(
    ['matches', countryCode],
    () => createMatchesFetcher(countryCode)(),
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
