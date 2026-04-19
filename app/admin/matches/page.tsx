"use client"

import { useState } from "react"
import { Search, Plus, MoreHorizontal, Clock, Radio, CheckCircle2, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import { ALL_SPORTS } from "@/lib/sports-data"
import { format, addHours } from "date-fns"

// SAFE fallback
const safeSports = Array.isArray(ALL_SPORTS) ? ALL_SPORTS : []

const matches = Array.from({ length: 30 }, (_, i) => {
  const sport =
    safeSports.length > 0
      ? safeSports[i % safeSports.length]
      : {
          name: "Unknown Sport",
          icon: "⚽",
          leagues: ["Unknown League"],
        }

  const statuses = ["scheduled", "live", "finished"] as const
  const status = statuses[i % 3]

  return {
    id: i + 1,
    sport: sport?.name ?? "Unknown Sport",
    sportIcon: sport?.icon ?? "⚽",
    league: sport?.leagues?.[0] ?? "Unknown League",

    homeTeam: `Home Team ${i + 1}`,
    awayTeam: `Away Team ${i + 1}`,

    homeScore:
      status !== "scheduled" ? Math.floor(Math.random() * 5) : null,
    awayScore:
      status !== "scheduled" ? Math.floor(Math.random() * 5) : null,

    status,
    kickoff: addHours(new Date(), i - 15),
    predictions: Math.floor(Math.random() * 200),

    homeOdds: (1.5 + Math.random() * 2).toFixed(2),
    drawOdds: (2.5 + Math.random() * 2).toFixed(2),
    awayOdds: (2 + Math.random() * 3).toFixed(2),
  }
})

export default function AdminMatchesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sportFilter, setSportFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredMatches = matches.filter((match) => {
    if (
      searchQuery &&
      !match.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !match.awayTeam.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false

    if (sportFilter !== "all" && match.sport !== sportFilter) return false
    if (statusFilter !== "all" && match.status !== statusFilter) return false

    return true
  })

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Matches Management</h1>
          <p className="text-muted-foreground">
            Add and manage matches across all sports
          </p>
        </div>

        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Match
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Matches</p>
            <p className="text-2xl font-bold">{matches.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Live Now</p>
            <p className="text-2xl font-bold text-red-500">
              {matches.filter((m) => m.status === "live").length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Scheduled</p>
            <p className="text-2xl font-bold text-blue-500">
              {matches.filter((m) => m.status === "scheduled").length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Finished</p>
            <p className="text-2xl font-bold text-emerald-500">
              {matches.filter((m) => m.status === "finished").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search matches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value="all">All Sports</option>
                {safeSports.slice(0, 15).map((sport) => (
                  <option key={sport.id} value={sport.name}>
                    {sport.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="finished">Finished</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">

              <thead>
                <tr className="border-b bg-muted/50 text-left text-sm text-muted-foreground">
                  <th className="p-4">Match</th>
                  <th className="p-4">Sport</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Score</th>
                  <th className="p-4">Kickoff</th>
                  <th className="p-4">Odds</th>
                  <th className="p-4">Predictions</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredMatches.map((match) => (
                  <tr key={match.id} className="border-b hover:bg-muted/30">

                    <td className="p-4">
                      <p className="font-medium">
                        {match.homeTeam} vs {match.awayTeam}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {match.league}
                      </p>
                    </td>

                    <td className="p-4">
                      <span className="text-xl">{match.sportIcon}</span>{" "}
                      {match.sport}
                    </td>

                    <td className="p-4">
                      <Badge>{match.status}</Badge>
                    </td>

                    <td className="p-4 font-bold">
                      {match.homeScore !== null
                        ? `${match.homeScore} - ${match.awayScore}`
                        : "-"}
                    </td>

                    <td className="p-4 text-sm text-muted-foreground">
                      {format(match.kickoff, "MMM d, HH:mm")}
                    </td>

                    <td className="p-4 text-xs">
                      {match.homeOdds} / {match.drawOdds} / {match.awayOdds}
                    </td>

                    <td className="p-4">{match.predictions}</td>

                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem className="text-red-500">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>

                      </DropdownMenu>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}