"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Radio, Clock, TrendingUp, Users, Zap, Filter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SidebarNew } from "@/components/layout/sidebar-new"
import { cn } from "@/lib/utils"
import { ALL_SPORTS, ALL_LEAGUES, getSportIcon, TEAMS_DATABASE } from "@/lib/sports-data"

interface LiveMatch {
  id: string
  sportId: number
  sport: string
  sportIcon: string
  leagueId: number
  league: string
  country: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  minute: number
  period: string
  homeOdds: number
  drawOdds: number
  awayOdds: number
  isHot: boolean
  viewers: number
  predictions: number
}

// Priority order for sports (football first, then by popularity)
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
}

function generateLiveMatches(): LiveMatch[] {
  const matches: LiveMatch[] = []
  
  // Generate live matches for popular sports - more for football
  const matchCounts: Record<number, number> = {
    1: 12,  // Football - most matches
    2: 6,   // Basketball
    3: 4,   // Tennis
    4: 3,   // Cricket
    5: 3,   // American Football
    7: 4,   // Ice Hockey
    27: 2,  // MMA
    33: 3,  // Esports
  }

  Object.entries(matchCounts).forEach(([sportIdStr, count]) => {
    const sportId = parseInt(sportIdStr)
    const sport = ALL_SPORTS.find(s => s.id === sportId)
    if (!sport) return

    const sportLeagues = ALL_LEAGUES.filter(l => l.sportId === sportId)
    if (sportLeagues.length === 0) return

    for (let i = 0; i < count; i++) {
      const league = sportLeagues[i % sportLeagues.length]
      const leagueTeams = TEAMS_DATABASE.filter(t => t.leagueId === league.id)
      
      let homeTeam: string
      let awayTeam: string
      
      if (leagueTeams.length >= 2) {
        const shuffled = [...leagueTeams].sort(() => Math.random() - 0.5)
        homeTeam = shuffled[0].name
        awayTeam = shuffled[1].name
      } else {
        homeTeam = `${league.country} Team ${i * 2 + 1}`
        awayTeam = `${league.country} Team ${i * 2 + 2}`
      }

      const minute = Math.floor(Math.random() * 90) + 1
      const period = minute <= 45 ? "1st Half" : minute <= 90 ? "2nd Half" : "ET"
      
      matches.push({
        id: `live-${sportId}-${league.id}-${i}`,
        sportId,
        sport: sport.name,
        sportIcon: getSportIcon(sport.slug),
        leagueId: league.id,
        league: league.name,
        country: league.country,
        homeTeam,
        awayTeam,
        homeScore: Math.floor(Math.random() * 4),
        awayScore: Math.floor(Math.random() * 4),
        minute,
        period,
        homeOdds: +(1.2 + Math.random() * 3).toFixed(2),
        drawOdds: +(2.5 + Math.random() * 2).toFixed(2),
        awayOdds: +(1.5 + Math.random() * 4).toFixed(2),
        isHot: Math.random() > 0.7,
        viewers: Math.floor(100 + Math.random() * 5000),
        predictions: Math.floor(10 + Math.random() * 200)
      })
    }
  })
  
  // Sort by sport priority (football first), then by minute
  return matches.sort((a, b) => {
    const priorityA = SPORT_PRIORITY[a.sportId] ?? 99
    const priorityB = SPORT_PRIORITY[b.sportId] ?? 99
    if (priorityA !== priorityB) return priorityA - priorityB
    return b.minute - a.minute // Higher minute first within same sport
  })
}

export default function LivePage() {
  const [matches, setMatches] = useState<LiveMatch[]>([])
  const [selectedSport, setSelectedSport] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setMatches(generateLiveMatches())
    setIsLoading(false)

    // Simulate live updates every 5 seconds
    const interval = setInterval(() => {
      setMatches(prev => prev.map(match => ({
        ...match,
        minute: Math.min(match.minute + 1, 90),
        homeScore: Math.random() > 0.98 ? match.homeScore + 1 : match.homeScore,
        awayScore: Math.random() > 0.98 ? match.awayScore + 1 : match.awayScore,
        viewers: Math.max(0, match.viewers + Math.floor(Math.random() * 20) - 10),
        homeOdds: Math.max(1.01, +(match.homeOdds + (Math.random() - 0.5) * 0.1).toFixed(2)),
        awayOdds: Math.max(1.01, +(match.awayOdds + (Math.random() - 0.5) * 0.1).toFixed(2)),
      })))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const filteredMatches = selectedSport 
    ? matches.filter(m => m.sportId === selectedSport) 
    : matches

  // Get sport counts - sorted by priority
  const sportCounts = useMemo(() => {
    const counts = ALL_SPORTS.map(sport => ({
      ...sport,
      icon: getSportIcon(sport.slug),
      count: matches.filter(m => m.sportId === sport.id).length
    })).filter(s => s.count > 0)
    
    // Sort by priority
    return counts.sort((a, b) => {
      const priorityA = SPORT_PRIORITY[a.id] ?? 99
      const priorityB = SPORT_PRIORITY[b.id] ?? 99
      return priorityA - priorityB
    })
  }, [matches])

  // Group matches by league
  const groupedMatches = useMemo(() => {
    const groups: Record<string, LiveMatch[]> = {}
    filteredMatches.forEach(match => {
      const key = `${match.sportIcon} ${match.league}`
      if (!groups[key]) groups[key] = []
      groups[key].push(match)
    })
    return Object.entries(groups)
  }, [filteredMatches])

  if (isLoading) {
    return (
      <div className="flex">
        <SidebarNew />
        <div className="flex-1 flex h-96 items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <span className="text-muted-foreground">Loading live matches...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex">
      <SidebarNew selectedSportId={selectedSport} onSelectSport={setSelectedSport} />
      
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 py-6">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Radio className="h-6 w-6 text-live" />
                <span className="absolute -right-1 -top-1 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-live"></span>
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Live Now</h1>
                <p className="text-muted-foreground">{matches.length} matches in progress</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1 border-success/50 bg-success/10 text-success">
                <Users className="h-3 w-3" />
                {matches.reduce((acc, m) => acc + m.viewers, 0).toLocaleString()} watching
              </Badge>
            </div>
          </div>

          {/* Sport Filters - sorted by priority */}
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={selectedSport === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSport(null)}
              className="shrink-0"
            >
              All Sports
              <Badge variant="secondary" className="ml-2">{matches.length}</Badge>
            </Button>
            {sportCounts.map(sport => (
              <Button
                key={sport.id}
                variant={selectedSport === sport.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSport(sport.id)}
                className="shrink-0 gap-2"
              >
                <span>{sport.icon}</span>
                {sport.name}
                <Badge variant="secondary">{sport.count}</Badge>
              </Button>
            ))}
          </div>

          {/* Live Matches by League */}
          {groupedMatches.length > 0 ? (
            <div className="space-y-6">
              {groupedMatches.map(([leagueName, leagueMatches]) => (
                <div key={leagueName}>
                  <div className="mb-3 flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{leagueName}</h2>
                    <Badge variant="destructive" className="animate-pulse">
                      {leagueMatches.length} LIVE
                    </Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {leagueMatches.map(match => (
                      <Link 
                        key={match.id} 
                        href={`/matches/${match.id}`}
                        className="group"
                      >
                        <div className={cn(
                          "relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-lg",
                          match.isHot && "border-warning/50"
                        )}>
                          {/* Live Badge */}
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{match.country}</span>
                            <div className="flex items-center gap-2">
                              {match.isHot && (
                                <Badge className="gap-1 bg-warning text-warning-foreground">
                                  <Zap className="h-3 w-3" /> Hot
                                </Badge>
                              )}
                              <Badge variant="destructive" className="gap-1 animate-pulse">
                                <Radio className="h-3 w-3" /> LIVE
                              </Badge>
                            </div>
                          </div>

                          {/* Teams & Score */}
                          <div className="mb-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{match.homeTeam}</span>
                              <span className="text-2xl font-bold text-primary">{match.homeScore}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{match.awayTeam}</span>
                              <span className="text-2xl font-bold text-primary">{match.awayScore}</span>
                            </div>
                          </div>

                          {/* Match Time */}
                          <div className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-muted/50 py-2">
                            <Clock className="h-4 w-4 text-live" />
                            <span className="font-mono text-lg font-bold text-live">{match.minute}&apos;</span>
                            <span className="text-sm text-muted-foreground">{match.period}</span>
                          </div>

                          {/* Odds */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="rounded-lg bg-muted p-2 text-center transition-colors group-hover:bg-primary/10">
                              <p className="text-xs text-muted-foreground">Home</p>
                              <p className="font-bold text-primary">{match.homeOdds}</p>
                            </div>
                            <div className="rounded-lg bg-muted p-2 text-center transition-colors group-hover:bg-primary/10">
                              <p className="text-xs text-muted-foreground">Draw</p>
                              <p className="font-bold text-primary">{match.drawOdds}</p>
                            </div>
                            <div className="rounded-lg bg-muted p-2 text-center transition-colors group-hover:bg-primary/10">
                              <p className="text-xs text-muted-foreground">Away</p>
                              <p className="font-bold text-primary">{match.awayOdds}</p>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {match.viewers.toLocaleString()} watching
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {match.predictions} predictions
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border">
              <Radio className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No live matches</p>
              <p className="text-muted-foreground">Check back soon for live action</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
