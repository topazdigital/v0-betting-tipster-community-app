'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { SidebarNew } from '@/components/layout/sidebar-new';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamLogo } from '@/components/ui/team-logo';
import { Loader2, BarChart3, Trophy, Goal } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const FEATURED_LEAGUES: Array<{ id: number; name: string; slug: string }> = [
  { id: 1, name: 'Premier League', slug: 'premier-league' },
  { id: 2, name: 'La Liga', slug: 'la-liga' },
  { id: 3, name: 'Bundesliga', slug: 'bundesliga' },
  { id: 4, name: 'Serie A', slug: 'serie-a' },
  { id: 5, name: 'Ligue 1', slug: 'ligue-1' },
  { id: 9, name: 'Champions League', slug: 'champions-league' },
];

interface StandingRow {
  id?: string;
  team?: { id?: string; name?: string; abbreviation?: string };
  position?: number;
  points?: number;
  played?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  goalDifference?: number;
  logo?: string;
}

interface ScorerRow {
  rank?: number;
  athlete?: { id?: string; displayName?: string; shortName?: string; headshot?: string };
  team?: { id?: string; displayName?: string; logo?: string };
  value?: number;
  category?: string;
}

function StandingsTable({ leagueId, leagueSlug }: { leagueId: number; leagueSlug: string }) {
  const { data, isLoading } = useSWR<{ data: StandingRow[] }>(
    `/api/leagues/${leagueId}/standings`, fetcher, { revalidateOnFocus: false, dedupingInterval: 5 * 60_000 },
  );
  const rows = data?.data?.slice(0, 10) ?? [];
  if (isLoading) return <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">No standings available right now.</p>;
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">#</th>
            <th className="px-3 py-2 text-left">Team</th>
            <th className="px-2 py-2 text-center">P</th>
            <th className="px-2 py-2 text-center">W</th>
            <th className="px-2 py-2 text-center">D</th>
            <th className="px-2 py-2 text-center">L</th>
            <th className="px-2 py-2 text-center">GD</th>
            <th className="px-3 py-2 text-right">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id || i} className="border-t border-border hover:bg-muted/20">
              <td className="px-3 py-2 text-muted-foreground">{r.position ?? i + 1}</td>
              <td className="px-3 py-2">
                <Link href={`/leagues/${leagueSlug}`} className="flex items-center gap-2 hover:text-primary">
                  {r.logo && <TeamLogo teamName={r.team?.name || ''} logoUrl={r.logo} size="sm" />}
                  <span className="font-medium">{r.team?.name || r.team?.abbreviation || '—'}</span>
                </Link>
              </td>
              <td className="px-2 py-2 text-center">{r.played ?? '-'}</td>
              <td className="px-2 py-2 text-center">{r.wins ?? '-'}</td>
              <td className="px-2 py-2 text-center">{r.draws ?? '-'}</td>
              <td className="px-2 py-2 text-center">{r.losses ?? '-'}</td>
              <td className="px-2 py-2 text-center">{r.goalDifference ?? '-'}</td>
              <td className="px-3 py-2 text-right font-bold">{r.points ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScorersTable({ leagueId }: { leagueId: number }) {
  const { data, isLoading } = useSWR<{ scorers: ScorerRow[] }>(
    `/api/leagues/${leagueId}/scorers`, fetcher, { revalidateOnFocus: false, dedupingInterval: 5 * 60_000 },
  );
  const rows = data?.scorers?.slice(0, 10) ?? [];
  if (isLoading) return <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">No top scorers data available.</p>;
  return (
    <div className="space-y-2">
      {rows.map((s, i) => (
        <div key={s.athlete?.id || i} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 hover:bg-muted/30">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-6 text-center text-xs font-bold text-muted-foreground">{s.rank ?? i + 1}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{s.athlete?.displayName || s.athlete?.shortName || '—'}</p>
              <p className="truncate text-xs text-muted-foreground">{s.team?.displayName || ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-amber-500">
            <Goal className="h-4 w-4" />
            <span className="font-bold">{s.value ?? '-'}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StatsPage() {
  return (
    <div className="flex">
      <SidebarNew />
      <div className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-8">
          <header className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Statistics</h1>
              <p className="text-sm text-muted-foreground">Standings and top scorers across the world's biggest leagues.</p>
            </div>
          </header>

          <Tabs defaultValue={String(FEATURED_LEAGUES[0].id)} className="w-full">
            <TabsList className="flex w-full flex-wrap gap-1 bg-transparent p-0">
              {FEATURED_LEAGUES.map(l => (
                <TabsTrigger key={l.id} value={String(l.id)} className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  {l.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {FEATURED_LEAGUES.map(l => (
              <TabsContent key={l.id} value={String(l.id)} className="mt-4">
                <div className="grid gap-4 lg:grid-cols-3">
                  <Card className="lg:col-span-2">
                    <CardHeader className="flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Trophy className="h-4 w-4 text-amber-500" />
                        {l.name} Standings
                      </CardTitle>
                      <Link href={`/leagues/${l.slug}`} className="text-xs text-primary hover:underline">View league →</Link>
                    </CardHeader>
                    <CardContent>
                      <StandingsTable leagueId={l.id} leagueSlug={l.slug} />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Goal className="h-4 w-4 text-emerald-500" />
                        Top Scorers
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScorersTable leagueId={l.id} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
