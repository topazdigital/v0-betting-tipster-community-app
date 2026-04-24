"use client"

import { useState, useMemo } from "react"
import { Radio, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SidebarNew } from "@/components/layout/sidebar-new"
import { Spinner } from "@/components/ui/spinner"
import { MatchCardNew } from "@/components/matches/match-card-new"
import { ALL_SPORTS, getSportIcon } from "@/lib/sports-data"
import { useLiveMatches } from "@/lib/hooks/use-matches"
import { countryCodeToFlag } from "@/lib/country-flags"

// Priority order for sports (football first, then by popularity)
const SPORT_PRIORITY: Record<number, number> = {
  1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7, 27: 8, 26: 9, 29: 10, 33: 11,
}

export default function LivePage() {
  const { matches, isLoading, error } = useLiveMatches()
  const [selectedSport, setSelectedSport] = useState<number | null>(null)

  const filteredMatches = selectedSport
    ? matches.filter(m => m.sportId === selectedSport)
    : matches

  // Sport tabs (only sports with live matches)
  const sportCounts = useMemo(() => {
    const counts = ALL_SPORTS.map(sport => ({
      ...sport,
      icon: getSportIcon(sport.slug),
      count: matches.filter(m => m.sportId === sport.id).length,
    })).filter(s => s.count > 0)
    return counts.sort((a, b) => (SPORT_PRIORITY[a.id] ?? 99) - (SPORT_PRIORITY[b.id] ?? 99))
  }, [matches])

  // Group matches by league with metadata
  const groupedMatches = useMemo(() => {
    const groups: Record<string, {
      leagueName: string
      country: string
      countryCode?: string
      sportSlug: string
      matches: typeof matches
    }> = {}
    filteredMatches.forEach(match => {
      const leagueName = match.league?.name || 'Other'
      const key = `${match.sportId}-${leagueName}`
      if (!groups[key]) {
        groups[key] = {
          leagueName,
          country: match.league?.country || '',
          countryCode: match.league?.countryCode,
          sportSlug: match.sport?.slug || 'football',
          matches: [],
        }
      }
      groups[key].matches.push(match)
    })
    // Sort: football first, more matches first
    return Object.values(groups).sort((a, b) => {
      if (a.sportSlug === 'football' && b.sportSlug !== 'football') return -1
      if (b.sportSlug === 'football' && a.sportSlug !== 'football') return 1
      return b.matches.length - a.matches.length
    })
  }, [filteredMatches])

  if (isLoading) {
    return (
      <div className="flex">
        <SidebarNew />
        <div className="flex-1 flex h-96 items-center justify-center">
          <div className="flex items-center gap-3">
            <Spinner className="h-8 w-8" />
            <span className="text-muted-foreground">Loading live matches…</span>
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

  const totalLive = matches.length
  const totalPredictions = matches.reduce((acc, m) => acc + (m.tipsCount || 0), 0)
  const totalWatching = totalPredictions * 10

  return (
    <div className="flex">
      <SidebarNew selectedSportId={selectedSport} onSelectSport={setSelectedSport} />

      <div className="flex-1 overflow-hidden">
        <div className="mx-auto max-w-7xl px-3 py-4 md:px-6 md:py-5">
          {/* Compact Header */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-live"></span>
              </span>
              <h1 className="text-xl font-bold">Live</h1>
              <Badge variant="destructive" className="font-bold">{totalLive}</Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span className="tabular-nums">{totalWatching.toLocaleString()} watching</span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline tabular-nums">{totalPredictions} tips</span>
            </div>
          </div>

          {/* Sport Filter Pills */}
          <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            <Button
              variant={selectedSport === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSport(null)}
              className="shrink-0 h-8 text-xs"
            >
              All
              <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">{matches.length}</Badge>
            </Button>
            {sportCounts.map(sport => (
              <Button
                key={sport.id}
                variant={selectedSport === sport.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSport(sport.id)}
                className="shrink-0 h-8 gap-1.5 text-xs"
              >
                <span className="text-sm leading-none">{sport.icon}</span>
                <span>{sport.name}</span>
                <Badge variant="secondary" className="h-4 px-1 text-[10px]">{sport.count}</Badge>
              </Button>
            ))}
          </div>

          {/* Live Matches grouped by league — DENSE single-column rows */}
          {groupedMatches.length > 0 ? (
            <div className="space-y-3">
              {groupedMatches.map(group => (
                <section key={`${group.sportSlug}-${group.leagueName}`} className="overflow-hidden rounded-xl border border-border bg-card">
                  {/* League header row */}
                  <header className="flex items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-base leading-none">{getSportIcon(group.sportSlug)}</span>
                      {group.countryCode && (
                        <span className="text-sm leading-none">{countryCodeToFlag(group.countryCode)}</span>
                      )}
                      <h2 className="truncate text-sm font-semibold">{group.leagueName}</h2>
                      {group.country && (
                        <span className="hidden text-xs text-muted-foreground sm:inline">· {group.country}</span>
                      )}
                    </div>
                    <Badge variant="destructive" className="h-5 gap-1 px-1.5 text-[10px] font-bold">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white"></span>
                      </span>
                      {group.matches.length}
                    </Badge>
                  </header>
                  {/* Match rows */}
                  <div className="divide-y divide-border">
                    {group.matches.map(match => (
                      <MatchCardNew key={match.id} match={match} variant="compact" />
                    ))}
                  </div>
                </section>
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
