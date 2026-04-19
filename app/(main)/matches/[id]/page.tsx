"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { 
  ArrowLeft, Clock, Calendar, Radio, Users, TrendingUp, 
  Share2, Bookmark, Star, CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ALL_SPORTS } from "@/lib/sports-data"
import { format, addHours } from "date-fns"

interface PageProps {
  params: { id: string }
}

// SAFE match generator (FIXED)
function generateMatch(id: string) {
  const numId = parseInt(id?.replace(/\D/g, "")) || 1

  const safeSports = Array.isArray(ALL_SPORTS) ? ALL_SPORTS : []

  const sport =
    safeSports.length > 0
      ? safeSports[numId % safeSports.length]
      : null

  // fallback if sport is missing or broken
  if (!sport) {
    return {
      id,
      sport: "Unknown Sport",
      sportIcon: "❓",
      league: "Unknown League",
      homeTeam: "Home Team",
      awayTeam: "Away Team",
      homeScore: null,
      awayScore: null,
      status: "scheduled",
      kickoff: new Date(),
      minute: null,
      venue: "Unknown Venue",
      referee: "Unknown",
      weather: "Unknown",
      homeOdds: "1.00",
      drawOdds: "1.00",
      awayOdds: "1.00",
      predictions: 0,
      viewers: 0
    }
  }

  const statuses = ["scheduled", "live", "finished"] as const
  const status = statuses[numId % 3]

  return {
    id,
    sport: sport.name ?? "Unknown Sport",
    sportIcon: sport.icon ?? "⚽",
    league: sport.leagues?.[0] ?? "Unknown League",
    homeTeam: `Home Team ${numId}`,
    awayTeam: `Away Team ${numId}`,
    homeScore: status !== "scheduled" ? Math.floor(Math.random() * 5) : null,
    awayScore: status !== "scheduled" ? Math.floor(Math.random() * 5) : null,
    status,
    kickoff: addHours(new Date(), numId % 24 - 12),
    minute: status === "live" ? Math.floor(Math.random() * 90) : null,
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

const bookmakers = [
  { name: "Bet365", logo: "🎰", homeOdds: "1.85", drawOdds: "3.40", awayOdds: "4.20" },
  { name: "Betway", logo: "🎲", homeOdds: "1.90", drawOdds: "3.35", awayOdds: "4.10" },
  { name: "1xBet", logo: "🏆", homeOdds: "1.88", drawOdds: "3.45", awayOdds: "4.25" },
  { name: "William Hill", logo: "🎯", homeOdds: "1.83", drawOdds: "3.50", awayOdds: "4.30" },
  { name: "Unibet", logo: "⚡", homeOdds: "1.87", drawOdds: "3.38", awayOdds: "4.15" },
]

const tips = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  tipster: {
    name: `Tipster${i + 1}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=tipster${i}`,
    winRate: 55 + Math.floor(Math.random() * 30),
    verified: i % 3 === 0
  },
  prediction: ["Home Win", "Away Win", "Draw", "Over 2.5", "BTTS Yes"][i % 5],
  odds: (1.5 + Math.random() * 2).toFixed(2),
  confidence: 60 + Math.floor(Math.random() * 35),
  analysis: "Based on recent form and head-to-head records.",
  likes: Math.floor(Math.random() * 100),
  createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
}))

export default function MatchDetailPage({ params }: PageProps) {
  const { id } = params

  const match = useMemo(() => generateMatch(id), [id])
  const [savedMatch, setSavedMatch] = useState(false)

  return (
    <div className="space-y-6">

      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/matches">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Matches
        </Link>
      </Button>

      {/* Header */}
      <Card className="overflow-hidden">
        <div className="p-6">
          
          {/* Top Info */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{match.league}</p>
              <p className="text-sm text-muted-foreground">{match.venue}</p>
            </div>

            <div className="flex items-center gap-2">
              {match.status === "live" && (
                <Badge variant="destructive">LIVE {match.minute}'</Badge>
              )}

              {match.status === "scheduled" && (
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  {format(match.kickoff, "HH:mm")}
                </Badge>
              )}

              {match.status === "finished" && (
                <Badge className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  FT
                </Badge>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSavedMatch(!savedMatch)}
              >
                <Bookmark className={cn(savedMatch && "fill-black")} />
              </Button>

              <Button variant="ghost" size="icon">
                <Share2 />
              </Button>
            </div>
          </div>

          {/* Teams */}
          <div className="mt-8 flex justify-between text-center">
            <div>
              <h2 className="font-bold">{match.homeTeam}</h2>
            </div>

            <div>
              {match.status !== "scheduled" ? (
                <div className="text-4xl font-bold">
                  {match.homeScore} - {match.awayScore}
                </div>
              ) : (
                <div className="text-xl font-bold">
                  {format(match.kickoff, "HH:mm")}
                </div>
              )}
            </div>

            <div>
              <h2 className="font-bold">{match.awayTeam}</h2>
            </div>
          </div>

        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="odds">
        <TabsList>
          <TabsTrigger value="odds">Odds</TabsTrigger>
          <TabsTrigger value="tips">Tips</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="odds">
          <Card>
            <CardHeader>
              <CardTitle>Odds Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              {bookmakers.map((b) => (
                <div key={b.name} className="flex justify-between py-2 border-b">
                  <span>{b.name}</span>
                  <span>{b.homeOdds}</span>
                  <span>{b.drawOdds}</span>
                  <span>{b.awayOdds}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tips">
          <Card>
            <CardContent>
              {tips.map((t) => (
                <div key={t.id} className="border-b py-3">
                  <p className="font-bold">{t.tipster.name}</p>
                  <p>{t.prediction}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

    </div>
  )
}