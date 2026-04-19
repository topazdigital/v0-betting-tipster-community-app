"use client"

import { useState } from "react"
import { format, subDays } from "date-fns"
import { Calendar, CheckCircle2, XCircle, Trophy, TrendingUp, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { SPORTS_LIST } from "@/lib/sports-data"

const resultMatches = Array.from({ length: 50 }, (_, i) => {
  const sportIndex = i % SPORTS_LIST.length
  const sport = SPORTS_LIST[sportIndex]
  const isWin = Math.random() > 0.4
  const homeScore = Math.floor(Math.random() * 5)
  const awayScore = Math.floor(Math.random() * 5)
  
  return {
    id: `result-${i}`,
    sport: sport.id,
    sportName: sport.name,
    sportIcon: sport.icon,
    league: sport.leagues[Math.floor(Math.random() * sport.leagues.length)],
    homeTeam: `Team ${i * 2 + 1}`,
    awayTeam: `Team ${i * 2 + 2}`,
    homeScore,
    awayScore,
    date: subDays(new Date(), Math.floor(i / 5)),
    prediction: isWin ? "Home Win" : "Away Win",
    predictionOdds: (1.5 + Math.random() * 2).toFixed(2),
    result: isWin ? "won" : "lost",
    tipster: {
      name: `Tipster${(i % 10) + 1}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=tipster${i % 10}`,
      winRate: 55 + Math.floor(Math.random() * 30)
    }
  }
})

export default function ResultsPage() {
  const [selectedSport, setSelectedSport] = useState<string>("all")
  const [selectedResult, setSelectedResult] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState("7")

  const filteredResults = resultMatches.filter(match => {
    if (selectedSport !== "all" && match.sport !== selectedSport) return false
    if (selectedResult !== "all" && match.result !== selectedResult) return false
    if (searchQuery && !match.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !match.awayTeam.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const stats = {
    total: filteredResults.length,
    won: filteredResults.filter(m => m.result === "won").length,
    lost: filteredResults.filter(m => m.result === "lost").length,
    winRate: Math.round((filteredResults.filter(m => m.result === "won").length / filteredResults.length) * 100) || 0
  }

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
            {SPORTS_LIST.slice(0, 15).map(sport => (
              <option key={sport.id} value={sport.id}>{sport.name}</option>
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

      <div className="space-y-3">
        {filteredResults.map((match) => (
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
                    <span>{match.league}</span>
                    <span>-</span>
                    <span>{format(match.date, "MMM d, yyyy")}</span>
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
  )
}
