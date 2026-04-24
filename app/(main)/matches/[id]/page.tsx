"use client"

import { useState, use } from "react"
import Link from "next/link"
import Image from "next/image"
import useSWR from "swr"
import {
  ArrowLeft, Clock, Radio, Share2, Bookmark, CheckCircle2,
  Trophy, BarChart3, Shirt, Newspaper, MapPin, Tv,
  TrendingUp, Award,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { TeamLogo } from "@/components/ui/team-logo"
import { cn } from "@/lib/utils"
import { formatTime, formatDate, getBrowserTimezone, getDayLabel } from "@/lib/utils/timezone"

interface PageProps { params: Promise<{ id: string }> }

interface Player {
  name: string
  fullName?: string
  position?: string
  jersey?: string
  starter: boolean
  headshot?: string
}
interface TeamRoster {
  teamId?: string
  teamName?: string
  teamLogo?: string
  formation?: string
  coach?: string
  starting: Player[]
  bench: Player[]
}
interface Lineups { home: TeamRoster | null; away: TeamRoster | null }
interface BookmakerOdd {
  bookmaker: string
  home: number
  draw?: number
  away: number
  spread?: { value: number; homePrice: number; awayPrice: number }
  total?: { value: number; overPrice: number; underPrice: number }
}
interface H2HGame {
  date: string
  league?: string
  home: { name: string; logo?: string; score?: number }
  away: { name: string; logo?: string; score?: number }
}
interface StandingRow {
  teamId?: string
  teamName?: string
  teamLogo?: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor?: number
  goalsAgainst?: number
  goalDifference?: number
  points: number
  position?: number
}
interface StandingsGroup { header?: string; rows: StandingRow[] }
interface NewsItem {
  headline?: string
  description?: string
  published?: string
  image?: string
  link?: string
}
interface LeaderItem {
  team?: string
  category?: string
  athlete?: string
  headshot?: string
  value?: string
}
interface MatchDetails {
  match: {
    id: string
    homeTeam: { name: string; logo?: string; form?: string; record?: string }
    awayTeam: { name: string; logo?: string; form?: string; record?: string }
    kickoffTime: string
    status: string
    homeScore: number | null
    awayScore: number | null
    minute?: number
    league: { name: string; country: string; countryCode: string }
    sport: { name: string; slug: string; icon: string }
    odds?: { home: number; draw?: number; away: number; bookmaker?: string }
    venue?: string
    venueCity?: string
    venueCountry?: string
    attendance?: number
    broadcasts?: string[]
  }
  bookmakerOdds: BookmakerOdd[]
  lineups: Lineups | null
  h2h: H2HGame[] | null
  standings: StandingsGroup[] | null
  news: NewsItem[]
  leaders: LeaderItem[]
  hasRealOdds: boolean
  hasLineups: boolean
  hasStandings: boolean
  hasH2H: boolean
}

const fetcher = async (url: string): Promise<MatchDetails> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch match')
  return res.json()
}

const SportEmoji = ({ slug }: { slug?: string }) => {
  const map: Record<string, string> = {
    soccer: '⚽', football: '🏈', basketball: '🏀', tennis: '🎾',
    baseball: '⚾', hockey: '🏒', mma: '🥊', cricket: '🏏',
    rugby: '🏉', golf: '⛳', 'formula-1': '🏎️', racing: '🏎️',
  }
  return <span className="text-lg">{map[slug || ''] || '🏆'}</span>
}

const FormBadge = ({ result }: { result: string }) => {
  const r = result.toUpperCase()
  return (
    <span className={cn(
      "flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold text-white",
      r === 'W' && "bg-emerald-600",
      r === 'D' && "bg-amber-500",
      r === 'L' && "bg-rose-600",
      !['W', 'D', 'L'].includes(r) && "bg-muted-foreground"
    )}>{r}</span>
  )
}

export default function MatchDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const timezone = getBrowserTimezone()
  const [savedMatch, setSavedMatch] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const { data, error, isLoading } = useSWR<MatchDetails>(
    `/api/matches/${encodeURIComponent(id)}/details`,
    fetcher,
    { refreshInterval: 15000 }
  )

  if (isLoading) {
    return (
      <div className="flex h-96 flex-1 items-center justify-center">
        <div className="flex items-center gap-3">
          <Spinner className="h-8 w-8" />
          <span className="text-muted-foreground">Loading match details...</span>
        </div>
      </div>
    )
  }

  if (error || !data?.match) {
    return (
      <div className="flex-1 p-8 text-center">
        <h1 className="text-2xl font-bold">Match not found</h1>
        <p className="mt-2 text-muted-foreground">This match may no longer be available.</p>
        <Button asChild className="mt-4"><Link href="/matches">Back to Matches</Link></Button>
      </div>
    )
  }

  const { match, bookmakerOdds, lineups, h2h, standings, news, leaders, hasRealOdds } = data
  const isLive = match.status === 'live' || match.status === 'halftime' || match.status === 'extra_time' || match.status === 'penalties'
  const isFinished = match.status === 'finished'

  return (
    <div className="flex-1 overflow-hidden">
      <div className="mx-auto max-w-6xl px-3 py-4 pb-24 md:px-6 md:py-6 md:pb-8">
        {/* Back */}
        <Button variant="ghost" size="sm" className="mb-3" asChild>
          <Link href="/matches"><ArrowLeft className="mr-2 h-4 w-4" />Back to Matches</Link>
        </Button>

        {/* HERO HEADER */}
        <Card className="mb-4 overflow-hidden border-0 bg-gradient-to-br from-primary/15 via-primary/5 to-background shadow-lg">
          <div className="border-b border-border/40 px-4 py-3 md:px-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SportEmoji slug={match.sport.slug} />
                <Link href={`/leagues/${match.league.country}`} className="text-sm font-semibold hover:underline">
                  {match.league.name}
                </Link>
                <span className="text-xs text-muted-foreground">• {match.league.country}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {isLive && (
                  <Badge variant="destructive" className="animate-pulse gap-1">
                    <Radio className="h-3 w-3" />LIVE {match.minute ? `${match.minute}'` : ''}
                  </Badge>
                )}
                {match.status === 'scheduled' && (
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {getDayLabel(match.kickoffTime, timezone)} • {formatTime(match.kickoffTime, timezone)}
                  </Badge>
                )}
                {isFinished && (
                  <Badge className="gap-1 bg-emerald-600 text-white">
                    <CheckCircle2 className="h-3 w-3" />FT
                  </Badge>
                )}
                <Button variant="ghost" size="icon" onClick={() => setSavedMatch(!savedMatch)}>
                  <Bookmark className={cn("h-4 w-4", savedMatch && "fill-current")} />
                </Button>
                <Button variant="ghost" size="icon"><Share2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>

          {/* Teams + Score */}
          <div className="px-4 py-6 md:px-6 md:py-8">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-6">
              {/* Home */}
              <div className="flex flex-col items-center text-center">
                <TeamLogo teamName={match.homeTeam.name} logoUrl={match.homeTeam.logo} size="lg" />
                <p className="mt-3 line-clamp-2 text-base font-bold md:text-lg">{match.homeTeam.name}</p>
                {match.homeTeam.record && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{match.homeTeam.record}</p>
                )}
                {match.homeTeam.form && (
                  <div className="mt-2 flex gap-1">
                    {match.homeTeam.form.split('').slice(0, 5).map((r, i) => <FormBadge key={i} result={r} />)}
                  </div>
                )}
              </div>

              {/* Score / Time */}
              <div className="flex flex-col items-center justify-center px-2">
                {(isLive || isFinished) ? (
                  <>
                    <div className="flex items-center gap-3 text-4xl font-bold tabular-nums md:text-6xl">
                      <span className={cn(isLive && "text-primary")}>{match.homeScore ?? 0}</span>
                      <span className="text-muted-foreground">:</span>
                      <span className={cn(isLive && "text-primary")}>{match.awayScore ?? 0}</span>
                    </div>
                    {isLive && match.minute !== undefined && (
                      <p className="mt-2 font-mono text-sm text-rose-600">{match.minute}&apos;</p>
                    )}
                    {isFinished && <p className="mt-2 text-sm text-muted-foreground">Full Time</p>}
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold tabular-nums md:text-4xl">{formatTime(match.kickoffTime, timezone)}</p>
                    <p className="mt-1 text-xs text-muted-foreground md:text-sm">
                      {getDayLabel(match.kickoffTime, timezone)} • {formatDate(match.kickoffTime, timezone)}
                    </p>
                  </>
                )}
              </div>

              {/* Away */}
              <div className="flex flex-col items-center text-center">
                <TeamLogo teamName={match.awayTeam.name} logoUrl={match.awayTeam.logo} size="lg" />
                <p className="mt-3 line-clamp-2 text-base font-bold md:text-lg">{match.awayTeam.name}</p>
                {match.awayTeam.record && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{match.awayTeam.record}</p>
                )}
                {match.awayTeam.form && (
                  <div className="mt-2 flex gap-1">
                    {match.awayTeam.form.split('').slice(0, 5).map((r, i) => <FormBadge key={i} result={r} />)}
                  </div>
                )}
              </div>
            </div>

            {/* Quick odds bar */}
            {match.odds && (
              <div className="mt-6 grid grid-cols-3 gap-2 md:mx-auto md:max-w-xl">
                <div className="rounded-lg bg-muted/60 p-3 text-center transition-colors hover:bg-primary/10">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Home</p>
                  <p className="text-xl font-bold text-primary">{match.odds.home.toFixed(2)}</p>
                </div>
                {match.odds.draw !== undefined ? (
                  <div className="rounded-lg bg-muted/60 p-3 text-center transition-colors hover:bg-primary/10">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Draw</p>
                    <p className="text-xl font-bold text-primary">{match.odds.draw.toFixed(2)}</p>
                  </div>
                ) : <div />}
                <div className="rounded-lg bg-muted/60 p-3 text-center transition-colors hover:bg-primary/10">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Away</p>
                  <p className="text-xl font-bold text-primary">{match.odds.away.toFixed(2)}</p>
                </div>
                {match.odds.bookmaker && (
                  <p className="col-span-3 text-center text-[10px] text-muted-foreground">
                    Odds by {match.odds.bookmaker}
                  </p>
                )}
              </div>
            )}

            {/* Venue/broadcast strip */}
            {(match.venue || match.broadcasts?.length || match.attendance) && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {match.venue && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />{match.venue}
                    {match.venueCity ? `, ${match.venueCity}` : ''}
                  </span>
                )}
                {match.attendance ? (
                  <span>👥 {match.attendance.toLocaleString()} attendance</span>
                ) : null}
                {match.broadcasts && match.broadcasts.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Tv className="h-3 w-3" />{match.broadcasts.slice(0, 3).join(', ')}
                  </span>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* TABS */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
            <TabsTrigger value="overview"><BarChart3 className="mr-1 h-4 w-4 hidden md:inline" />Overview</TabsTrigger>
            <TabsTrigger value="odds"><TrendingUp className="mr-1 h-4 w-4 hidden md:inline" />Odds</TabsTrigger>
            <TabsTrigger value="lineups"><Shirt className="mr-1 h-4 w-4 hidden md:inline" />Lineups</TabsTrigger>
            <TabsTrigger value="h2h"><Award className="mr-1 h-4 w-4 hidden md:inline" />H2H</TabsTrigger>
            <TabsTrigger value="standings"><Trophy className="mr-1 h-4 w-4 hidden md:inline" />Standings</TabsTrigger>
            <TabsTrigger value="news"><Newspaper className="mr-1 h-4 w-4 hidden md:inline" />News</TabsTrigger>
          </TabsList>

          {/* ============ OVERVIEW ============ */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* Top Performers */}
            {leaders.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                    <Award className="h-4 w-4" />Top Performers
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {leaders.slice(0, 6).map((l, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-3">
                        {l.headshot ? (
                          <Image src={l.headshot} alt={l.athlete || ''} width={40} height={40} className="rounded-full" unoptimized />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-bold">
                            {l.athlete?.slice(0, 2)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{l.athlete}</p>
                          <p className="truncate text-xs text-muted-foreground">{l.category} • {l.team}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">{l.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick form summary */}
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">Recent Form</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <TeamLogo teamName={match.homeTeam.name} logoUrl={match.homeTeam.logo} size="sm" />
                      <span className="truncate text-sm font-semibold">{match.homeTeam.name}</span>
                    </div>
                    {match.homeTeam.form ? (
                      <div className="flex flex-wrap gap-1">
                        {match.homeTeam.form.split('').map((r, i) => <FormBadge key={i} result={r} />)}
                      </div>
                    ) : <p className="text-xs text-muted-foreground">No form data available</p>}
                  </div>
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <TeamLogo teamName={match.awayTeam.name} logoUrl={match.awayTeam.logo} size="sm" />
                      <span className="truncate text-sm font-semibold">{match.awayTeam.name}</span>
                    </div>
                    {match.awayTeam.form ? (
                      <div className="flex flex-wrap gap-1">
                        {match.awayTeam.form.split('').map((r, i) => <FormBadge key={i} result={r} />)}
                      </div>
                    ) : <p className="text-xs text-muted-foreground">No form data available</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* H2H quick view */}
            {h2h && h2h.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Recent Head-to-Head</h3>
                    <Button variant="link" size="sm" onClick={() => setActiveTab('h2h')}>View all</Button>
                  </div>
                  <div className="space-y-2">
                    {h2h.slice(0, 3).map((g, i) => (
                      <H2HRow key={i} game={g} timezone={timezone} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* News strip */}
            {news.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Latest News</h3>
                    <Button variant="link" size="sm" onClick={() => setActiveTab('news')}>View all</Button>
                  </div>
                  <div className="space-y-2">
                    {news.slice(0, 3).map((n, i) => <NewsRow key={i} item={n} />)}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ============ ODDS ============ */}
          <TabsContent value="odds" className="mt-4">
            <Card>
              <CardContent className="p-4">
                {!hasRealOdds && bookmakerOdds.length === 0 ? (
                  <EmptyState icon={<TrendingUp className="h-8 w-8" />} title="No odds available" description="Odds for this match aren't published yet." />
                ) : bookmakerOdds.length > 0 ? (
                  <>
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">Match Result Odds</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/50 text-xs uppercase text-muted-foreground">
                            <th className="px-3 py-2 text-left">Bookmaker</th>
                            <th className="px-3 py-2 text-center">1</th>
                            {bookmakerOdds.some(o => o.draw !== undefined) && <th className="px-3 py-2 text-center">X</th>}
                            <th className="px-3 py-2 text-center">2</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookmakerOdds.map((o, i) => (
                            <tr key={i} className="border-b border-border/30 hover:bg-muted/40">
                              <td className="px-3 py-3 font-semibold">{o.bookmaker}</td>
                              <td className="px-3 py-3 text-center font-mono font-bold text-primary">{o.home.toFixed(2)}</td>
                              {bookmakerOdds.some(x => x.draw !== undefined) && (
                                <td className="px-3 py-3 text-center font-mono font-bold text-primary">
                                  {o.draw !== undefined ? o.draw.toFixed(2) : '—'}
                                </td>
                              )}
                              <td className="px-3 py-3 text-center font-mono font-bold text-primary">{o.away.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Spreads & Totals */}
                    {bookmakerOdds.some(o => o.spread || o.total) && (
                      <div className="mt-6 grid gap-4 md:grid-cols-2">
                        {bookmakerOdds.some(o => o.spread) && (
                          <div>
                            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Handicap</h4>
                            <div className="space-y-1.5">
                              {bookmakerOdds.filter(o => o.spread).map((o, i) => (
                                <div key={i} className="flex items-center justify-between rounded bg-muted/40 px-3 py-2 text-sm">
                                  <span className="font-medium">{o.bookmaker}</span>
                                  <div className="flex gap-2 font-mono">
                                    <span>{o.spread!.value > 0 ? '+' : ''}{o.spread!.value} → <b className="text-primary">{o.spread!.homePrice.toFixed(2)}</b></span>
                                    <span>/</span>
                                    <span><b className="text-primary">{o.spread!.awayPrice.toFixed(2)}</b></span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {bookmakerOdds.some(o => o.total) && (
                          <div>
                            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Over / Under</h4>
                            <div className="space-y-1.5">
                              {bookmakerOdds.filter(o => o.total).map((o, i) => (
                                <div key={i} className="flex items-center justify-between rounded bg-muted/40 px-3 py-2 text-sm">
                                  <span className="font-medium">{o.bookmaker} ({o.total!.value})</span>
                                  <div className="flex gap-2 font-mono">
                                    <span>O <b className="text-primary">{o.total!.overPrice.toFixed(2)}</b></span>
                                    <span>U <b className="text-primary">{o.total!.underPrice.toFixed(2)}</b></span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : match.odds ? (
                  <div className="grid grid-cols-3 gap-3">
                    <OddsCell label="Home Win" value={match.odds.home} />
                    {match.odds.draw !== undefined && <OddsCell label="Draw" value={match.odds.draw} />}
                    <OddsCell label="Away Win" value={match.odds.away} />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============ LINEUPS ============ */}
          <TabsContent value="lineups" className="mt-4">
            {lineups && (lineups.home || lineups.away) ? (
              <div className="grid gap-4 md:grid-cols-2">
                {lineups.home && <RosterCard side="Home" roster={lineups.home} />}
                {lineups.away && <RosterCard side="Away" roster={lineups.away} />}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8">
                  <EmptyState icon={<Shirt className="h-8 w-8" />} title="No lineups yet" description="Squad and lineups are usually published closer to kickoff." />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ============ H2H ============ */}
          <TabsContent value="h2h" className="mt-4">
            <Card>
              <CardContent className="p-4">
                {h2h && h2h.length > 0 ? (
                  <div className="space-y-2">
                    {h2h.map((g, i) => <H2HRow key={i} game={g} timezone={timezone} />)}
                  </div>
                ) : (
                  <EmptyState icon={<Award className="h-8 w-8" />} title="No previous meetings" description="No head-to-head history available between these teams." />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============ STANDINGS ============ */}
          <TabsContent value="standings" className="mt-4">
            {standings && standings.length > 0 ? (
              standings.map((g, i) => (
                <Card key={i} className="mb-4">
                  <CardContent className="p-4">
                    {g.header && <h3 className="mb-3 text-sm font-bold">{g.header}</h3>}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/50 text-xs uppercase text-muted-foreground">
                            <th className="px-2 py-2 text-left w-8">#</th>
                            <th className="px-2 py-2 text-left">Team</th>
                            <th className="px-2 py-2 text-center">P</th>
                            <th className="px-2 py-2 text-center">W</th>
                            <th className="px-2 py-2 text-center">D</th>
                            <th className="px-2 py-2 text-center">L</th>
                            {g.rows.some(r => r.goalsFor !== undefined) && <th className="px-2 py-2 text-center">GD</th>}
                            <th className="px-2 py-2 text-center font-bold">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.rows.map((r, ri) => {
                            const isCurrentTeam = r.teamName === match.homeTeam.name || r.teamName === match.awayTeam.name
                            return (
                              <tr key={ri} className={cn(
                                "border-b border-border/30 hover:bg-muted/40",
                                isCurrentTeam && "bg-primary/10 font-semibold"
                              )}>
                                <td className="px-2 py-2 text-muted-foreground">{r.position ?? ri + 1}</td>
                                <td className="px-2 py-2">
                                  <div className="flex items-center gap-2">
                                    <TeamLogo teamName={r.teamName || ''} logoUrl={r.teamLogo} size="sm" />
                                    <span className="truncate">{r.teamName}</span>
                                  </div>
                                </td>
                                <td className="px-2 py-2 text-center">{r.played}</td>
                                <td className="px-2 py-2 text-center">{r.won}</td>
                                <td className="px-2 py-2 text-center">{r.drawn}</td>
                                <td className="px-2 py-2 text-center">{r.lost}</td>
                                {g.rows.some(x => x.goalsFor !== undefined) && (
                                  <td className="px-2 py-2 text-center">{r.goalDifference !== undefined ? (r.goalDifference > 0 ? '+' : '') + r.goalDifference : '—'}</td>
                                )}
                                <td className="px-2 py-2 text-center font-bold text-primary">{r.points}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8">
                  <EmptyState icon={<Trophy className="h-8 w-8" />} title="No standings available" description="Table data isn't published for this competition." />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ============ NEWS ============ */}
          <TabsContent value="news" className="mt-4">
            <Card>
              <CardContent className="p-4">
                {news.length > 0 ? (
                  <div className="space-y-3">
                    {news.map((n, i) => <NewsRow key={i} item={n} />)}
                  </div>
                ) : (
                  <EmptyState icon={<Newspaper className="h-8 w-8" />} title="No news yet" description="No articles available for this match." />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// ===== Sub-components =====

function OddsCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/40 p-4 text-center transition-colors hover:bg-primary/10">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-primary">{value.toFixed(2)}</p>
    </div>
  )
}

function H2HRow({ game, timezone }: { game: H2HGame; timezone: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-lg border border-border/40 bg-muted/30 px-3 py-2 text-sm">
      <div className="flex items-center gap-2 justify-end min-w-0">
        <span className="truncate font-medium">{game.home.name}</span>
        <TeamLogo teamName={game.home.name} logoUrl={game.home.logo} size="sm" />
      </div>
      <div className="flex flex-col items-center px-2">
        <div className="font-mono font-bold tabular-nums">
          {game.home.score ?? '-'} : {game.away.score ?? '-'}
        </div>
        <div className="text-[10px] text-muted-foreground">
          {game.date ? formatDate(game.date, timezone) : ''}{game.league ? ` • ${game.league}` : ''}
        </div>
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <TeamLogo teamName={game.away.name} logoUrl={game.away.logo} size="sm" />
        <span className="truncate font-medium">{game.away.name}</span>
      </div>
    </div>
  )
}

function RosterCard({ side, roster }: { side: string; roster: TeamRoster }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TeamLogo teamName={roster.teamName || ''} logoUrl={roster.teamLogo} size="sm" />
            <div>
              <p className="text-sm font-bold">{roster.teamName}</p>
              <p className="text-xs text-muted-foreground">{side}{roster.formation ? ` • ${roster.formation}` : ''}</p>
            </div>
          </div>
        </div>
        {roster.coach && (
          <p className="mb-3 text-xs text-muted-foreground">Coach: <span className="font-medium text-foreground">{roster.coach}</span></p>
        )}

        {roster.starting.length > 0 && (
          <>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Starting XI</h4>
            <div className="mb-3 space-y-1">
              {roster.starting.map((p, i) => <PlayerRow key={i} player={p} />)}
            </div>
          </>
        )}
        {roster.bench.length > 0 && (
          <>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Bench</h4>
            <div className="space-y-1">
              {roster.bench.slice(0, 12).map((p, i) => <PlayerRow key={i} player={p} />)}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function PlayerRow({ player }: { player: Player }) {
  return (
    <div className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted/40">
      <span className="w-7 text-center font-mono text-xs text-muted-foreground">{player.jersey || '-'}</span>
      {player.headshot ? (
        <Image src={player.headshot} alt="" width={24} height={24} className="rounded-full" unoptimized />
      ) : (
        <div className="h-6 w-6 rounded-full bg-muted" />
      )}
      <span className="flex-1 truncate">{player.fullName || player.name}</span>
      {player.position && <span className="text-xs text-muted-foreground">{player.position}</span>}
    </div>
  )
}

function NewsRow({ item }: { item: NewsItem }) {
  const inner = (
    <div className="flex gap-3 rounded-lg p-2 transition-colors hover:bg-muted/40">
      {item.image && (
        <Image src={item.image} alt="" width={80} height={60} className="h-16 w-20 rounded object-cover" unoptimized />
      )}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold">{item.headline}</p>
        {item.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>}
      </div>
    </div>
  )
  return item.link ? <a href={item.link} target="_blank" rel="noopener noreferrer">{inner}</a> : inner
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
      <div className="mb-2 opacity-60">{icon}</div>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm">{description}</p>
    </div>
  )
}
