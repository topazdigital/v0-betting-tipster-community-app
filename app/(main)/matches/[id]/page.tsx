"use client"

import { useState, useMemo, use } from "react"
import Link from "next/link"
import { 
  ArrowLeft, Clock, Calendar, Radio, Users, TrendingUp, 
  Share2, Bookmark, Star, CheckCircle2, Trophy, Target, BarChart3
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { SidebarNew } from "@/components/layout/sidebar-new"
import { cn } from "@/lib/utils"
import { ALL_SPORTS, ALL_LEAGUES, TEAMS_DATABASE, getSportIcon, BOOKMAKERS } from "@/lib/sports-data"
import { format, addHours, addDays } from "date-fns"

interface PageProps {
  params: Promise<{ id: string }>
}

// Generate a consistent match based on ID
function generateMatch(id: string) {
  const numId = parseInt(id?.replace(/\D/g, "")) || 1
  const sportIndex = numId % ALL_SPORTS.length
  const sport = ALL_SPORTS[sportIndex]
  
  // Get leagues for this sport
  const sportLeagues = ALL_LEAGUES.filter(l => l.sportId === sport.id)
  const league = sportLeagues.length > 0 
    ? sportLeagues[numId % sportLeagues.length]
    : ALL_LEAGUES[0]
  
  // Get teams for this league
  const leagueTeams = TEAMS_DATABASE.filter(t => t.leagueId === league.id)
  let homeTeam: string
  let awayTeam: string
  
  if (leagueTeams.length >= 2) {
    homeTeam = leagueTeams[numId % leagueTeams.length].name
    awayTeam = leagueTeams[(numId + 1) % leagueTeams.length].name
  } else {
    homeTeam = `${league.country} Team ${numId}`
    awayTeam = `${league.country} Team ${numId + 1}`
  }
  
  const statuses = ["scheduled", "live", "finished"] as const
  const status = statuses[numId % 3]
  
  // Generate kickoff time based on status
  let kickoff: Date
  if (status === "scheduled") {
    kickoff = addHours(new Date(), (numId % 48) + 1)
  } else if (status === "live") {
    kickoff = addHours(new Date(), -1)
  } else {
    kickoff = addDays(new Date(), -(numId % 7))
  }

  return {
    id,
    sportId: sport.id,
    sport: sport.name,
    sportSlug: sport.slug,
    sportIcon: getSportIcon(sport.slug),
    leagueId: league.id,
    league: league.name,
    country: league.country,
    countryCode: league.countryCode,
    homeTeam,
    awayTeam,
    homeScore: status !== "scheduled" ? Math.floor(Math.random() * 5) : null,
    awayScore: status !== "scheduled" ? Math.floor(Math.random() * 5) : null,
    status,
    kickoff,
    minute: status === "live" ? Math.floor(Math.random() * 90) + 1 : null,
    venue: "Stadium Arena",
    referee: "John Smith",
    weather: "Sunny, 22C",
    homeOdds: (1.5 + Math.random() * 2).toFixed(2),
    drawOdds: (2.5 + Math.random() * 2).toFixed(2),
    awayOdds: (2 + Math.random() * 3).toFixed(2),
    predictions: Math.floor(50 + Math.random() * 200),
    viewers: Math.floor(500 + Math.random() * 5000)
  }
}

// Generate bookmaker odds
const generateBookmakerOdds = () => {
  return BOOKMAKERS.filter(b => b.featured).slice(0, 6).map(b => ({
    name: b.name,
    slug: b.slug,
    homeOdds: (1.5 + Math.random() * 2).toFixed(2),
    drawOdds: (2.5 + Math.random() * 2).toFixed(2),
    awayOdds: (2 + Math.random() * 3).toFixed(2),
    affiliateUrl: b.affiliateUrl
  }))
}

// Generate tips
const generateTips = () => Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  tipster: {
    id: i + 100,
    name: ["KingOfTips", "AcePredicts", "LuckyStriker", "EuroExpert", "ProBetter", "OddsWizard", "TipMaster", "BetKing"][i],
    winRate: 55 + Math.floor(Math.random() * 30),
    verified: i % 3 === 0,
    roi: (5 + Math.random() * 15).toFixed(1)
  },
  prediction: ["Home Win", "Away Win", "Draw", "Over 2.5", "BTTS Yes", "Under 2.5", "Home +1", "Away +1"][i],
  market: ["1X2", "Over/Under", "BTTS", "Asian Handicap", "Double Chance"][i % 5],
  odds: (1.5 + Math.random() * 2).toFixed(2),
  confidence: 60 + Math.floor(Math.random() * 35),
  analysis: [
    "Based on recent form - home team has won 4 of last 5 matches.",
    "Head-to-head record favors away team in this fixture.",
    "Both teams have scored in 8 of their last 10 games.",
    "Home team defensive record suggests low-scoring game.",
    "Away team struggling on the road - 1 win in 6 away games."
  ][i % 5],
  likes: Math.floor(Math.random() * 100),
  createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
}))

// Generate H2H stats
const generateH2H = () => ({
  played: 10,
  homeWins: Math.floor(Math.random() * 5) + 2,
  draws: Math.floor(Math.random() * 3),
  awayWins: Math.floor(Math.random() * 5) + 1,
  recentMatches: Array.from({ length: 5 }, (_, i) => ({
    date: addDays(new Date(), -(i + 1) * 30).toISOString(),
    homeScore: Math.floor(Math.random() * 4),
    awayScore: Math.floor(Math.random() * 4),
    competition: "League Match"
  }))
})

// Generate match stats
const generateStats = () => [
  { name: "Possession", home: 55 + Math.floor(Math.random() * 15), away: 30 + Math.floor(Math.random() * 15) },
  { name: "Shots", home: Math.floor(Math.random() * 15) + 5, away: Math.floor(Math.random() * 15) + 3 },
  { name: "Shots on Target", home: Math.floor(Math.random() * 8) + 2, away: Math.floor(Math.random() * 8) + 1 },
  { name: "Corners", home: Math.floor(Math.random() * 8) + 2, away: Math.floor(Math.random() * 8) + 1 },
  { name: "Fouls", home: Math.floor(Math.random() * 15) + 5, away: Math.floor(Math.random() * 15) + 5 },
]

export default function MatchDetailPage({ params }: PageProps) {
  const { id } = use(params)
  
  const match = useMemo(() => generateMatch(id), [id])
  const bookmakerOdds = useMemo(() => generateBookmakerOdds(), [])
  const tips = useMemo(() => generateTips(), [])
  const h2h = useMemo(() => generateH2H(), [])
  const stats = useMemo(() => generateStats(), [])
  
  const [savedMatch, setSavedMatch] = useState(false)
  const [activeTab, setActiveTab] = useState("odds")

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

          {/* Match Header Card */}
          <Card className="mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-transparent p-6">
              {/* Top Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{match.sportIcon}</span>
                  <div>
                    <p className="font-semibold">{match.league}</p>
                    <p className="text-sm text-muted-foreground">{match.country} • {match.venue}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {match.status === "live" && (
                    <Badge variant="destructive" className="gap-1 animate-pulse">
                      <Radio className="h-3 w-3" />
                      LIVE {match.minute}&apos;
                    </Badge>
                  )}

                  {match.status === "scheduled" && (
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {format(match.kickoff, "dd MMM HH:mm")}
                    </Badge>
                  )}

                  {match.status === "finished" && (
                    <Badge className="gap-1 bg-success text-success-foreground">
                      <CheckCircle2 className="h-3 w-3" />
                      FT
                    </Badge>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSavedMatch(!savedMatch)}
                  >
                    <Bookmark className={cn("h-5 w-5", savedMatch && "fill-current")} />
                  </Button>

                  <Button variant="ghost" size="icon">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Teams & Score */}
              <div className="mt-8 grid grid-cols-3 items-center gap-4">
                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-card text-2xl font-bold">
                    {match.homeTeam.substring(0, 2).toUpperCase()}
                  </div>
                  <h2 className="font-bold text-lg">{match.homeTeam}</h2>
                  <p className="text-sm text-muted-foreground">Home</p>
                </div>

                <div className="text-center">
                  {match.status !== "scheduled" ? (
                    <div className="text-5xl font-bold">
                      <span className={cn(
                        match.homeScore! > match.awayScore! && "text-success"
                      )}>{match.homeScore}</span>
                      <span className="mx-2 text-muted-foreground">-</span>
                      <span className={cn(
                        match.awayScore! > match.homeScore! && "text-success"
                      )}>{match.awayScore}</span>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl font-bold">
                        {format(match.kickoff, "HH:mm")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(match.kickoff, "dd MMMM yyyy")}
                      </div>
                    </div>
                  )}
                  {match.status === "live" && (
                    <Badge variant="outline" className="mt-2">
                      <Clock className="mr-1 h-3 w-3 text-live" />
                      {match.minute}&apos; min
                    </Badge>
                  )}
                </div>

                <div className="text-center">
                  <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-card text-2xl font-bold">
                    {match.awayTeam.substring(0, 2).toUpperCase()}
                  </div>
                  <h2 className="font-bold text-lg">{match.awayTeam}</h2>
                  <p className="text-sm text-muted-foreground">Away</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {match.viewers.toLocaleString()} watching
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  {match.predictions} predictions
                </div>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="odds">Odds</TabsTrigger>
              <TabsTrigger value="tips">Tips ({tips.length})</TabsTrigger>
              <TabsTrigger value="h2h">H2H</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>

            {/* Odds Tab */}
            <TabsContent value="odds" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-warning" />
                    Odds Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="pb-3 text-left font-medium text-muted-foreground">Bookmaker</th>
                          <th className="pb-3 text-center font-medium text-muted-foreground">1 (Home)</th>
                          <th className="pb-3 text-center font-medium text-muted-foreground">X (Draw)</th>
                          <th className="pb-3 text-center font-medium text-muted-foreground">2 (Away)</th>
                          <th className="pb-3 text-right font-medium text-muted-foreground"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookmakerOdds.map((b, idx) => (
                          <tr key={b.slug} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded bg-muted font-bold text-xs">
                                  {b.name.charAt(0)}
                                </div>
                                <span className="font-medium">{b.name}</span>
                              </div>
                            </td>
                            <td className="py-3 text-center">
                              <span className={cn(
                                "rounded-lg px-3 py-1 font-mono font-bold",
                                idx === 0 && "bg-success/10 text-success"
                              )}>
                                {b.homeOdds}
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              <span className="rounded-lg px-3 py-1 font-mono font-bold">
                                {b.drawOdds}
                              </span>
                            </td>
                            <td className="py-3 text-center">
                              <span className={cn(
                                "rounded-lg px-3 py-1 font-mono font-bold",
                                idx === 1 && "bg-success/10 text-success"
                              )}>
                                {b.awayOdds}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <Button size="sm" variant="outline" asChild>
                                <a href={b.affiliateUrl} target="_blank" rel="noopener noreferrer">
                                  Bet
                                </a>
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tips Tab */}
            <TabsContent value="tips" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Expert Predictions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tips.map((tip) => (
                    <div key={tip.id} className="rounded-lg border p-4 transition-colors hover:bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                            {tip.tipster.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{tip.tipster.name}</span>
                              {tip.tipster.verified && (
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="text-success">{tip.tipster.winRate}% win rate</span>
                              <span>•</span>
                              <span>+{tip.tipster.roi}% ROI</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="mb-1">
                            {tip.market}
                          </Badge>
                          <div className="font-mono text-lg font-bold text-primary">
                            @{tip.odds}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge>{tip.prediction}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {tip.confidence}% confidence
                          </span>
                        </div>
                        <Progress value={tip.confidence} className="h-1.5 mb-2" />
                        <p className="text-sm text-muted-foreground">{tip.analysis}</p>
                      </div>
                      
                      <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                        <button className="flex items-center gap-1 hover:text-primary">
                          <Star className="h-4 w-4" />
                          {tip.likes}
                        </button>
                        <span>{format(tip.createdAt, "HH:mm")}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* H2H Tab */}
            <TabsContent value="h2h" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Head to Head
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 grid grid-cols-3 gap-4 text-center">
                    <div className="rounded-lg bg-success/10 p-4">
                      <div className="text-3xl font-bold text-success">{h2h.homeWins}</div>
                      <div className="text-sm text-muted-foreground">{match.homeTeam} Wins</div>
                    </div>
                    <div className="rounded-lg bg-muted p-4">
                      <div className="text-3xl font-bold">{h2h.draws}</div>
                      <div className="text-sm text-muted-foreground">Draws</div>
                    </div>
                    <div className="rounded-lg bg-primary/10 p-4">
                      <div className="text-3xl font-bold text-primary">{h2h.awayWins}</div>
                      <div className="text-sm text-muted-foreground">{match.awayTeam} Wins</div>
                    </div>
                  </div>
                  
                  <h4 className="font-semibold mb-3">Recent Meetings</h4>
                  <div className="space-y-2">
                    {h2h.recentMatches.map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(m.date), "dd MMM yyyy")}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{match.homeTeam}</span>
                          <span className="font-mono font-bold">
                            {m.homeScore} - {m.awayScore}
                          </span>
                          <span className="font-medium">{match.awayTeam}</span>
                        </div>
                        <Badge variant="outline">{m.competition}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Match Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {stats.map((stat) => (
                    <div key={stat.name}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium">{stat.home}</span>
                        <span className="text-muted-foreground">{stat.name}</span>
                        <span className="font-medium">{stat.away}</span>
                      </div>
                      <div className="flex gap-1">
                        <div 
                          className="h-2 rounded-l bg-primary" 
                          style={{ width: `${(stat.home / (stat.home + stat.away)) * 100}%` }}
                        />
                        <div 
                          className="h-2 rounded-r bg-muted" 
                          style={{ width: `${(stat.away / (stat.home + stat.away)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
