"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { SidebarNew } from "@/components/layout/sidebar-new"
import {
  Sparkles,
  Brain,
  Target,
  TrendingUp,
  Loader2,
  AlertTriangle,
  Trophy,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AltMarket {
  market: string
  pick: string
  confidence: number
}

interface PredictionResult {
  pick: string
  market: string
  confidence: number
  recommendedBet: string
  altMarkets: AltMarket[]
  reasoning: string[]
  source: "openai" | "fallback"
}

export default function MatchPredictorPage() {
  const [homeTeam, setHomeTeam] = useState("")
  const [awayTeam, setAwayTeam] = useState("")
  const [league, setLeague] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!homeTeam.trim() || !awayTeam.trim()) {
      setError("Enter both teams")
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/predictor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeTeam: homeTeam.trim(),
          awayTeam: awayTeam.trim(),
          league: league.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || "Prediction failed")
      }
      const data = (await res.json()) as PredictionResult
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const confidenceTone = (c: number) =>
    c >= 70
      ? "text-emerald-500"
      : c >= 55
        ? "text-amber-500"
        : "text-rose-500"

  const confidenceBg = (c: number) =>
    c >= 70
      ? "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30"
      : c >= 55
        ? "from-amber-500/20 to-amber-500/5 border-amber-500/30"
        : "from-rose-500/20 to-rose-500/5 border-rose-500/30"

  return (
    <div className="flex">
      <SidebarNew />
      <div className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
          {/* Hero */}
          <div className="mb-6 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/20 p-2.5">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-black md:text-2xl">
                  Match Predictor
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Type any two teams and let our AI generate a pick, confidence
                  level and recommended bet — across markets a real tipster
                  would consider.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            {/* Form */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4 text-primary" />
                  Enter the matchup
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={submit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="home">Home team</Label>
                    <Input
                      id="home"
                      placeholder="e.g. Manchester City"
                      value={homeTeam}
                      onChange={(e) => setHomeTeam(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="away">Away team</Label>
                    <Input
                      id="away"
                      placeholder="e.g. Liverpool"
                      value={awayTeam}
                      onChange={(e) => setAwayTeam(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="league">League / Competition (optional)</Label>
                    <Input
                      id="league"
                      placeholder="e.g. Premier League"
                      value={league}
                      onChange={(e) => setLeague(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="notes">Extra context (optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="e.g. Haaland injury doubt, Liverpool away in Europe midweek…"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button type="submit" className="w-full gap-2" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating prediction…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Predict match
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Result */}
            <div className="md:col-span-3">
              {!result && !loading && (
                <Card className="h-full border-dashed">
                  <CardContent className="flex h-full flex-col items-center justify-center p-8 text-center">
                    <Sparkles className="h-10 w-10 text-muted-foreground/40" />
                    <h3 className="mt-3 text-base font-semibold">
                      Your AI prediction will appear here
                    </h3>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      Pick + confidence % + recommended bet + alt markets
                      (Over/Under, BTTS, Double Chance) and the reasoning
                      behind it.
                    </p>
                  </CardContent>
                </Card>
              )}

              {loading && (
                <Card className="h-full">
                  <CardContent className="flex h-full flex-col items-center justify-center p-8">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="mt-3 text-sm text-muted-foreground">
                      Crunching form, H2H trends and odds value…
                    </p>
                  </CardContent>
                </Card>
              )}

              {result && (
                <div className="space-y-3">
                  {/* Headline pick */}
                  <Card
                    className={cn(
                      "overflow-hidden border-2 bg-gradient-to-br",
                      confidenceBg(result.confidence),
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            {result.market}
                          </p>
                          <p className="mt-1 truncate text-xl font-black md:text-2xl">
                            {result.pick}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Confidence
                          </p>
                          <p
                            className={cn(
                              "text-3xl font-black tabular-nums",
                              confidenceTone(result.confidence),
                            )}
                          >
                            {result.confidence}%
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-start gap-2 rounded-lg bg-background/60 p-2.5">
                        <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Recommended bet
                          </p>
                          <p className="text-sm font-semibold">
                            {result.recommendedBet}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Alt markets */}
                  {result.altMarkets.length > 0 && (
                    <Card>
                      <CardContent className="p-3">
                        <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          <TrendingUp className="h-3.5 w-3.5" />
                          Alt markets to watch
                        </h3>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {result.altMarkets.map((m, i) => (
                            <div
                              key={i}
                              className="rounded-lg border bg-card p-2.5"
                            >
                              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                {m.market}
                              </p>
                              <div className="mt-1 flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-semibold">
                                  {m.pick}
                                </p>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "shrink-0 font-bold",
                                    confidenceTone(m.confidence),
                                  )}
                                >
                                  {m.confidence}%
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Reasoning */}
                  {result.reasoning.length > 0 && (
                    <Card>
                      <CardContent className="p-3">
                        <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          <Zap className="h-3.5 w-3.5" />
                          Why this pick
                        </h3>
                        <ul className="space-y-1.5">
                          {result.reasoning.map((r, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm leading-relaxed"
                            >
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  <p className="text-center text-[10px] text-muted-foreground">
                    {result.source === "openai"
                      ? "AI prediction · for entertainment, not financial advice. Bet responsibly."
                      : "Heuristic prediction · enable the AI integration for sharper picks. Bet responsibly."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
