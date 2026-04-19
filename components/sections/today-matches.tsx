'use client';

import { Calendar } from 'lucide-react';
import { MatchList } from '@/components/matches/match-list';
import { mockMatches } from '@/lib/mock-data';

export function TodayMatchesSection() {
  const todayMatches = mockMatches.filter((m) => {
    const kickoff = new Date(m.kickoff_time);
    const today = new Date();
    return (
      kickoff.toDateString() === today.toDateString() &&
      m.status === 'scheduled'
    );
  });

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center gap-3">
        <Calendar className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Today&apos;s Matches</h2>
      </div>

      {todayMatches.length > 0 ? (
        <MatchList title="Today" matches={todayMatches} />
      ) : (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">No scheduled matches for today</p>
        </div>
      )}
    </section>
  );
}
