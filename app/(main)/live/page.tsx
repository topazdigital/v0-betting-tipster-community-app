"use client"

import { useState, useEffect } from "react"
import { Radio, Clock, TrendingUp, Users, Zap, Filter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SPORTS_LIST } from "@/lib/sports-data"
import Link from "next/link"

interface LiveMatch {
  id: string
  sport: string
  sportIcon: string
  league: string
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

function generateLiveMatches(): LiveMatch[] {
  return SPORTS_LIST.slice(0, 15).flatMap((sport, sportIndex) => 
    Array.from({ length: 2 + Math.floor(Math.random() * 3) }, (_, i) => ({
      id: `live-${sport.id}-${i}`,
      sport: sport.id,
      sportIcon: sport.icon,
      league: sport.leagues[Math.floor(Math.random() * sport.leagues.length)],
      homeTeam: `${sport.name} Team ${i * 2 + 1}`,
      awayTeam: `${sport.name} Team ${i * 2 + 2}`,
      homeScore: Math.floor(Math.random() * 4),
      awayScore: Math.floor(Math.random() * 4),
      minute: Math.floor(Math.random() * 90),
      period: ["1st Half", "2nd Half", "Q1", "Q2", "Q3", "Q4", "Set 1", "Set 2"][Math.floor(Math.random() * 8)],
      homeOdds: +(1.2 + Math.random() * 3).toFixed(2),
      drawOdds: +(2.5 + Math.random() * 2).toFixed(2),
      awayOdds: +(1.5 + Math.random() * 4).toFixed(2),
      isHot: Math.random() > 0.7,
      viewers: Math.floor(100 + Math.random() * 5000),
      predictions: Math.floor(10 + Math.random() * 200)
    }))
  )
}

export default function LivePage() {
  const [matches, setMatches] = useState<LiveMatch[]>([])
  const [selectedSport, setSelectedSport] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setMatches(generateLiveMatches())
    setIsLoading(false)

    // Simulate live updates
    const interval = setInterval(() => {
      setMatches(prev => prev.map(match => ({
        ...match,
        minute: Math.min(match.minute + 1, 90),
        homeScore: Math.random() > 0.98 ? match.homeScore + 1 : match.homeScore,
        awayScore: Math.random() > 0.98 ? match.awayScore + 1 : match.awayScore,
        viewers: match.viewers + Math.floor(Math.random() * 10) - 5,
        homeOdds: +(match.homeOdds + (Math.random() - 0.5) * 0.1).toFixed(2),
        awayOdds: +(match.awayOdds + (Math.random() - 0.5) * 0.1).toFixed(2),
      })))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const filteredMatches = selectedSport === "all" 
    ? matches 
    : matches.filter(m => m.sport === selectedSport)

  const sportCounts = SPORTS_LIST.map(sport => ({
    ...sport,
    count: matches.filter(m => m.sport === sport.id).length
  })).filter(s => s.count > 0)

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-muted-foreground">Loading live matches...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="h-6 w-6 text-red-500" />
            <span className="absolute -right-1 -top-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Live Now</h1>
            <p className="text-muted-foreground">{matches.length} matches in progress</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1 border-emerald-500/50 bg-emerald-500/10 text-emerald-500">
            <Users className="h-3 w-3" />
            {matches.reduce((acc, m) => acc + m.viewers, 0).toLocaleString()} watching
          </Badge>
        </div>
      </div>

      {/* Sport Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Button
          variant={selectedSport === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedSport("all")}
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

      {/* Live Matches Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredMatches.map(match => (
          <Link 
            key={match.id} 
            href={`/matches/${match.id}`}
            className="group"
          >
            <div className={cn(
              "relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-lg",
              match.isHot && "border-amber-500/50"
            )}>
              {/* Live Badge */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{match.sportIcon}</span>
                  <span className="text-sm text-muted-foreground">{match.league}</span>
                </div>
                <div className="flex items-center gap-2">
                  {match.isHot && (
                    <Badge className="gap-1 bg-amber-500">
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
                <Clock className="h-4 w-4 text-red-500" />
                <span className="font-mono text-lg font-bold text-red-500">{match.minute}&apos;</span>
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

      {filteredMatches.length === 0 && (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border">
          <Radio className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">No live matches</p>
          <p className="text-muted-foreground">Check back soon for live action</p>
        </div>
      )}
    </div>
  )
}
