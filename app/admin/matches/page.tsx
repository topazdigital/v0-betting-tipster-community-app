"use client"

import { useState, useEffect } from "react"
import { Search, Plus, MoreHorizontal, Edit, Trash2, Loader2, X, CheckCircle2 } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ALL_SPORTS, ALL_LEAGUES, TEAMS_DATABASE } from "@/lib/sports-data"
import { format } from "date-fns"

interface Match {
  id: number
  home_team_name: string
  away_team_name: string
  home_team_logo?: string
  away_team_logo?: string
  league_name: string
  sport_name: string
  sport_icon: string
  status: string
  home_score: number | null
  away_score: number | null
  kickoff_time: string
}

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sportFilter, setSportFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  
  // Form state for adding match
  const [newMatch, setNewMatch] = useState({
    sportId: "",
    leagueId: "",
    homeTeamId: "",
    awayTeamId: "",
    kickoffDate: "",
    kickoffTime: "",
    homeOdds: "",
    drawOdds: "",
    awayOdds: ""
  })

  // Load matches from API or fallback to generated data
  useEffect(() => {
    async function loadMatches() {
      try {
        const response = await fetch('/api/admin/matches')
        if (response.ok) {
          const data = await response.json()
          if (data.matches && data.matches.length > 0) {
            setMatches(data.matches)
          } else {
            // Use generated fallback data
            setMatches(generateFallbackMatches())
          }
        } else {
          setMatches(generateFallbackMatches())
        }
      } catch {
        setMatches(generateFallbackMatches())
      } finally {
        setIsLoading(false)
      }
    }
    
    loadMatches()
  }, [])

  function generateFallbackMatches(): Match[] {
    const safeSports = Array.isArray(ALL_SPORTS) ? ALL_SPORTS : []
    const safeLeagues = Array.isArray(ALL_LEAGUES) ? ALL_LEAGUES : []
    const safeTeams = Array.isArray(TEAMS_DATABASE) ? TEAMS_DATABASE : []
    
    return Array.from({ length: 30 }, (_, i) => {
      const sport = safeSports[i % safeSports.length] || { name: "Football", icon: "soccer" }
      const league = safeLeagues.filter(l => l.sportId === sport.id)[0] || safeLeagues[0] || { name: "League" }
      const leagueTeams = safeTeams.filter(t => t.leagueId === league.id)
      
      const statuses = ["scheduled", "live", "finished"]
      const status = statuses[i % 3]
      const kickoff = new Date()
      kickoff.setHours(kickoff.getHours() + (i - 15))

      return {
        id: i + 1,
        home_team_name: leagueTeams[0]?.name || `Home Team ${i + 1}`,
        away_team_name: leagueTeams[1]?.name || `Away Team ${i + 1}`,
        league_name: league.name,
        sport_name: sport.name,
        sport_icon: sport.icon || "soccer",
        status,
        home_score: status !== "scheduled" ? Math.floor(Math.random() * 5) : null,
        away_score: status !== "scheduled" ? Math.floor(Math.random() * 5) : null,
        kickoff_time: kickoff.toISOString()
      }
    })
  }

  const filteredMatches = matches.filter((match) => {
    if (searchQuery && 
        !match.home_team_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !match.away_team_name.toLowerCase().includes(searchQuery.toLowerCase())
    ) return false
    if (sportFilter !== "all" && match.sport_name !== sportFilter) return false
    if (statusFilter !== "all" && match.status !== statusFilter) return false
    return true
  })

  // Get filtered leagues and teams based on sport selection
  const filteredLeagues = newMatch.sportId 
    ? ALL_LEAGUES.filter(l => l.sportId === parseInt(newMatch.sportId))
    : []
  
  const filteredTeams = newMatch.leagueId
    ? TEAMS_DATABASE.filter(t => t.leagueId === parseInt(newMatch.leagueId))
    : []

  const handleAddMatch = async () => {
    if (!newMatch.leagueId || !newMatch.homeTeamId || !newMatch.awayTeamId || !newMatch.kickoffDate || !newMatch.kickoffTime) {
      setSaveMessage("Please fill in all required fields")
      return
    }
    
    setIsSaving(true)
    setSaveMessage("")
    
    try {
      const kickoffTime = `${newMatch.kickoffDate}T${newMatch.kickoffTime}:00`
      
      const response = await fetch('/api/admin/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leagueId: parseInt(newMatch.leagueId),
          homeTeamId: parseInt(newMatch.homeTeamId),
          awayTeamId: parseInt(newMatch.awayTeamId),
          kickoffTime,
          homeOdds: newMatch.homeOdds ? parseFloat(newMatch.homeOdds) : undefined,
          drawOdds: newMatch.drawOdds ? parseFloat(newMatch.drawOdds) : undefined,
          awayOdds: newMatch.awayOdds ? parseFloat(newMatch.awayOdds) : undefined
        })
      })
      
      if (response.ok) {
        setSaveMessage("Match created successfully!")
        
        // Add to local list
        const homeTeam = TEAMS_DATABASE.find(t => t.id === parseInt(newMatch.homeTeamId))
        const awayTeam = TEAMS_DATABASE.find(t => t.id === parseInt(newMatch.awayTeamId))
        const league = ALL_LEAGUES.find(l => l.id === parseInt(newMatch.leagueId))
        const sport = ALL_SPORTS.find(s => s.id === parseInt(newMatch.sportId))
        
        const newMatchData: Match = {
          id: Date.now(),
          home_team_name: homeTeam?.name || 'Home Team',
          away_team_name: awayTeam?.name || 'Away Team',
          league_name: league?.name || 'League',
          sport_name: sport?.name || 'Football',
          sport_icon: sport?.icon || 'soccer',
          status: 'scheduled',
          home_score: null,
          away_score: null,
          kickoff_time: kickoffTime
        }
        
        setMatches(prev => [newMatchData, ...prev])
        
        // Reset form after delay
        setTimeout(() => {
          setShowAddDialog(false)
          setNewMatch({
            sportId: "",
            leagueId: "",
            homeTeamId: "",
            awayTeamId: "",
            kickoffDate: "",
            kickoffTime: "",
            homeOdds: "",
            drawOdds: "",
            awayOdds: ""
          })
          setSaveMessage("")
        }, 1500)
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create match')
      }
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Failed to create match')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteMatch = async (matchId: number) => {
    if (!confirm('Are you sure you want to delete this match?')) return
    
    try {
      await fetch(`/api/admin/matches?id=${matchId}`, { method: 'DELETE' })
      setMatches(prev => prev.filter(m => m.id !== matchId))
    } catch (error) {
      console.error('Failed to delete match:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Matches Management</h1>
          <p className="text-muted-foreground">Add and manage matches across all sports</p>
        </div>

        <Button className="gap-2" onClick={() => setShowAddDialog(true)}>
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
              {matches.filter(m => m.status === "live").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Scheduled</p>
            <p className="text-2xl font-bold text-blue-500">
              {matches.filter(m => m.status === "scheduled").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Finished</p>
            <p className="text-2xl font-bold text-emerald-500">
              {matches.filter(m => m.status === "finished").length}
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
                {ALL_SPORTS.slice(0, 15).map((sport) => (
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
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMatches.map((match) => (
                  <tr key={match.id} className="border-b hover:bg-muted/30">
                    <td className="p-4">
                      <p className="font-medium">
                        {match.home_team_name} vs {match.away_team_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{match.league_name}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-xl">{match.sport_icon}</span> {match.sport_name}
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          match.status === "live" ? "destructive" :
                          match.status === "finished" ? "default" : "secondary"
                        }
                      >
                        {match.status}
                      </Badge>
                    </td>
                    <td className="p-4 font-bold">
                      {match.home_score !== null ? `${match.home_score} - ${match.away_score}` : "-"}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {format(new Date(match.kickoff_time), "MMM d, HH:mm")}
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-500"
                            onClick={() => handleDeleteMatch(match.id)}
                          >
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

      {/* Add Match Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Match</DialogTitle>
            <DialogDescription>
              Create a new match by selecting the sport, league, and teams.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sport *</Label>
                <select
                  value={newMatch.sportId}
                  onChange={(e) => setNewMatch({ 
                    ...newMatch, 
                    sportId: e.target.value,
                    leagueId: "",
                    homeTeamId: "",
                    awayTeamId: ""
                  })}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
                >
                  <option value="">Select Sport</option>
                  {ALL_SPORTS.map((sport) => (
                    <option key={sport.id} value={sport.id}>
                      {sport.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label>League *</Label>
                <select
                  value={newMatch.leagueId}
                  onChange={(e) => setNewMatch({ 
                    ...newMatch, 
                    leagueId: e.target.value,
                    homeTeamId: "",
                    awayTeamId: ""
                  })}
                  disabled={!newMatch.sportId}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm disabled:opacity-50"
                >
                  <option value="">Select League</option>
                  {filteredLeagues.map((league) => (
                    <option key={league.id} value={league.id}>
                      {league.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Home Team *</Label>
                <select
                  value={newMatch.homeTeamId}
                  onChange={(e) => setNewMatch({ ...newMatch, homeTeamId: e.target.value })}
                  disabled={!newMatch.leagueId}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm disabled:opacity-50"
                >
                  <option value="">Select Home Team</option>
                  {filteredTeams.filter(t => t.id.toString() !== newMatch.awayTeamId).map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label>Away Team *</Label>
                <select
                  value={newMatch.awayTeamId}
                  onChange={(e) => setNewMatch({ ...newMatch, awayTeamId: e.target.value })}
                  disabled={!newMatch.leagueId}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm disabled:opacity-50"
                >
                  <option value="">Select Away Team</option>
                  {filteredTeams.filter(t => t.id.toString() !== newMatch.homeTeamId).map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kickoff Date *</Label>
                <Input
                  type="date"
                  value={newMatch.kickoffDate}
                  onChange={(e) => setNewMatch({ ...newMatch, kickoffDate: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Kickoff Time *</Label>
                <Input
                  type="time"
                  value={newMatch.kickoffTime}
                  onChange={(e) => setNewMatch({ ...newMatch, kickoffTime: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Home Odds</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="2.10"
                  value={newMatch.homeOdds}
                  onChange={(e) => setNewMatch({ ...newMatch, homeOdds: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Draw Odds</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="3.40"
                  value={newMatch.drawOdds}
                  onChange={(e) => setNewMatch({ ...newMatch, drawOdds: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Away Odds</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="3.10"
                  value={newMatch.awayOdds}
                  onChange={(e) => setNewMatch({ ...newMatch, awayOdds: e.target.value })}
                />
              </div>
            </div>
            
            {saveMessage && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                saveMessage.includes('success') 
                  ? 'bg-success/10 text-success' 
                  : 'bg-destructive/10 text-destructive'
              }`}>
                {saveMessage.includes('success') ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                {saveMessage}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMatch} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Match
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
