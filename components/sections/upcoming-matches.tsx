'use client';

import Link from 'next/link';
import { ChevronRight, Clock } from 'lucide-react';
import { MatchCard } from '@/components/matches/match-card';
import { mockMatches } from '@/lib/mock-data';

export function UpcomingMatchesSection() {
  const upcomingMatches = mockMatches
    .filter((m) => {
      const kickoff = new Date(m.kickoff_time);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return (
        kickoff > today &&
        kickoff.toDateString() !== today.toDateString() &&
        m.status === 'scheduled'
      );
    })
    .slice(0, 6);

  if (upcomingMatches.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Upcoming</h2>
        </div>
        <Link
          href="/matches"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          View all
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {upcomingMatches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            odds={{
              home: 1.5 + Math.random() * 2,
              draw: 2.5 + Math.random() * 1.5,
              away: 2 + Math.random() * 3,
            }}
          />
        ))}
      </div>
    </section>
  );
}
