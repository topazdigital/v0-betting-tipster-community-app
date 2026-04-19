"use client"

import { use, useMemo, useState } from "react"
import Link from "next/link"
import { 
  ArrowLeft, Trophy, Calendar, TrendingUp, Users, 
  ChevronRight, Clock, Star, Target
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SidebarNew } from "@/components/layout/sidebar-new"
import { MatchCardNew } from "@/components/matches/match-card-new"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { ALL_LEAGUES, TEAMS_DATABASE, getSportIcon, BOOKMAKERS } from "@/lib/sports-data"
import { useMatches } from "@/lib/hooks/use-matches"
import { format } from "date-fns"

interface PageProps {
  params: Promise<{ slug: string }>
}

// Generate standings for a league
function generateStandings(leagueId: number) {
  const teams = TEAMS_DATABASE.filter(t => t.leagueId === leagueId)
  
  if (teams.length < 4) {
    // Generate placeholder teams
    const placeholders = Array.from({ length: 20 }, (_, i) => ({
      id: 8000 + i,
      name: `Team ${i + 1}`,
      shortName: `T${i + 1}`,
    }))
    teams.push(...placeholders.map((p, idx) => ({
      ...p,
      sportId: 1,
      leagueId,
      country: 'Unknown'
    })))
  }
  
  return teams.slice(0, 20).map((team, idx) => {
    const played = 30 + Math.floor(Math.random() * 8)
    const won = Math.floor(Math.random() * 20) + 5
    const drawn = Math.floor(Math.random() * 10)
    const lost = played - won - drawn
    const gf = won * 2 + drawn + Math.floor(Math.random() * 20)
    const ga = lost * 2 + drawn + Math.floor(Math.random() * 15)
    
    return {
      position: idx + 1,
      team,
      played,
      won,
      drawn,
      lost,
      gf,
      ga,
      gd: gf - ga,
      points: won * 3 + drawn,
      form: Array.from({ length: 5 }, () => ['W', 'D', 'L'][Math.floor(Math.random() * 3)])
    }
  }).sort((a, b) => b.points - a.points || b.gd - a.gd)
    .map((team, idx) => ({ ...team, position: idx + 1 }))
}

// Generate outright winner odds
function generateOutrightOdds(leagueId: number) {
  const teams = TEAMS_DATABASE.filter(t => t.leagueId === leagueId)
  
  if (teams.length < 4) {
    const placeholders = Array.from({ length: 10 }, (_, i) => ({
      id: 8000 + i,
      name: `Team ${i + 1}`,
      shortName: `T${i + 1}`,
      sportId: 1,
      leagueId,
      country: 'Unknown'
    }))
    teams.push(...placeholders)
  }
  
  // Generate odds for each bookmaker
  return teams.slice(0, 10).map((team, idx) => {
    // Lower position = better odds (lower number)
    const baseOdds = 1.5 + (idx * 3) + (Math.random() * 5)
    
    return {
      team,
      odds: BOOKMAKERS.filter(b => b.featured).slice(0, 5).map(bookie => ({
        bookmaker: bookie.name,
        bookmakerSlug: bookie.slug,
        odds: +(baseOdds + (Math.random() - 0.5) * 2).toFixed(2),
        affiliateUrl: bookie.affiliateUrl
      }))
    }
  }).sort((a, b) => {
    const avgA = a.odds.reduce((sum, o) => sum + o.odds, 0) / a.odds.length
    const avgB = b.odds.reduce((sum, o) => sum + o.odds, 0) / b.odds.length
    return avgA - avgB
  })
}

// Generate top scorers
function generateTopScorers(leagueId: number) {
  return Array.from({ length: 10 }, (_, i) => ({
    position: i + 1,
    player: `Player ${i + 1}`,
    team: TEAMS_DATABASE.filter(t => t.leagueId === leagueId)[i % 5]?.name || `Team ${i % 5 + 1}`,
    goals: 25 - i * 2 + Math.floor(Math.random() * 3),
    assists: Math.floor(Math.random() * 10),
    matches: 30 + Math.floor(Math.random() * 5)
  }))
}

// Country flag helper
function getCountryFlag(countryCode: string): string {
  const codeMap: Record<string, string> = {
    'GB-ENG': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
    'GB-SCT': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}',
    'EU': '\u{1F1EA}\u{1F1FA}',
    'WO': '\u{1F30D}',
    'AF': '\u{1F30D}',
  }
  
  const mapped = codeMap[countryCode]
  if (mapped) return mapped
  
  try {
    const codePoints = countryCode.substring(0, 2)
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0))
    return String.fromCodePoint(...codePoints)
  } catch {
    return '\u{1F3C6}'
  }
}

export default function LeaguePage({ params }: PageProps) {
  const { slug } = use(params)
  const [activeTab, setActiveTab] = useState("matches")
  
  // Find the league
  const league = ALL_LEAGUES.find(l => l.slug === slug)
  
  // Get matches for this league
  const { matches, isLoading } = useMatches(
    league ? { leagueId: league.id } : undefined
  )
  
  // Generate data
  const standings = useMemo(() => league ? generateStandings(league.id) : [], [league])
  const outrightOdds = useMemo(() => league ? generateOutrightOdds(league.id) : [], [league])
  const topScorers = useMemo(() => league ? generateTopScorers(league.id) : [], [league])
  
  if (!league) {
    return (
      <div className="flex">
        <SidebarNew />
        <div className="flex-1 p-8 text-center">
          <h1 className="text-2xl font-bold">League not found</h1>
          <Button asChild className="mt-4">
            <Link href="/matches">Back to Matches</Link>
          </Button>
        </div>
      </div>
    )
  }
  
  // Categorize matches
  const liveMatches = matches.filter(m => m.status === 'live' || m.status === 'halftime')
  const upcomingMatches = matches.filter(m => m.status === 'scheduled')
    .sort((a, b) => new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime())
  const finishedMatches = matches.filter(m => m.status === 'finished')
    .sort((a, b) => new Date(b.kickoffTime).getTime() - new Date(a.kickoffTime).getTime())

  return (
    <div className="flex">
      <SidebarNew />
      
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 py-6">
          {/* Back Button */}
          <Button variant="ghost" size="sm" className="mb-4" asChild>
            <Link href="/matches">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Matches
            </Link>
          </Button>

          {/* League Header */}
          <Card className="mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-transparent p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-card text-3xl">
                  {getSportIcon('football')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getCountryFlag(league.countryCode)}</span>
                    <h1 className="text-2xl font-bold">{league.name}</h1>
                  </div>
                  <p className="text-muted-foreground">{league.country}</p>
                </div>
                <div className="flex gap-3">
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    Season 2025/26
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    {matches.length} matches
                  </Badge>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="mt-6 grid grid-cols-4 gap-4">
                <div className="rounded-lg bg-card p-3 text-center">
                  <div className="text-2xl font-bold text-live">{liveMatches.length}</div>
                  <div className="text-xs text-muted-foreground">Live Now</div>
                </div>
                <div className="rounded-lg bg-card p-3 text-center">
                  <div className="text-2xl font-bold text-primary">{upcomingMatches.length}</div>
                  <div className="text-xs text-muted-foreground">Upcoming</div>
                </div>
                <div className="rounded-lg bg-card p-3 text-center">
                  <div className="text-2xl font-bold">{standings.length}</div>
                  <div className="text-xs text-muted-foreground">Teams</div>
                </div>
                <div className="rounded-lg bg-card p-3 text-center">
                  <div className="text-2xl font-bold text-warning">{outrightOdds.length}</div>
                  <div className="text-xs text-muted-foreground">Outrights</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="matches">Matches</TabsTrigger>
              <TabsTrigger value="standings">Standings</TabsTrigger>
              <TabsTrigger value="outrights">Outright Winner</TabsTrigger>
              <TabsTrigger value="stats">Top Scorers</TabsTrigger>
            </TabsList>

            {/* Matches Tab */}
            <TabsContent value="matches" className="space-y-6">
              {isLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Spinner className="h-8 w-8" />
                </div>
              ) : (
                <>
                  {/* Live Matches */}
                  {liveMatches.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75"></span>
                          <span className="relative inline-flex h-3 w-3 rounded-full bg-live"></span>
                        </span>
                        <h2 className="text-lg font-semibold">Live Now</h2>
                        <Badge variant="destructive">{liveMatches.length}</Badge>
                      </div>
                      <div className="space-y-2">
                        {liveMatches.map(match => (
                          <MatchCardNew key={match.id} match={match} variant="compact" />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Upcoming Matches */}
                  {upcomingMatches.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Upcoming</h2>
                        <Badge variant="secondary">{upcomingMatches.length}</Badge>
                      </div>
                      <div className="space-y-2">
                        {upcomingMatches.slice(0, 10).map(match => (
                          <MatchCardNew key={match.id} match={match} variant="compact" />
                        ))}
                      </div>
                      {upcomingMatches.length > 10 && (
                        <Button variant="ghost" className="mt-2 w-full" asChild>
                          <Link href={`/matches?league=${league.slug}`}>
                            View all {upcomingMatches.length} matches
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {/* Recent Results */}
                  {finishedMatches.length > 0 && (
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-success" />
                        <h2 className="text-lg font-semibold">Recent Results</h2>
                      </div>
                      <div className="space-y-2">
                        {finishedMatches.slice(0, 5).map(match => (
                          <MatchCardNew key={match.id} match={match} variant="compact" />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Standings Tab */}
            <TabsContent value="standings">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-warning" />
                    League Table
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="pb-3 text-left font-medium">#</th>
                          <th className="pb-3 text-left font-medium">Team</th>
                          <th className="pb-3 text-center font-medium">P</th>
                          <th className="pb-3 text-center font-medium">W</th>
                          <th className="pb-3 text-center font-medium">D</th>
                          <th className="pb-3 text-center font-medium">L</th>
                          <th className="pb-3 text-center font-medium">GF</th>
                          <th className="pb-3 text-center font-medium">GA</th>
                          <th className="pb-3 text-center font-medium">GD</th>
                          <th className="pb-3 text-center font-medium">Pts</th>
                          <th className="pb-3 text-center font-medium">Form</th>
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
                            <td className="py-3 font-medium">
                              <span className={cn(
                                "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                                row.position <= 4 && "bg-success text-success-foreground",
                                row.position >= standings.length - 2 && "bg-destructive text-destructive-foreground"
                              )}>
                                {row.position}
                              </span>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded bg-muted text-xs font-bold">
                                  {row.team.shortName}
                                </div>
                                <span className="font-medium">{row.team.name}</span>
                              </div>
                            </td>
                            <td className="py-3 text-center">{row.played}</td>
                            <td className="py-3 text-center text-success">{row.won}</td>
                            <td className="py-3 text-center">{row.drawn}</td>
                            <td className="py-3 text-center text-destructive">{row.lost}</td>
                            <td className="py-3 text-center">{row.gf}</td>
                            <td className="py-3 text-center">{row.ga}</td>
                            <td className="py-3 text-center font-medium">
                              <span className={row.gd > 0 ? "text-success" : row.gd < 0 ? "text-destructive" : ""}>
                                {row.gd > 0 ? `+${row.gd}` : row.gd}
                              </span>
                            </td>
                            <td className="py-3 text-center font-bold">{row.points}</td>
                            <td className="py-3">
                              <div className="flex justify-center gap-1">
                                {row.form.map((result, idx) => (
                                  <span 
                                    key={idx}
                                    className={cn(
                                      "flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold",
                                      result === 'W' && "bg-success text-success-foreground",
                                      result === 'D' && "bg-muted",
                                      result === 'L' && "bg-destructive text-destructive-foreground"
                                    )}
                                  >
                                    {result}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span className="h-3 w-3 rounded bg-success"></span>
                      Champions League
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-3 w-3 rounded bg-destructive"></span>
                      Relegation
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Outright Winner Tab */}
            <TabsContent value="outrights">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-warning" />
                    Outright Winner - {league.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Bet on who will win the league this season
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="pb-3 text-left font-medium text-muted-foreground">Team</th>
                          {outrightOdds[0]?.odds.map(o => (
                            <th key={o.bookmakerSlug} className="pb-3 text-center font-medium text-muted-foreground">
                              {o.bookmaker}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {outrightOdds.map((row, idx) => {
                          // Find best odds
                          const minOdds = Math.min(...row.odds.map(o => o.odds))
                          
                          return (
                            <tr key={row.team.id} className="border-b hover:bg-muted/50">
                              <td className="py-4">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                                    idx === 0 && "bg-yellow-500 text-yellow-950",
                                    idx === 1 && "bg-gray-300 text-gray-700",
                                    idx === 2 && "bg-amber-700 text-amber-100",
                                    idx > 2 && "bg-muted"
                                  )}>
                                    {idx + 1}
                                  </div>
                                  <div>
                                    <span className="font-semibold">{row.team.name}</span>
                                    {idx === 0 && (
                                      <Badge className="ml-2 bg-warning text-warning-foreground">
                                        <Star className="mr-1 h-3 w-3" />
                                        Favourite
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </td>
                              {row.odds.map(o => (
                                <td key={o.bookmakerSlug} className="py-4 text-center">
                                  <a
                                    href={o.affiliateUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                      "inline-block rounded-lg px-3 py-1.5 font-mono font-bold transition-colors hover:bg-primary hover:text-primary-foreground",
                                      o.odds === minOdds 
                                        ? "bg-success/10 text-success" 
                                        : "bg-muted"
                                    )}
                                  >
                                    {o.odds.toFixed(2)}
                                  </a>
                                </td>
                              ))}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  <p className="mt-4 text-xs text-muted-foreground">
                    * Green highlighted odds are the best available. Click to place bet.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Top Scorers Tab */}
            <TabsContent value="stats">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Top Scorers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="pb-3 text-left font-medium">#</th>
                          <th className="pb-3 text-left font-medium">Player</th>
                          <th className="pb-3 text-left font-medium">Team</th>
                          <th className="pb-3 text-center font-medium">Matches</th>
                          <th className="pb-3 text-center font-medium">Goals</th>
                          <th className="pb-3 text-center font-medium">Assists</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topScorers.map((scorer) => (
                          <tr key={scorer.position} className="border-b hover:bg-muted/50">
                            <td className="py-3">
                              <span className={cn(
                                "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                                scorer.position === 1 && "bg-yellow-500 text-yellow-950",
                                scorer.position === 2 && "bg-gray-300 text-gray-700",
                                scorer.position === 3 && "bg-amber-700 text-amber-100",
                                scorer.position > 3 && "bg-muted"
                              )}>
                                {scorer.position}
                              </span>
                            </td>
                            <td className="py-3 font-semibold">{scorer.player}</td>
                            <td className="py-3 text-muted-foreground">{scorer.team}</td>
                            <td className="py-3 text-center">{scorer.matches}</td>
                            <td className="py-3 text-center font-bold text-success">{scorer.goals}</td>
                            <td className="py-3 text-center text-primary">{scorer.assists}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
