"use client"

import { useState, use } from "react"
import Link from "next/link"
import useSWR from "swr"
import { 
  ArrowLeft, Clock, Radio, Users, TrendingUp, 
  Share2, Bookmark, Star, CheckCircle2, Trophy, Target, BarChart3,
  Shirt, PlusCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { TeamLogo } from "@/components/ui/team-logo"
import { AddTipForm } from "@/components/matches/add-tip-form"
import { SportSpecificStats } from "@/components/matches/sport-specific-stats"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { formatTime, formatDate, getBrowserTimezone, getDayLabel } from "@/lib/utils/timezone"

interface PageProps {
  params: Promise<{ id: string }>
}

const matchFetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch match')
  return res.json()
}

// Generate tips based on match data
const generateTips = (homeTeam: string, awayTeam: string, odds?: { home: number; draw?: number; away: number }) => 
  Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    tipster: {
      id: i + 100,
      name: ["KingOfTips", "AcePredicts", "LuckyStriker", "EuroExpert", "ProBetter", "OddsWizard", "TipMaster", "BetKing"][i],
      winRate: 55 + Math.floor(Math.random() * 30),
      verified: i % 3 === 0,
      roi: (5 + Math.random() * 15).toFixed(1)
    },
    prediction: [
      `${homeTeam} Win`, 
      `${awayTeam} Win`, 
      "Draw", 
      "Over 2.5 Goals", 
      "Both Teams to Score", 
      "Under 2.5 Goals", 
      `${homeTeam} -1`, 
      `${awayTeam} +1`
    ][i],
    market: ["1X2", "Over/Under", "BTTS", "Asian Handicap", "Double Chance"][i % 5],
    odds: odds ? [odds.home, odds.away, odds.draw || 3.2, 1.85, 1.72, 2.05, 2.1, 1.75][i].toFixed(2) : (1.5 + Math.random() * 2).toFixed(2),
    confidence: 60 + Math.floor(Math.random() * 35),
    analysis: [
      `Based on recent form - ${homeTeam} has won 4 of last 5 matches.`,
      `Head-to-head record favors ${awayTeam} in this fixture.`,
      "Both teams have scored in 8 of their last 10 games.",
      `${homeTeam}'s defensive record suggests low-scoring game.`,
      `${awayTeam} struggling on the road - 1 win in 6 away games.`
    ][i % 5],
    likes: Math.floor(Math.random() * 100),
    createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
  }))

export default function MatchDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const { isAuthenticated } = useAuth()
  const timezone = getBrowserTimezone()
  
  const { data, error, isLoading } = useSWR(
    `/api/matches/${encodeURIComponent(id)}`,
    matchFetcher,
    { refreshInterval: 10000 }
  )
  
  const [savedMatch, setSavedMatch] = useState(false)
  const [activeTab, setActiveTab] = useState("odds")
  const [showTipForm, setShowTipForm] = useState(false)

  if (isLoading) {
    return (
      <div className="flex-1 flex h-96 items-center justify-center">
        <div className="flex items-center gap-3">
          <Spinner className="h-8 w-8" />
          <span className="text-muted-foreground">Loading match details...</span>
        </div>
      </div>
    )
  }

  if (error || !data?.match) {
    return (
      <div className="flex-1 p-8 text-center">
        <h1 className="text-2xl font-bold">Match not found</h1>
        <p className="text-muted-foreground mt-2">The match you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Button asChild className="mt-4">
          <Link href="/matches">Back to Matches</Link>
        </Button>
      </div>
    )
  }

  const { match, bookmakerOdds, h2h, stats, lineups, teamForm } = data
  const tips = generateTips(match.homeTeam.name, match.awayTeam.name, match.odds)

  // Form display helper
  const FormBadge = ({ result }: { result: 'W' | 'D' | 'L' }) => (
    <span className={cn(
      "flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-white",
      result === 'W' && "bg-success",
      result === 'D' && "bg-muted-foreground",
      result === 'L' && "bg-destructive"
    )}>
      {result}
    </span>
  )

  return (
    <div className="flex-1 overflow-hidden">
      <div className="mx-auto max-w-5xl px-4 py-6 pb-24 md:pb-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/matches">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Matches
          </Link>
        </Button>

        {/* Match Header Card */}
        <Card className="mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-transparent p-4 md:p-6">
            {/* Top Info */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{
                  match.sport?.icon === 'soccer' ? '⚽' : 
                  match.sport?.icon === 'basketball' ? '🏀' : 
                  match.sport?.icon === 'football' ? '🏈' :
                  match.sport?.icon === 'tennis' ? '🎾' :
                  match.sport?.icon === 'baseball' ? '⚾' :
                  match.sport?.icon === 'hockey' ? '🏒' :
                  match.sport?.icon === 'mma' ? '🥊' :
                  match.sport?.icon === 'cricket' ? '🏏' :
                  match.sport?.icon === 'rugby' ? '🏉' :
                  match.sport?.icon === 'golf' ? '⛳' :
                  match.sport?.icon === 'formula-1' ? '🏎️' :
                  '🏆'
                }</span>
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

                {match.status === "halftime" && (
                  <Badge variant="secondary" className="gap-1">
                    HT
                  </Badge>
                )}

                {match.status === "scheduled" && (
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {getDayLabel(match.kickoffTime, timezone)} • {formatTime(match.kickoffTime, timezone)}
                  </Badge>
                )}

                {match.status === "finished" && (
                  <Badge className="gap-1 bg-emerald-600 text-white">
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
            <div className="mt-6 grid grid-cols-3 items-center gap-2 md:gap-4">
              <div className="text-center">
                <TeamLogo 
                  teamName={match.homeTeam.name} 
                  logoUrl={match.homeTeam.logo} 
                  size="lg"
                  className="mx-auto mb-2"
                />
                <h2 className="font-bold text-sm md:text-lg line-clamp-2">{match.homeTeam.name}</h2>
                {teamForm?.home && (
                  <div className="flex justify-center gap-1 mt-2">
                    {teamForm.home.map((r: 'W' | 'D' | 'L', i: number) => (
                      <FormBadge key={i} result={r} />
                    ))}
                  </div>
                )}
              </div>

              <div className="text-center">
                {match.status !== "scheduled" ? (
                  <div className="text-4xl md:text-5xl font-bold">
                    <span className={cn(
                      match.homeScore > match.awayScore && "text-emerald-500"
                    )}>{match.homeScore}</span>
                    <span className="mx-2 text-muted-foreground">-</span>
                    <span className={cn(
                      match.awayScore > match.homeScore && "text-emerald-500"
                    )}>{match.awayScore}</span>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl md:text-3xl font-bold">
                      {formatTime(match.kickoffTime, timezone)}
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground">
                      {getDayLabel(match.kickoffTime, timezone)} · {formatDate(match.kickoffTime, timezone)}
                    </div>
                    <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                      Your timezone
                    </div>
                  </div>
                )}
                {match.status === "live" && match.minute && (
                  <Badge variant="outline" className="mt-2 bg-red-500/10 text-red-500 border-red-500/30">
                    <Clock className="mr-1 h-3 w-3" />
                    {match.minute}&apos;
                  </Badge>
                )}
                
                {/* Quick Odds Display */}
                {match.odds && match.status === "scheduled" && (
                  <div className="mt-4 flex justify-center gap-2">
                    <div className="rounded bg-muted px-2 py-1 text-xs">
                      <div className="text-muted-foreground">1</div>
                      <div className="font-bold">{match.odds.home}</div>
                    </div>
                    {match.odds.draw && (
                      <div className="rounded bg-muted px-2 py-1 text-xs">
                        <div className="text-muted-foreground">X</div>
                        <div className="font-bold">{match.odds.draw}</div>
                      </div>
                    )}
                    <div className="rounded bg-muted px-2 py-1 text-xs">
                      <div className="text-muted-foreground">2</div>
                      <div className="font-bold">{match.odds.away}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-center">
                <TeamLogo 
                  teamName={match.awayTeam.name} 
                  logoUrl={match.awayTeam.logo} 
                  size="lg"
                  className="mx-auto mb-2"
                />
                <h2 className="font-bold text-sm md:text-lg line-clamp-2">{match.awayTeam.name}</h2>
                {teamForm?.away && (
                  <div className="flex justify-center gap-1 mt-2">
                    {teamForm.away.map((r: 'W' | 'D' | 'L', i: number) => (
                      <FormBadge key={i} result={r} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 flex items-center justify-center gap-4 md:gap-6 text-sm flex-wrap">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                {(h2h?.played || 10) * 500 + Math.floor(Math.random() * 1000)} watching
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                {match.tipsCount || tips.length} predictions
              </div>
              {isAuthenticated && match.status === "scheduled" && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowTipForm(!showTipForm)}
                  className="gap-1"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Tip
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Add Tip Form (Collapsible) */}
        {showTipForm && isAuthenticated && match.status === "scheduled" && (
          <div className="mb-6">
            <AddTipForm
              matchId={match.id}
              homeTeam={match.homeTeam.name}
              awayTeam={match.awayTeam.name}
              odds={match.odds}
              markets={match.markets}
              onSubmit={(data) => {
                console.log('[v0] Tip submitted:', data)
                setShowTipForm(false)
              }}
            />
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="odds">Odds</TabsTrigger>
            <TabsTrigger value="tips">Tips</TabsTrigger>
            <TabsTrigger value="h2h">H2H</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="lineups">Lineups</TabsTrigger>
          </TabsList>

          {/* Odds Tab */}
          <TabsContent value="odds" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Odds Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto -mx-4 px-4">
                  <table className="w-full min-w-[400px]">
                    <thead>
                      <tr className="border-b">
                        <th className="pb-3 text-left font-medium text-muted-foreground text-sm">Bookmaker</th>
                        <th className="pb-3 text-center font-medium text-muted-foreground text-sm">1</th>
                        <th className="pb-3 text-center font-medium text-muted-foreground text-sm">X</th>
                        <th className="pb-3 text-center font-medium text-muted-foreground text-sm">2</th>
                        <th className="pb-3 text-right font-medium text-muted-foreground text-sm"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookmakerOdds?.map((b: { 
                        slug: string; 
                        name: string; 
                        homeOdds: number; 
                        drawOdds?: number; 
                        awayOdds: number; 
                        affiliateUrl: string;
                        isBestHome?: boolean;
                        isBestAway?: boolean;
                      }) => (
                        <tr key={b.slug} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br from-primary/20 to-primary/5 font-bold text-xs text-primary">
                                {b.name.charAt(0)}
                              </div>
                              <span className="font-medium text-sm">{b.name}</span>
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <span className={cn(
                              "rounded-lg px-2 py-1 font-mono font-bold text-sm",
                              b.isBestHome && "bg-emerald-500/10 text-emerald-600"
                            )}>
                              {b.homeOdds?.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <span className="rounded-lg px-2 py-1 font-mono font-bold text-sm">
                              {b.drawOdds?.toFixed(2) || '-'}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <span className={cn(
                              "rounded-lg px-2 py-1 font-mono font-bold text-sm",
                              b.isBestAway && "bg-emerald-500/10 text-emerald-600"
                            )}>
                              {b.awayOdds?.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
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
            
            {/* Markets */}
            {match.markets && match.markets.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Other Markets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {match.markets.slice(0, 5).map((market: { key: string; name: string; outcomes: Array<{ name: string; price: number }> }) => (
                    <div key={market.key}>
                      <p className="text-sm font-medium text-muted-foreground mb-2">{market.name}</p>
                      <div className="flex flex-wrap gap-2">
                        {market.outcomes.map((outcome) => (
                          <div 
                            key={outcome.name} 
                            className="flex items-center justify-between rounded-lg border px-3 py-2 min-w-[100px] hover:border-primary/50 cursor-pointer transition-colors"
                          >
                            <span className="text-sm font-medium mr-2">{outcome.name}</span>
                            <span className="font-mono font-bold text-primary">{outcome.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tips Tab */}
          <TabsContent value="tips" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-5 w-5 text-primary" />
                  Expert Predictions ({tips.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tips.map((tip) => (
                  <div key={tip.id} className="rounded-lg border p-4 transition-colors hover:bg-muted/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                          {tip.tipster.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{tip.tipster.name}</span>
                            {tip.tipster.verified && (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="text-emerald-500">{tip.tipster.winRate}%</span>
                            <span>•</span>
                            <span>+{tip.tipster.roi}% ROI</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-1 text-xs">
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
                        <span className="text-xs text-muted-foreground">
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
                      <span>{formatTime(tip.createdAt, timezone)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* H2H Tab */}
          <TabsContent value="h2h" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Head to Head ({h2h?.played || 0} matches)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-emerald-500/10 p-4">
                    <div className="text-3xl font-bold text-emerald-500">{h2h?.homeWins || 0}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{match.homeTeam.name}</div>
                  </div>
                  <div className="rounded-lg bg-muted p-4">
                    <div className="text-3xl font-bold">{h2h?.draws || 0}</div>
                    <div className="text-xs text-muted-foreground mt-1">Draws</div>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-4">
                    <div className="text-3xl font-bold text-primary">{h2h?.awayWins || 0}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{match.awayTeam.name}</div>
                  </div>
                </div>
                
                {h2h?.avgGoalsPerMatch && (
                  <div className="mb-4 text-center text-sm text-muted-foreground">
                    Avg. {h2h.avgGoalsPerMatch.toFixed(1)} goals per match
                  </div>
                )}
                
                <h4 className="mb-3 font-semibold">Recent Meetings</h4>
                <div className="space-y-2">
                  {h2h?.recentMatches?.map((m: { date: string; homeTeam: string; homeScore: number; awayTeam: string; awayScore: number; competition: string }, idx: number) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border p-3 gap-2">
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(m.date, timezone)}
                      </div>
                      <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
                        <span className="font-medium text-sm truncate text-right flex-1">{m.homeTeam}</span>
                        <span className="font-bold text-lg whitespace-nowrap px-2">
                          {m.homeScore} - {m.awayScore}
                        </span>
                        <span className="font-medium text-sm truncate flex-1">{m.awayTeam}</span>
                      </div>
                      <Badge variant="outline" className="text-xs whitespace-nowrap">{m.competition}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-4">
            {/* Sport-Specific Stats Component */}
            <SportSpecificStats
              sportId={match.sportId}
              sportName={match.sport?.name || 'Sport'}
              homeTeam={match.homeTeam.name}
              awayTeam={match.awayTeam.name}
              data={match.sportSpecificData}
              status={match.status}
            />
            
            {/* Fallback to generic stats if sport-specific data not available */}
            {stats && stats.length > 0 && !match.sportSpecificData && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Match Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats?.map((stat: { name: string; home: number; away: number; unit?: string }) => {
                    const total = stat.home + stat.away;
                    const homePercent = total > 0 ? (stat.home / total) * 100 : 50;
                    
                    return (
                      <div key={stat.name}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm">{stat.home}{stat.unit}</span>
                          <span className="text-xs text-muted-foreground">{stat.name}</span>
                          <span className="font-bold text-sm">{stat.away}{stat.unit}</span>
                        </div>
                        <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                          <div 
                            className="bg-primary transition-all"
                            style={{ width: `${homePercent}%` }}
                          />
                          <div 
                            className="bg-muted-foreground/30"
                            style={{ width: `${100 - homePercent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Lineups Tab */}
          <TabsContent value="lineups" className="space-y-4">
            {lineups ? (
              <div className="grid gap-4 md:grid-cols-2">
                {/* Home Team Lineup */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Shirt className="h-5 w-5 text-primary" />
                      {match.homeTeam.name}
                      <Badge variant="outline" className="ml-auto">{lineups.home.formation}</Badge>
                    </CardTitle>
                    {!lineups.confirmed && (
                      <p className="text-xs text-muted-foreground">Predicted lineup</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {lineups.home.starting.map((player: { number: number; name: string; position: string; isCaptain?: boolean }) => (
                        <div key={player.number} className="flex items-center gap-3 rounded-lg border p-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                            {player.number}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-sm">{player.name}</span>
                              {player.isCaptain && <Badge variant="secondary" className="text-[10px] px-1">C</Badge>}
                            </div>
                            <span className="text-xs text-muted-foreground">{player.position}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Substitutes</p>
                      <div className="flex flex-wrap gap-2">
                        {lineups.home.substitutes.map((player: { number: number; name: string }) => (
                          <Badge key={player.number} variant="outline" className="text-xs">
                            {player.number}. {player.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Away Team Lineup */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Shirt className="h-5 w-5 text-muted-foreground" />
                      {match.awayTeam.name}
                      <Badge variant="outline" className="ml-auto">{lineups.away.formation}</Badge>
                    </CardTitle>
                    {!lineups.confirmed && (
                      <p className="text-xs text-muted-foreground">Predicted lineup</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {lineups.away.starting.map((player: { number: number; name: string; position: string; isCaptain?: boolean }) => (
                        <div key={player.number} className="flex items-center gap-3 rounded-lg border p-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">
                            {player.number}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-sm">{player.name}</span>
                              {player.isCaptain && <Badge variant="secondary" className="text-[10px] px-1">C</Badge>}
                            </div>
                            <span className="text-xs text-muted-foreground">{player.position}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Substitutes</p>
                      <div className="flex flex-wrap gap-2">
                        {lineups.away.substitutes.map((player: { number: number; name: string }) => (
                          <Badge key={player.number} variant="outline" className="text-xs">
                            {player.number}. {player.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Shirt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold mb-2">Lineups Not Available</h3>
                  <p className="text-sm text-muted-foreground">
                    Lineups will be available closer to kick-off or this sport does not support lineups.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
