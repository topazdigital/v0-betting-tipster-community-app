"use client"

import { use } from "react"
import Link from "next/link"
import Image from "next/image"
import useSWR from "swr"
import {
  ArrowLeft, Trophy, Calendar, TrendingUp,
  ChevronRight, Clock, Star, Target, Loader2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarNew } from "@/components/layout/sidebar-new"
import { MatchCardNew } from "@/components/matches/match-card-new"
import { KnockoutBracket } from "@/components/leagues/knockout-bracket"
import { Spinner } from "@/components/ui/spinner"
import { TeamLogo } from "@/components/ui/team-logo"
import { FlagIcon } from "@/components/ui/flag-icon"
import { cn } from "@/lib/utils"
import { ALL_LEAGUES, getSportIcon } from "@/lib/sports-data"
import { playerHref } from "@/lib/utils/slug"
import { resolveLeagueSlug } from "@/lib/league-aliases"
import { useMatches } from "@/lib/hooks/use-matches"

interface PageProps {
  params: Promise<{ slug: string }>
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface StandingRow {
  position: number
  team: { id: string; name: string; logo?: string; href?: string | null }
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

interface OutrightOutcome { name: string; price: number }
interface OutrightMarket { id: string; name: string; outcomes: OutrightOutcome[] }

interface ScorerRow {
  position: number
  player: { id: string; name: string; photo?: string; position?: string }
  team: { id?: string; name: string; logo?: string }
  stats: { goals: number }
}

const SPORT_ICON_BY_ID: Record<number, string> = {
  1: 'football', 2: 'basketball', 3: 'tennis',
  5: 'american-football', 6: 'baseball', 7: 'ice-hockey',
  27: 'mma',
}

function EmptyState({ icon: Icon, title, hint }: { icon: any; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center">
      <Icon className="h-6 w-6 text-muted-foreground/60" />
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function LoadingBox() {
  return (
    <div className="flex h-24 items-center justify-center text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  )
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function titleCase(s: string) {
  return s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function LeaguePage({ params }: PageProps) {
  const { slug } = use(params)

  // Accept both friendly slugs (premier-league) and ESPN-style codes (eng-1,
  // ken-1, usa-1, …) so older links from the matches page keep working.
  const normalisedSlug = resolveLeagueSlug(slug) || slug
  const knownLeague = ALL_LEAGUES.find(l => l.slug === normalisedSlug)

  // Live matches feed — when we don't have a known league id, fetch ALL
  // matches and filter client-side by slugified league name.
  const { matches: allMatches, isLoading: matchesLoading } = useMatches(
    knownLeague ? { leagueId: knownLeague.id } : undefined
  )

  // Filter matches when no known league: match by slug derived from name.
  const matches = knownLeague
    ? allMatches
    : allMatches.filter(m => {
        const ms = (m.league?.slug || slugify(m.league?.name || '')).toLowerCase()
        return ms === normalisedSlug || ms === slug.toLowerCase()
      })

  // Build a synthetic league header from the first match (or the slug) when
  // the league isn't in our static list — fixes "League not found" for the
  // long tail of small competitions.
  const firstMatch = matches[0]
  const league = knownLeague || (firstMatch ? {
    id: firstMatch.leagueId,
    name: firstMatch.league?.name || titleCase(normalisedSlug),
    slug: normalisedSlug,
    country: firstMatch.league?.country || '',
    countryCode: firstMatch.league?.countryCode || 'WO',
    sportId: firstMatch.sportId || 1,
    tier: firstMatch.league?.tier ?? 1,
  } : null)

  // Real backend data
  const { data: standingsRes, isLoading: standingsLoading } = useSWR<{ success: boolean; data: StandingRow[] }>(
    league ? `/api/leagues/${league.id}/standings` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 5 * 60_000 },
  )
  const { data: outrightsRes, isLoading: outrightsLoading } = useSWR<{ success: boolean; data: OutrightMarket[] }>(
    league ? `/api/leagues/${league.id}/outrights` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 5 * 60_000 },
  )
  const { data: scorersRes, isLoading: scorersLoading } = useSWR<{ scorers: ScorerRow[] }>(
    league ? `/api/leagues/${league.id}/scorers` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 5 * 60_000 },
  )

  if (!league) {
    // Still loading? Show spinner instead of "not found".
    if (matchesLoading) {
      return (
        <div className="flex">
          <SidebarNew />
          <div className="flex-1 flex h-96 items-center justify-center">
            <Spinner className="h-8 w-8" />
          </div>
        </div>
      )
    }

    // No matches and unknown slug — show a soft empty state.
    return (
      <div className="flex">
        <SidebarNew />
        <div className="flex-1 p-8 text-center">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground/60" />
          <h1 className="mt-4 text-2xl font-bold">{titleCase(normalisedSlug)}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            No matches scheduled or available for this competition right now.
          </p>
          <Button asChild className="mt-4">
            <Link href="/matches">Browse all matches</Link>
          </Button>
        </div>
      </div>
    )
  }

  const standings = standingsRes?.data ?? []
  const outrightMarket = outrightsRes?.data?.[0]
  const scorers = scorersRes?.scorers ?? []

  const liveMatches = matches.filter(m => m.status === 'live' || m.status === 'halftime')
  const upcomingMatches = matches.filter(m => m.status === 'scheduled')
    .sort((a, b) => new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime())
  const finishedMatches = matches.filter(m => m.status === 'finished')
    .sort((a, b) => new Date(b.kickoffTime).getTime() - new Date(a.kickoffTime).getTime())

  const sportIcon = getSportIcon(SPORT_ICON_BY_ID[league.sportId] || 'football')

  return (
    <div className="flex">
      <SidebarNew />

      <div className="flex-1 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-4">
          {/* Back Button */}
          <Button variant="ghost" size="sm" className="mb-3" asChild>
            <Link href="/matches">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Matches
            </Link>
          </Button>

          {/* League Header */}
          <Card className="mb-4 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-transparent p-5">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-card text-3xl">
                  {sportIcon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <FlagIcon countryCode={league.countryCode} size="md" />
                    <h1 className="truncate text-xl font-bold sm:text-2xl">{league.name}</h1>
                  </div>
                  <p className="text-sm text-muted-foreground">{league.country}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    Season 2025/26
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    {matches.length} matches
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Trophy className="h-3 w-3" />
                    {standings.length} teams
                  </Badge>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-card p-3 text-center">
                  <div className="text-2xl font-bold text-live">{liveMatches.length}</div>
                  <div className="text-xs text-muted-foreground">Live Now</div>
                </div>
                <div className="rounded-lg bg-card p-3 text-center">
                  <div className="text-2xl font-bold text-primary">{upcomingMatches.length}</div>
                  <div className="text-xs text-muted-foreground">Upcoming</div>
                </div>
                <div className="rounded-lg bg-card p-3 text-center">
                  <div className="text-2xl font-bold">{finishedMatches.length}</div>
                  <div className="text-xs text-muted-foreground">Played</div>
                </div>
                <div className="rounded-lg bg-card p-3 text-center">
                  <div className="text-2xl font-bold text-warning">
                    {outrightMarket?.outcomes.length ?? 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Outright runners</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Knockout bracket — silently renders nothing for league-format
              competitions, so we can include it unconditionally. */}
          <div className="mb-4">
            <KnockoutBracket leagueId={league.id} />
          </div>

          {/* Two-column layout: matches main, sidebar with standings/outrights/scorers */}
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            {/* ── Main column: matches + standings table ─────────── */}
            <div className="min-w-0 space-y-4">
              {matchesLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Spinner className="h-8 w-8" />
                </div>
              ) : (
                <>
                  {/* Live */}
                  {liveMatches.length > 0 && (
                    <section>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75"></span>
                          <span className="relative inline-flex h-3 w-3 rounded-full bg-live"></span>
                        </span>
                        <h2 className="text-base font-semibold">Live Now</h2>
                        <Badge variant="destructive">{liveMatches.length}</Badge>
                      </div>
                      <div className="space-y-1.5">
                        {liveMatches.map(match => (
                          <MatchCardNew key={match.id} match={match} variant="compact" showLeague={false} />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Upcoming */}
                  {upcomingMatches.length > 0 && (
                    <section>
                      <div className="mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <h2 className="text-base font-semibold">Upcoming</h2>
                        <Badge variant="secondary">{upcomingMatches.length}</Badge>
                      </div>
                      <div className="space-y-1.5">
                        {upcomingMatches.slice(0, 12).map(match => (
                          <MatchCardNew key={match.id} match={match} variant="compact" showLeague={false} />
                        ))}
                      </div>
                      {upcomingMatches.length > 12 && (
                        <Button variant="ghost" className="mt-2 w-full" asChild>
                          <Link href={`/matches?league=${league.slug}`}>
                            View all {upcomingMatches.length} matches
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </section>
                  )}

                  {/* Recent Results */}
                  {finishedMatches.length > 0 && (
                    <section>
                      <div className="mb-2 flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-success" />
                        <h2 className="text-base font-semibold">Recent Results</h2>
                      </div>
                      <div className="space-y-1.5">
                        {finishedMatches.slice(0, 8).map(match => (
                          <MatchCardNew key={match.id} match={match} variant="compact" showLeague={false} />
                        ))}
                      </div>
                    </section>
                  )}

                  {liveMatches.length + upcomingMatches.length + finishedMatches.length === 0 && (
                    <EmptyState icon={Calendar} title="No matches scheduled" hint="Check back when the new round begins." />
                  )}
                </>
              )}

              {/* Full standings table */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Trophy className="h-4 w-4 text-warning" />
                    League Table
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {standingsLoading ? (
                    <LoadingBox />
                  ) : standings.length === 0 ? (
                    <EmptyState
                      icon={AlertCircle}
                      title="No standings available"
                      hint="ESPN doesn't publish a table for this competition (cup format or off-season)."
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground">
                            <th className="pb-2 pr-2 text-left font-medium">#</th>
                            <th className="pb-2 text-left font-medium">Team</th>
                            <th className="pb-2 text-center font-medium">P</th>
                            <th className="pb-2 text-center font-medium">W</th>
                            <th className="pb-2 text-center font-medium">D</th>
                            <th className="pb-2 text-center font-medium">L</th>
                            <th className="pb-2 text-center font-medium">GF</th>
                            <th className="pb-2 text-center font-medium">GA</th>
                            <th className="pb-2 text-center font-medium">GD</th>
                            <th className="pb-2 pl-2 text-center font-medium">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {standings.map((row) => (
                            <tr
                              key={row.team.id}
                              className={cn(
                                "border-b transition-colors hover:bg-muted/50",
                                row.position <= 4 && "bg-success/5",
                                row.position >= standings.length - 2 && "bg-destructive/5"
                              )}
                            >
                              <td className="py-2 pr-2">
                                <span className={cn(
                                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                                  row.position <= 4 && "bg-success text-success-foreground",
                                  row.position >= standings.length - 2 && "bg-destructive text-destructive-foreground"
                                )}>
                                  {row.position}
                                </span>
                              </td>
                              <td className="py-2">
                                {row.team.href ? (
                                  <Link
                                    href={row.team.href}
                                    className="group flex items-center gap-2 hover:text-primary"
                                  >
                                    <TeamLogo teamName={row.team.name} logoUrl={row.team.logo} size="xs" />
                                    <span className="truncate font-medium group-hover:underline">{row.team.name}</span>
                                  </Link>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <TeamLogo teamName={row.team.name} logoUrl={row.team.logo} size="xs" />
                                    <span className="truncate font-medium">{row.team.name}</span>
                                  </div>
                                )}
                              </td>
                              <td className="py-2 text-center">{row.played}</td>
                              <td className="py-2 text-center text-success">{row.won}</td>
                              <td className="py-2 text-center">{row.drawn}</td>
                              <td className="py-2 text-center text-destructive">{row.lost}</td>
                              <td className="py-2 text-center">{row.goalsFor}</td>
                              <td className="py-2 text-center">{row.goalsAgainst}</td>
                              <td className="py-2 text-center font-medium">
                                <span className={row.goalDifference > 0 ? "text-success" : row.goalDifference < 0 ? "text-destructive" : ""}>
                                  {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                                </span>
                              </td>
                              <td className="py-2 pl-2 text-center font-bold">{row.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Right sidebar: outrights + scorers ─────────────── */}
            <aside className="space-y-4">
              {/* Outrights */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-warning" />
                    Outright Winner
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Best price across UK / EU / US sportsbooks
                  </p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {outrightsLoading ? (
                    <LoadingBox />
                  ) : !outrightMarket || outrightMarket.outcomes.length === 0 ? (
                    <EmptyState
                      icon={Target}
                      title="No outright market open"
                      hint="Bookmakers haven't priced this season yet."
                    />
                  ) : (
                    outrightMarket.outcomes.slice(0, 12).map((o, idx) => (
                      <div
                        key={`${o.name}-${idx}`}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2 text-sm",
                          idx === 0 ? "bg-warning/10" : "bg-muted/40"
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                            idx === 0 && "bg-warning text-warning-foreground",
                            idx === 1 && "bg-gray-300 text-gray-700",
                            idx === 2 && "bg-amber-700 text-amber-100",
                            idx > 2 && "bg-muted"
                          )}>
                            {idx + 1}
                          </span>
                          <span className="truncate">{o.name}</span>
                          {idx === 0 && (
                            <Star className="h-3 w-3 shrink-0 text-warning" />
                          )}
                        </div>
                        <span className="ml-2 shrink-0 font-mono font-bold text-success">
                          {o.price.toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Top Scorers */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Top Scorers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scorersLoading ? (
                    <LoadingBox />
                  ) : scorers.length === 0 ? (
                    <EmptyState
                      icon={TrendingUp}
                      title="No top scorers data"
                      hint="ESPN hasn't published leaders for this competition."
                    />
                  ) : (
                    <ol className="space-y-2">
                      {scorers.slice(0, 10).map((s) => {
                        const hasId = !!s.player.id;
                        const Wrapper: React.ElementType = hasId ? Link : 'div';
                        const wrapperProps = hasId ? { href: playerHref(s.player.name, s.player.id) } : {};
                        return (
                        <li key={`${s.position}-${s.player.id}`}>
                          <Wrapper
                            {...wrapperProps}
                            className={cn(
                              "flex items-center gap-3 rounded-lg bg-muted/30 p-2",
                              hasId && "transition-colors hover:bg-primary/10"
                            )}
                          >
                          <span className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                            s.position === 1 && "bg-yellow-500 text-yellow-950",
                            s.position === 2 && "bg-gray-300 text-gray-700",
                            s.position === 3 && "bg-amber-700 text-amber-100",
                            s.position > 3 && "bg-muted"
                          )}>
                            {s.position}
                          </span>
                          {/* Headshot — falls back to initial when ESPN omits a photo. */}
                          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
                            {s.player.photo ? (
                              <Image
                                src={s.player.photo}
                                alt={s.player.name}
                                fill
                                sizes="32px"
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-muted-foreground">
                                {s.player.name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={cn(
                              "truncate text-sm font-semibold",
                              hasId && "group-hover:text-primary"
                            )}>{s.player.name}</p>
                            <p className="truncate text-[11px] text-muted-foreground">{s.team.name}</p>
                          </div>
                          <span className="shrink-0 font-mono text-sm font-bold text-success">
                            {s.stats.goals}
                          </span>
                          </Wrapper>
                        </li>
                      );})}
                    </ol>
                  )}
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
