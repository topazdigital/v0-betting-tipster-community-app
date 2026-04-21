'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { MatchCardNew } from '@/components/matches/match-card-new';
import { LiveIndicator } from '@/components/matches/live-indicator';
import { Spinner } from '@/components/ui/spinner';
import { useLiveMatches } from '@/lib/hooks/use-matches';

export function LiveMatchesSection() {
  const { matches: liveMatches, isLoading } = useLiveMatches();

  if (isLoading) {
    return (
      <section className="mb-8">
        <div className="flex h-32 items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      </section>
    );
  }

  if (liveMatches.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LiveIndicator />
          <h2 className="text-lg font-semibold text-foreground">Live Now</h2>
          <span className="rounded-full bg-live/10 px-2 py-0.5 text-xs font-medium text-live">
            {liveMatches.length}
          </span>
        </div>
        <Link
          href="/matches?status=live"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          View all
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {liveMatches.map((match) => (
          <div key={match.id} className="w-72 shrink-0">
            <MatchCardNew match={match} showSport />
          </div>
        ))}
      </div>
    </section>
  );
}
