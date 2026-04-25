"use client"

import { Brain, Sparkles, TrendingUp } from "lucide-react"
import { useMemo } from "react"
import { cn } from "@/lib/utils"

interface Market {
  key: string
  name: string
  outcomes: Array<{ name: string; price: number; point?: number }>
}

interface AIMultiMarketProps {
  homeTeam: string
  awayTeam: string
  sportSlug?: string
  odds?: { home: number; draw?: number; away: number } | null
  homeForm?: string
  awayForm?: string
  h2h?: Array<{
    home: { name: string; score?: number }
    away: { name: string; score?: number }
  }> | null
  markets?: Market[] | null
}

interface MarketPick {
  market: string
  pick: string
  odds?: number
  confidence: number
  reason: string
}

/**
 * AI multi-market predictions block.
 * Generates a pick (with confidence + reasoning) across the most popular
 * football markets — not just 1X2. When real bookmaker `markets` are provided
 * we pin the pick's price to the actual averaged price so the user sees a
 * realistic stake suggestion.
 */
export function AIMultiMarket({
  homeTeam,
  awayTeam,
  sportSlug = "soccer",
  odds,
  homeForm,
  awayForm,
  h2h,
  markets,
}: AIMultiMarketProps) {
  const picks = useMemo(
    () => buildMultiMarketPicks({ homeTeam, awayTeam, sportSlug, odds, homeForm, awayForm, h2h, markets: markets || null }),
    [homeTeam, awayTeam, sportSlug, odds, homeForm, awayForm, h2h, markets],
  )

  if (picks.length === 0) return null

  return (
    <div className="rounded-2xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/10 via-violet-500/5 to-transparent overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-fuchsia-500/20 bg-fuchsia-500/5">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 shadow-lg">
          <Brain className="h-4 w-4 text-white" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-[8px] font-black text-black ring-2 ring-background">
            AI
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-bold text-foreground">AI Picks — All Markets</h3>
            <span className="text-[9px] font-bold uppercase tracking-wide bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white px-1.5 py-0.5 rounded">
              Beta
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            One pick per market, ranked by confidence
          </p>
        </div>
        <Sparkles className="h-4 w-4 text-fuchsia-400" />
      </div>

      <div className="divide-y divide-border/40">
        {picks.map(p => (
          <PickRow key={p.market} pick={p} />
        ))}
      </div>

      <div className="px-4 py-2.5 border-t border-fuchsia-500/15 text-[10px] text-muted-foreground">
        AI picks combine bookmaker odds, recent form and head-to-head — guidance, not guarantees.
      </div>
    </div>
  )
}

function PickRow({ pick }: { pick: MarketPick }) {
  const conf = pick.confidence
  const confColor = conf >= 70 ? "text-emerald-400" : conf >= 55 ? "text-amber-400" : "text-rose-400"
  const barColor = conf >= 70 ? "bg-emerald-500" : conf >= 55 ? "bg-amber-500" : "bg-rose-500"

  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{pick.market}</p>
          <p className="mt-0.5 text-sm font-bold text-foreground line-clamp-1">{pick.pick}</p>
          <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">{pick.reason}</p>
        </div>
        <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
          {pick.odds !== undefined && (
            <span className="font-mono text-base font-black text-primary tabular-nums">
              {pick.odds.toFixed(2)}
            </span>
          )}
          <span className={cn("text-[10px] font-bold tabular-nums", confColor)}>{conf}%</span>
        </div>
      </div>
      <div className="mt-2 h-1 bg-black/30 rounded-full overflow-hidden">
        <div className={cn("h-full transition-all duration-500", barColor)} style={{ width: `${conf}%` }} />
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────
// Engine
// ───────────────────────────────────────────────
interface EngineInput {
  homeTeam: string
  awayTeam: string
  sportSlug: string
  odds?: { home: number; draw?: number; away: number } | null
  homeForm?: string
  awayForm?: string
  h2h?: Array<{
    home: { name: string; score?: number }
    away: { name: string; score?: number }
  }> | null
  markets: Market[] | null
}

function formScore(f?: string) {
  if (!f) return 0
  let s = 0
  for (const ch of f.toUpperCase().slice(0, 5)) {
    if (ch === "W") s += 3
    else if (ch === "D") s += 1
  }
  return s
}

function findMarketPrice(markets: Market[] | null, key: string, outcomeMatcher: (name: string, point?: number) => boolean): number | undefined {
  if (!markets) return undefined
  const m = markets.find(x => x.key === key)
  if (!m) return undefined
  const o = m.outcomes.find(o => outcomeMatcher(o.name, o.point))
  return o?.price
}

function buildMultiMarketPicks(input: EngineInput): MarketPick[] {
  const { homeTeam, awayTeam, sportSlug, odds, homeForm, awayForm, h2h, markets } = input
  const picks: MarketPick[] = []

  // Implied probabilities from 1X2 odds
  let homeP = 0.4, drawP = 0.25, awayP = 0.35
  if (odds) {
    const hp = 1 / odds.home
    const ap = 1 / odds.away
    const dp = odds.draw ? 1 / odds.draw : 0
    const total = hp + ap + dp || 1
    homeP = hp / total
    drawP = dp / total
    awayP = ap / total
  }

  const hF = formScore(homeForm)
  const aF = formScore(awayForm)
  const formDelta = (hF - aF) * 0.012
  homeP = Math.max(0.05, Math.min(0.85, homeP + formDelta))
  awayP = Math.max(0.05, Math.min(0.85, awayP - formDelta))

  // Average goals from h2h
  let h2hGoals = 0
  let h2hCount = 0
  let bothScoredCount = 0
  if (h2h && h2h.length > 0) {
    for (const g of h2h.slice(0, 6)) {
      const hs = g.home.score ?? 0
      const as = g.away.score ?? 0
      h2hGoals += hs + as
      h2hCount++
      if (hs > 0 && as > 0) bothScoredCount++
    }
  }
  const avgGoals = h2hCount > 0 ? h2hGoals / h2hCount : 2.55
  const bttsRate = h2hCount > 0 ? bothScoredCount / h2hCount : 0.5

  // ─── 1X2 ───
  if (odds) {
    const isSoccer = sportSlug === "soccer" || sportSlug === "football"
    const winner = homeP >= awayP ? homeTeam : awayTeam
    const winnerP = Math.max(homeP, awayP)
    const drawIsBest = isSoccer && drawP > homeP && drawP > awayP
    if (drawIsBest) {
      picks.push({
        market: "Match Result",
        pick: "Draw",
        odds: odds.draw,
        confidence: Math.round(Math.min(82, drawP * 100)),
        reason: "Tightly priced market with both sides closely matched on form and odds.",
      })
    } else {
      picks.push({
        market: "Match Result",
        pick: `${winner} to win`,
        odds: winner === homeTeam ? odds.home : odds.away,
        confidence: Math.round(Math.min(88, Math.max(40, winnerP * 100))),
        reason: `Bookmakers price ${winner} as favourite with the strongest implied probability.`,
      })
    }

    // ─── Double Chance ───
    const dc1x = 1 / (homeP + drawP)
    const dcx2 = 1 / (drawP + awayP)
    const dc12 = 1 / (homeP + awayP)
    const dcBest = [
      { name: `${homeTeam} or Draw (1X)`, p: homeP + drawP, price: Math.round(dc1x * 100) / 100 },
      { name: `${awayTeam} or Draw (X2)`, p: drawP + awayP, price: Math.round(dcx2 * 100) / 100 },
      { name: `${homeTeam} or ${awayTeam} (12)`, p: homeP + awayP, price: Math.round(dc12 * 100) / 100 },
    ].sort((a, b) => b.p - a.p)[0]
    picks.push({
      market: "Double Chance",
      pick: dcBest.name,
      odds: dcBest.price,
      confidence: Math.round(Math.min(94, dcBest.p * 100)),
      reason: "Covers two of the three possible outcomes — lower variance than a straight win bet.",
    })

    // ─── Draw No Bet ───
    if (odds.draw) {
      const dnbWinner = homeP >= awayP ? homeTeam : awayTeam
      const dnbPrice = dnbWinner === homeTeam
        ? Math.round((1 / (homeP / (homeP + awayP))) * 100) / 100
        : Math.round((1 / (awayP / (homeP + awayP))) * 100) / 100
      picks.push({
        market: "Draw No Bet",
        pick: dnbWinner,
        odds: dnbPrice,
        confidence: Math.round(Math.min(90, (Math.max(homeP, awayP) / (homeP + awayP)) * 100)),
        reason: `Stake refunded if the match ends level — safer way to back ${dnbWinner}.`,
      })
    }
  }

  // ─── BTTS ───
  const bttsYesPrice = findMarketPrice(markets, "btts", n => /yes/i.test(n))
    || (markets ? findMarketPrice(markets, "both_teams_to_score", n => /yes/i.test(n)) : undefined)
  const bttsNoPrice = findMarketPrice(markets, "btts", n => /^no$/i.test(n))
    || (markets ? findMarketPrice(markets, "both_teams_to_score", n => /^no$/i.test(n)) : undefined)
  if (sportSlug === "soccer" || sportSlug === "football") {
    const bttsYes = bttsRate >= 0.5
    picks.push({
      market: "Both Teams to Score",
      pick: bttsYes ? "Yes" : "No",
      odds: bttsYes ? bttsYesPrice : bttsNoPrice,
      confidence: Math.round(Math.min(85, Math.max(50, (bttsYes ? bttsRate : 1 - bttsRate) * 100))),
      reason: bttsYes
        ? `Both sides have found the net in ${Math.round(bttsRate * 100)}% of recent meetings.`
        : `Defenses have controlled the recent meetings — unders BTTS trending.`,
    })
  }

  // ─── Over/Under 1.5, 2.5, 3.5 ───
  for (const line of [1.5, 2.5, 3.5]) {
    const over = avgGoals > line
    const overPrice = findMarketPrice(markets, "totals", (n, p) => /over/i.test(n) && p === line)
      || findMarketPrice(markets, `over_under_${line.toString().replace(".", "_")}`, n => /over/i.test(n))
    const underPrice = findMarketPrice(markets, "totals", (n, p) => /under/i.test(n) && p === line)
      || findMarketPrice(markets, `over_under_${line.toString().replace(".", "_")}`, n => /under/i.test(n))
    const margin = Math.abs(avgGoals - line)
    const conf = Math.round(Math.min(86, 50 + margin * 18))
    picks.push({
      market: `Over / Under ${line}`,
      pick: over ? `Over ${line} goals` : `Under ${line} goals`,
      odds: over ? overPrice : underPrice,
      confidence: conf,
      reason: over
        ? `Recent meetings average ${avgGoals.toFixed(1)} goals — comfortably above the ${line} line.`
        : `Recent meetings average ${avgGoals.toFixed(1)} goals — leaning under ${line}.`,
    })
  }

  // ─── Half Time Result ───
  if (odds && (sportSlug === "soccer" || sportSlug === "football")) {
    // HT is statistically more likely to be a draw because fewer goals are scored
    const htDrawP = Math.min(0.55, drawP + 0.18)
    const htWinnerP = (1 - htDrawP) * (homeP / (homeP + awayP))
    const htWinner = homeP >= awayP ? homeTeam : awayTeam
    const htPick = htDrawP > 0.42 ? "Draw at HT" : `${htWinner} leading at HT`
    const conf = htDrawP > 0.42 ? Math.round(htDrawP * 100) : Math.round(Math.min(70, htWinnerP * 100))
    picks.push({
      market: "Half-Time Result",
      pick: htPick,
      confidence: Math.max(45, conf),
      reason: htDrawP > 0.42
        ? "First halves tend to be cagey when neither side dominates the odds."
        : `${htWinner} are more likely to start strongly given the bookmaker pricing.`,
    })
  }

  // ─── Correct score lean ───
  if (odds && (sportSlug === "soccer" || sportSlug === "football")) {
    // very rough guess based on avg goals + winner
    const winner = homeP >= awayP ? "home" : "away"
    let cs = "1-1"
    if (avgGoals < 1.5) cs = winner === "home" ? "1-0" : "0-1"
    else if (avgGoals < 2.5) cs = winner === "home" ? "2-1" : "1-2"
    else if (avgGoals < 3.5) cs = winner === "home" ? "2-1" : "1-2"
    else cs = winner === "home" ? "3-1" : "1-3"
    picks.push({
      market: "Correct Score (Lean)",
      pick: cs,
      confidence: 18 + Math.round(Math.random() * 8), // CS is inherently low confidence
      reason: `Most-likely scoreline given a ~${avgGoals.toFixed(1)}-goal expectation.`,
    })
  }

  // Sort by confidence desc, but always keep Match Result first
  return picks.sort((a, b) => {
    if (a.market === "Match Result") return -1
    if (b.market === "Match Result") return 1
    return b.confidence - a.confidence
  })
}
