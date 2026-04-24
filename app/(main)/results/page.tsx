"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Calendar, CheckCircle2, XCircle, Trophy, TrendingUp, Search, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { TeamLogo } from "@/components/ui/team-logo"
import { cn } from "@/lib/utils"
import { ALL_SPORTS, getSportIcon } from "@/lib/sports-data"
import { useFinishedMatches, groupMatchesByLeague } from "@/lib/hooks/use-matches"

// Sort sports by priority (football first)
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

const sortedSports = [...ALL_SPORTS].sort((a, b) => {
  const priorityA = SPORT_PRIORITY[a.id] ?? 99
  const priorityB = SPORT_PRIORITY[b.id] ?? 99
  return priorityA - priorityB
})

export default function ResultsPage() {
  const [selectedSport, setSelectedSport] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateRange, setDateRange] = useState("7")

  const { matches: finishedMatches, isLoading } = useFinishedMatches()

  const filteredResults = useMemo(() => {
    return finishedMatches.filter(match => {
      if (selectedSport !== "all" && match.sportId.toString() !== selectedSport) return false
      if (searchQuery && 
          !match.homeTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !match.awayTeam.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [finishedMatches, selectedSport, searchQuery])

  // Group results by sport
  const groupedResults = useMemo(() => {
    const groups: Record<string, typeof filteredResults> = {}
    
    filteredResults.forEach(match => {
      const sportIcon = getSportIcon(match.sport?.slug || 'football')
      const key = `${sportIcon} ${match.sport?.name || 'Football'}`
      if (!groups[key]) groups[key] = []
      groups[key].push(match)
    })
    
    // Sort groups by sport priority
    return Object.entries(groups).sort((a, b) => {
      const sportA = filteredResults.find(m => `${getSportIcon(m.sport?.slug || 'football')} ${m.sport?.name || 'Football'}` === a[0])
      const sportB = filteredResults.find(m => `${getSportIcon(m.sport?.slug || 'football')} ${m.sport?.name || 'Football'}` === b[0])
      const priorityA = SPORT_PRIORITY[sportA?.sportId || 99] ?? 99
      const priorityB = SPORT_PRIORITY[sportB?.sportId || 99] ?? 99
      return priorityA - priorityB
    })
  }, [filteredResults])

  // Get sport counts for filter
  const sportCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    finishedMatches.forEach(m => {
      const id = m.sportId.toString()
      counts[id] = (counts[id] || 0) + 1
    })
    return counts
  }, [finishedMatches])

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Results</h1>
          <p className="text-muted-foreground">View finished match results across all sports</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Results</p>
              <p className="text-xl font-bold">{filteredResults.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sports Covered</p>
              <p className="text-xl font-bold text-emerald-500">{Object.keys(sportCounts).length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Leagues</p>
              <p className="text-xl font-bold text-blue-500">
                {new Set(filteredResults.map(m => m.leagueId)).size}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <TrendingUp className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Goals</p>
              <p className="text-xl font-bold text-amber-500">
                {filteredResults.length > 0 
                  ? (filteredResults.reduce((acc, m) => acc + (m.homeScore || 0) + (m.awayScore || 0), 0) / filteredResults.length).toFixed(1)
                  : '0'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
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
            <option value="all">All Sports ({finishedMatches.length})</option>
            {sortedSports.filter(sport => sportCounts[sport.id.toString()]).map(sport => (
              <option key={sport.id} value={sport.id.toString()}>
                {getSportIcon(sport.slug)} {sport.name} ({sportCounts[sport.id.toString()] || 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results grouped by sport */}
      {filteredResults.length > 0 ? (
        <div className="space-y-8">
          {groupedResults.map(([sportName, matches]) => (
            <div key={sportName}>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                {sportName}
                <Badge variant="secondary">{matches.length}</Badge>
              </h2>
              <div className="space-y-3">
                {matches.map((match) => (
                  <Link
                    key={match.id}
                    href={`/matches/${match.id}`}
                    className="block"
                  >
                    <div className="rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-2xl">
                            {getSportIcon(match.sport?.slug || 'football')}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <TeamLogo teamName={match.homeTeam.name} logoUrl={match.homeTeam.logo} size="sm" />
                              <span className="font-semibold">{match.homeTeam.name}</span>
                              <span className="text-xl font-bold text-primary">{match.homeScore ?? 0}</span>
                              <span className="text-muted-foreground">-</span>
                              <span className="text-xl font-bold text-primary">{match.awayScore ?? 0}</span>
                              <span className="font-semibold">{match.awayTeam.name}</span>
                              <TeamLogo teamName={match.awayTeam.name} logoUrl={match.awayTeam.logo} size="sm" />
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{match.league?.name || 'League'}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(match.kickoffTime), "MMM d, yyyy HH:mm")}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            FT
                          </Badge>
                          {match.odds && (
                            <div className="flex gap-2 text-sm">
                              <span className="rounded bg-muted px-2 py-1">
                                H: {match.odds.home?.toFixed(2)}
                              </span>
                              {match.odds.draw && (
                                <span className="rounded bg-muted px-2 py-1">
                                  D: {match.odds.draw.toFixed(2)}
                                </span>
                              )}
                              <span className="rounded bg-muted px-2 py-1">
                                A: {match.odds.away?.toFixed(2)}
                              </span>
                            </div>
                          )}
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
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No results found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {searchQuery 
              ? "Try adjusting your search query"
              : "No finished matches to display yet"
            }
          </p>
          {searchQuery && (
            <Button className="mt-4" onClick={() => setSearchQuery('')}>
              Clear Search
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
