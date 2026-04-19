"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { format, subDays, subHours } from "date-fns"
import { Calendar, CheckCircle2, XCircle, Trophy, TrendingUp, Search, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ALL_SPORTS, ALL_LEAGUES, getSportIcon, TEAMS_DATABASE } from "@/lib/sports-data"
import { SPORT_PRIORITY } from "@/lib/api/sports-api"

// Sort sports by priority (football first)
const sortedSports = [...ALL_SPORTS].sort((a, b) => {
  const priorityA = SPORT_PRIORITY[a.id] ?? 99
  const priorityB = SPORT_PRIORITY[b.id] ?? 99
  return priorityA - priorityB
})

// Generate realistic result matches
const generateResultMatches = () => {
  const results: Array<{
    id: string
    sportId: number
    sportName: string
    sportIcon: string
    leagueId: number
    league: string
    leagueSlug: string
    homeTeam: string
    awayTeam: string
    homeScore: number
    awayScore: number
    date: Date
    prediction: string
    predictionOdds: string
    result: "won" | "lost"
    tipster: {
      name: string
      avatar: string
      winRate: number
    }
  }> = []
  
  // Generate more results for popular sports
  const resultCounts: Record<number, number> = {
    1: 30,  // Football
    2: 10,  // Basketball
    3: 8,   // Tennis
    4: 5,   // Cricket
    5: 8,   // American Football
    6: 6,   // Baseball
    7: 6,   // Ice Hockey
  }
  
  sortedSports.forEach(sport => {
    const count = resultCounts[sport.id] || 3
    const sportLeagues = ALL_LEAGUES.filter(l => l.sportId === sport.id)
    
    if (sportLeagues.length === 0) return
    
    for (let i = 0; i < count; i++) {
      const league = sportLeagues[Math.floor(Math.random() * sportLeagues.length)]
      const leagueTeams = TEAMS_DATABASE.filter(t => t.leagueId === league.id)
      
      let homeTeam = `Team ${results.length * 2 + 1}`
      let awayTeam = `Team ${results.length * 2 + 2}`
      
      if (leagueTeams.length >= 2) {
        const shuffled = [...leagueTeams].sort(() => Math.random() - 0.5)
        homeTeam = shuffled[0].name
        awayTeam = shuffled[1].name
      }
      
      const isWin = Math.random() > 0.4
      const homeScore = Math.floor(Math.random() * 5)
      const awayScore = Math.floor(Math.random() * 5)
      
      results.push({
        id: `result-${sport.id}-${i}`,
        sportId: sport.id,
        sportName: sport.name,
        sportIcon: getSportIcon(sport.slug),
        leagueId: league.id,
        league: league.name,
        leagueSlug: league.slug,
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
        date: subHours(new Date(), Math.floor(Math.random() * 72) + 2),
        prediction: isWin ? "Home Win" : "Away Win",
        predictionOdds: (1.5 + Math.random() * 2).toFixed(2),
        result: isWin ? "won" : "lost",
        tipster: {
          name: `Tipster${Math.floor(Math.random() * 10) + 1}`,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=tipster${Math.floor(Math.random() * 10)}`,
          winRate: 55 + Math.floor(Math.random() * 30)
        }
      })
    }
  })
  
  // Sort by date (most recent first)
  return results.sort((a, b) => b.date.getTime() - a.date.getTime())
}

const resultMatches = generateResultMatches()

export default function ResultsPage() {
  const [selectedSport, setSelectedSport] = useState<string>("all")
  const [selectedResult, setSelectedResult] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState("7")

  const filteredResults = useMemo(() => {
    return resultMatches.filter(match => {
      if (selectedSport !== "all" && match.sportId.toString() !== selectedSport) return false
      if (selectedResult !== "all" && match.result !== selectedResult) return false
      if (searchQuery && !match.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !match.awayTeam.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [selectedSport, selectedResult, searchQuery])

  const stats = useMemo(() => ({
    total: filteredResults.length,
    won: filteredResults.filter(m => m.result === "won").length,
    lost: filteredResults.filter(m => m.result === "lost").length,
    winRate: Math.round((filteredResults.filter(m => m.result === "won").length / filteredResults.length) * 100) || 0
  }), [filteredResults])

  // Group results by sport for display
  const groupedResults = useMemo(() => {
    const groups: Record<string, typeof filteredResults> = {}
    
    filteredResults.forEach(match => {
      const key = `${match.sportIcon} ${match.sportName}`
      if (!groups[key]) groups[key] = []
      groups[key].push(match)
    })
    
    // Sort groups by sport priority
    return Object.entries(groups).sort((a, b) => {
      const sportA = filteredResults.find(m => `${m.sportIcon} ${m.sportName}` === a[0])
      const sportB = filteredResults.find(m => `${m.sportIcon} ${m.sportName}` === b[0])
      const priorityA = SPORT_PRIORITY[sportA?.sportId || 99] ?? 99
      const priorityB = SPORT_PRIORITY[sportB?.sportId || 99] ?? 99
      return priorityA - priorityB
    })
  }, [filteredResults])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Results</h1>
          <p className="text-muted-foreground">Track prediction outcomes and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Predictions</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Won</p>
              <p className="text-xl font-bold text-emerald-500">{stats.won}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lost</p>
              <p className="text-xl font-bold text-red-500">{stats.lost}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <TrendingUp className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Win Rate</p>
              <p className="text-xl font-bold text-amber-500">{stats.winRate}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="all">All Sports</option>
            {sortedSports.slice(0, 15).map(sport => (
              <option key={sport.id} value={sport.id.toString()}>
                {getSportIcon(sport.slug)} {sport.name}
              </option>
            ))}
          </select>
          <select
            value={selectedResult}
            onChange={(e) => setSelectedResult(e.target.value)}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
          >
            <option value="all">All Results</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      </div>

      {/* Results grouped by sport */}
      <div className="space-y-8">
        {groupedResults.map(([sportName, matches]) => (
          <div key={sportName}>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              {sportName}
              <Badge variant="secondary">{matches.length}</Badge>
            </h2>
            <div className="space-y-3">
              {matches.map((match) => (
                <div 
                  key={match.id}
                  className={cn(
                    "rounded-xl border bg-card p-4 transition-all hover:border-primary/50",
                    match.result === "won" ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-red-500"
                  )}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-2xl">
                        {match.sportIcon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{match.homeTeam}</span>
                          <span className="text-xl font-bold text-primary">{match.homeScore}</span>
                          <span className="text-muted-foreground">-</span>
                          <span className="text-xl font-bold text-primary">{match.awayScore}</span>
                          <span className="font-semibold">{match.awayTeam}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Link 
                            href={`/leagues/${match.leagueSlug}`}
                            className="hover:text-primary hover:underline"
                          >
                            {match.league}
                          </Link>
                          <span>-</span>
                          <span>{format(match.date, "MMM d, yyyy HH:mm")}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Prediction</p>
                        <p className="font-medium">{match.prediction} @ {match.predictionOdds}</p>
                      </div>
                      <Badge 
                        variant={match.result === "won" ? "default" : "destructive"}
                        className={cn(
                          "px-3 py-1",
                          match.result === "won" ? "bg-emerald-500" : ""
                        )}
                      >
                        {match.result === "won" ? (
                          <><CheckCircle2 className="mr-1 h-3 w-3" /> Won</>
                        ) : (
                          <><XCircle className="mr-1 h-3 w-3" /> Lost</>
                        )}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <img 
                          src={match.tipster.avatar} 
                          alt={match.tipster.name}
                          className="h-8 w-8 rounded-full"
                        />
                        <div className="text-sm">
                          <p className="font-medium">{match.tipster.name}</p>
                          <p className="text-xs text-emerald-500">{match.tipster.winRate}% win</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
