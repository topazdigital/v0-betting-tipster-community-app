"use client"

import { useState, use } from "react"
import Link from "next/link"
import useSWR from "swr"
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
import { Spinner } from "@/components/ui/spinner"
import { TeamLogo } from "@/components/ui/team-logo"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface PageProps {
  params: Promise<{ id: string }>
}

// Fetcher for match data
const matchFetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch match')
  return res.json()
}

// Generate tips (still mock for now, can be replaced with real API later)
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

export default function MatchDetailPage({ params }: PageProps) {
  const { id } = use(params)
  
  // Fetch match data from API
  const { data, error, isLoading } = useSWR(
    `/api/matches/${encodeURIComponent(id)}`,
    matchFetcher,
    { refreshInterval: 10000 } // Refresh every 10 seconds for live matches
  )
  
  const [savedMatch, setSavedMatch] = useState(false)
  const [activeTab, setActiveTab] = useState("odds")
  
  const tips = generateTips()

  if (isLoading) {
    return (
      <div className="flex">
        <SidebarNew />
        <div className="flex-1 flex h-96 items-center justify-center">
          <div className="flex items-center gap-3">
            <Spinner className="h-8 w-8" />
            <span className="text-muted-foreground">Loading match details...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data?.match) {
    return (
      <div className="flex">
        <SidebarNew />
        <div className="flex-1 p-8 text-center">
          <h1 className="text-2xl font-bold">Match not found</h1>
          <p className="text-muted-foreground mt-2">The match you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Button asChild className="mt-4">
            <Link href="/matches">Back to Matches</Link>
          </Button>
        </div>
      </div>
    )
  }

  const { match, bookmakerOdds, h2h, stats } = data

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
                  <span className="text-2xl">{match.sport?.icon || '⚽'}</span>
                  <div>
                    <p className="font-semibold">{match.league?.name || 'Unknown League'}</p>
                    <p className="text-sm text-muted-foreground">
                      {match.league?.country || 'Unknown'} 
                      {match.venue && ` • ${match.venue}`}
                    </p>
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
                      {format(new Date(match.kickoffTime), "dd MMM HH:mm")}
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
                  <TeamLogo 
                    teamName={match.homeTeam.name} 
                    logoUrl={match.homeTeam.logo} 
                    size="lg"
                    className="mx-auto mb-2"
                  />
                  <h2 className="font-bold text-lg">{match.homeTeam.name}</h2>
                  <p className="text-sm text-muted-foreground">Home</p>
                </div>

                <div className="text-center">
                  {match.status !== "scheduled" ? (
                    <div className="text-5xl font-bold">
                      <span className={cn(
                        match.homeScore > match.awayScore && "text-success"
                      )}>{match.homeScore}</span>
                      <span className="mx-2 text-muted-foreground">-</span>
                      <span className={cn(
                        match.awayScore > match.homeScore && "text-success"
                      )}>{match.awayScore}</span>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl font-bold">
                        {format(new Date(match.kickoffTime), "HH:mm")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(match.kickoffTime), "dd MMMM yyyy")}
                      </div>
                    </div>
                  )}
                  {match.status === "live" && match.minute && (
                    <Badge variant="outline" className="mt-2">
                      <Clock className="mr-1 h-3 w-3 text-live" />
                      {match.minute}&apos; min
                    </Badge>
                  )}
                </div>

                <div className="text-center">
                  <TeamLogo 
                    teamName={match.awayTeam.name} 
                    logoUrl={match.awayTeam.logo} 
                    size="lg"
                    className="mx-auto mb-2"
                  />
                  <h2 className="font-bold text-lg">{match.awayTeam.name}</h2>
                  <p className="text-sm text-muted-foreground">Away</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {Math.floor(Math.random() * 5000 + 500).toLocaleString()} watching
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  {match.tipsCount || Math.floor(Math.random() * 200 + 50)} predictions
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
                        {bookmakerOdds?.map((b: { slug: string; name: string; homeOdds: number; drawOdds: number; awayOdds: number; affiliateUrl: string }, idx: number) => (
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
                      <div className="text-3xl font-bold text-success">{h2h?.homeWins || 0}</div>
                      <div className="text-sm text-muted-foreground">{match.homeTeam.name} Wins</div>
                    </div>
                    <div className="rounded-lg bg-muted p-4">
                      <div className="text-3xl font-bold">{h2h?.draws || 0}</div>
                      <div className="text-sm text-muted-foreground">Draws</div>
                    </div>
                    <div className="rounded-lg bg-primary/10 p-4">
                      <div className="text-3xl font-bold text-primary">{h2h?.awayWins || 0}</div>
                      <div className="text-sm text-muted-foreground">{match.awayTeam.name} Wins</div>
                    </div>
                  </div>
                  
                  <h4 className="mb-3 font-semibold">Recent Meetings</h4>
                  <div className="space-y-2">
                    {h2h?.recentMatches?.map((m: { date: string; homeTeam: string; homeScore: number; awayTeam: string; awayScore: number; competition: string }, idx: number) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(m.date), "dd MMM yyyy")}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{m.homeTeam}</span>
                          <span className="font-bold text-lg">
                            {m.homeScore} - {m.awayScore}
                          </span>
                          <span className="font-medium">{m.awayTeam}</span>
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
                <CardContent className="space-y-4">
                  {stats?.map((stat: { name: string; home: number; away: number }) => (
                    <div key={stat.name}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold">{stat.home}</span>
                        <span className="text-sm text-muted-foreground">{stat.name}</span>
                        <span className="font-bold">{stat.away}</span>
                      </div>
                      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                        <div 
                          className="bg-success transition-all"
                          style={{ width: `${stat.name === 'Possession' ? stat.home : (stat.home / (stat.home + stat.away) * 100)}%` }}
                        />
                        <div 
                          className="bg-primary transition-all"
                          style={{ width: `${stat.name === 'Possession' ? stat.away : (stat.away / (stat.home + stat.away) * 100)}%` }}
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
