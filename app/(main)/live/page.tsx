"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Radio, Clock, TrendingUp, Users, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SidebarNew } from "@/components/layout/sidebar-new"
import { TeamLogo } from "@/components/ui/team-logo"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { ALL_SPORTS, getSportIcon } from "@/lib/sports-data"
import { useLiveMatches } from "@/lib/hooks/use-matches"

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

export default function LivePage() {
  const { matches, isLoading, error } = useLiveMatches()
  const [selectedSport, setSelectedSport] = useState<number | null>(null)

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
    const groups: Record<string, typeof matches> = {}
    filteredMatches.forEach(match => {
      const sportIcon = match.sport?.icon || getSportIcon(match.sport?.slug || 'football')
      const key = `${sportIcon} ${match.league?.name || 'Unknown League'}`
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
            <Spinner className="h-8 w-8" />
            <span className="text-muted-foreground">Loading live matches...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex">
        <SidebarNew />
        <div className="flex-1 p-8 text-center">
          <Radio className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="text-xl font-bold">Unable to load live matches</h1>
          <p className="text-muted-foreground mt-2">Please try again later</p>
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
                {matches.reduce((acc, m) => acc + (m.tipsCount || 0) * 10, 0).toLocaleString()} watching
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
                    {leagueMatches.map(match => {
                      const isHot = (match.tipsCount || 0) > 30
                      
                      return (
                        <Link 
                          key={match.id} 
                          href={`/matches/${match.id}`}
                          className="group"
                        >
                          <div className={cn(
                            "relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-lg",
                            isHot && "border-warning/50"
                          )}>
                            {/* Live Badge */}
                            <div className="mb-3 flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">{match.league?.country || 'Unknown'}</span>
                              <div className="flex items-center gap-2">
                                {isHot && (
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
                                <div className="flex items-center gap-2">
                                  <TeamLogo 
                                    teamName={match.homeTeam.name} 
                                    logoUrl={match.homeTeam.logo}
                                    size="sm"
                                  />
                                  <span className="font-medium">{match.homeTeam.name}</span>
                                </div>
                                <span className="text-2xl font-bold text-primary">{match.homeScore ?? 0}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <TeamLogo 
                                    teamName={match.awayTeam.name} 
                                    logoUrl={match.awayTeam.logo}
                                    size="sm"
                                  />
                                  <span className="font-medium">{match.awayTeam.name}</span>
                                </div>
                                <span className="text-2xl font-bold text-primary">{match.awayScore ?? 0}</span>
                              </div>
                            </div>

                            {/* Match Time */}
                            <div className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-muted/50 py-2">
                              <Clock className="h-4 w-4 text-live" />
                              <span className="font-mono text-lg font-bold text-live">{match.minute || 0}&apos;</span>
                              <span className="text-sm text-muted-foreground">
                                {match.status === 'halftime' ? 'HT' : (match.minute || 0) <= 45 ? '1st Half' : '2nd Half'}
                              </span>
                            </div>

                            {/* Odds */}
                            {match.odds && (
                              <div className="grid grid-cols-3 gap-2">
                                <div className="rounded-lg bg-muted p-2 text-center transition-colors group-hover:bg-primary/10">
                                  <p className="text-xs text-muted-foreground">Home</p>
                                  <p className="font-bold text-primary">{match.odds.home}</p>
                                </div>
                                <div className="rounded-lg bg-muted p-2 text-center transition-colors group-hover:bg-primary/10">
                                  <p className="text-xs text-muted-foreground">Draw</p>
                                  <p className="font-bold text-primary">{match.odds.draw || '-'}</p>
                                </div>
                                <div className="rounded-lg bg-muted p-2 text-center transition-colors group-hover:bg-primary/10">
                                  <p className="text-xs text-muted-foreground">Away</p>
                                  <p className="font-bold text-primary">{match.odds.away}</p>
                                </div>
                              </div>
                            )}

                            {/* Stats */}
                            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {((match.tipsCount || 0) * 10).toLocaleString()} watching
                              </div>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {match.tipsCount || 0} predictions
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
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
