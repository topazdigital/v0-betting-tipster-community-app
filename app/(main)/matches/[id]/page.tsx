"use client"

import { useState, use, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import useSWR from "swr"
import {
  ArrowLeft, Clock, Radio, Share2, Bookmark, CheckCircle2,
  Trophy, BarChart3, Shirt, Newspaper, MapPin, Tv,
  TrendingUp, Award, ChevronUp, ChevronDown, Minus,
  Users, Zap, AlertTriangle, RotateCcw, Target,
  Star, ThumbsUp, ThumbsDown, MessageCircle, Lock, ChevronRight,
  Calendar,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { TeamLogo } from "@/components/ui/team-logo"
import { cn } from "@/lib/utils"
import { formatTime, formatDate, getBrowserTimezone, getDayLabel } from "@/lib/utils/timezone"
import { countryCodeToFlag } from "@/lib/country-flags"
import { liveStatusLabel } from "@/lib/utils/live-status"
import { AIMatchPrediction } from "@/components/ai/ai-match-prediction"
import { AIMultiMarket } from "@/components/ai/ai-multi-market"
import { AddTipForm } from "@/components/matches/add-tip-form"
import { useAuth } from "@/contexts/auth-context"

interface PageProps { params: Promise<{ id: string }> }

interface Player {
  name: string
  fullName?: string
  position?: string
  jersey?: string
  starter: boolean
  headshot?: string
}
interface TeamRoster {
  teamId?: string
  teamName?: string
  teamLogo?: string
  formation?: string
  coach?: string
  starting: Player[]
  bench: Player[]
}
interface Lineups { home: TeamRoster | null; away: TeamRoster | null }
interface BookmakerOdd {
  bookmaker: string
  home: number
  draw?: number
  away: number
  spread?: { value: number; homePrice: number; awayPrice: number }
  total?: { value: number; overPrice: number; underPrice: number }
}
interface H2HGame {
  date: string
  league?: string
  home: { name: string; logo?: string; score?: number }
  away: { name: string; logo?: string; score?: number }
}
interface StandingRow {
  teamId?: string
  teamName?: string
  teamLogo?: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor?: number
  goalsAgainst?: number
  goalDifference?: number
  points: number
  position?: number
}
interface StandingsGroup { header?: string; rows: StandingRow[] }
interface NewsItem {
  headline?: string
  description?: string
  published?: string
  image?: string
  link?: string
}
interface LeaderItem {
  team?: string
  category?: string
  athlete?: string
  headshot?: string
  value?: string
}
interface MatchEvent {
  id: string
  minute: string
  type: 'goal' | 'own_goal' | 'penalty_goal' | 'yellow_card' | 'red_card' | 'yellow_red_card' | 'substitution' | 'var' | 'other'
  side: 'home' | 'away'
  playerName?: string
  playerOut?: string
  assistName?: string
  homeScore?: number
  awayScore?: number
  description?: string
  period?: number
}
interface SegmentBreakdown {
  variant: 'quarters' | 'periods' | 'innings' | 'sets' | 'rounds' | 'generic'
  labels: string[]
  home: number[]
  away: number[]
  totals?: { home: number; away: number }
}
interface MarketOutcome { name: string; price: number; point?: number }
interface MatchMarket { key: string; name: string; outcomes: MarketOutcome[] }
interface MatchDetails {
  match: {
    id: string
    homeTeam: { name: string; logo?: string; form?: string; record?: string; espnTeamId?: string; leagueSlug?: string }
    awayTeam: { name: string; logo?: string; form?: string; record?: string; espnTeamId?: string; leagueSlug?: string }
    kickoffTime: string
    status: string
    homeScore: number | null
    awayScore: number | null
    minute?: number
    period?: number
    league: { name: string; country: string; countryCode: string }
    sport: { name: string; slug: string; icon: string }
    odds?: { home: number; draw?: number; away: number; bookmaker?: string }
    oddsIsComputed?: boolean
    markets?: MatchMarket[]
    venue?: string
    venueCity?: string
    venueCountry?: string
    attendance?: number
    broadcasts?: string[]
  }
  bookmakerOdds: BookmakerOdd[]
  lineups: Lineups | null
  h2h: H2HGame[] | null
  standings: StandingsGroup[] | null
  news: NewsItem[]
  leaders: LeaderItem[]
  matchEvents: MatchEvent[]
  segmentBreakdown: SegmentBreakdown | null
  hasRealOdds: boolean
  hasLineups: boolean
  hasStandings: boolean
  hasH2H: boolean
  hasEvents: boolean
}

interface TipsterInfo {
  id: string
  displayName: string
  totalTips: number
  wonTips: number
  winRate: number
  roi: number
  streak: number
  rank: number
  isPremium: boolean
  monthlyPrice: number
  followers: number
  verified: boolean
}
interface MatchTip {
  id: string
  matchId: string
  prediction: string
  market: string
  odds: number
  stake: number
  confidence: number
  analysis: string
  isPremium: boolean
  status: string
  likes: number
  dislikes: number
  comments: number
  createdAt: string
  tipster: TipsterInfo
}
interface TipsData { tips: MatchTip[]; total: number }

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

// Slug → emoji. NOTE: in this app the sport with id=1 is "Football" (soccer)
// with slug 'football' — id=5 is American Football with slug 'american-football'.
// So `football` must render the soccer ball, not the American football.
const SPORT_EMOJI: Record<string, string> = {
  soccer: '⚽', football: '⚽',
  'american-football': '🏈',
  basketball: '🏀', tennis: '🎾',
  baseball: '⚾', hockey: '🏒', 'ice-hockey': '🏒',
  mma: '🥊', boxing: '🥊', cricket: '🏏',
  rugby: '🏉', golf: '⛳',
  'formula-1': '🏎️', racing: '🏎️', motogp: '🏍️', nascar: '🏁',
  volleyball: '🏐', 'beach-volleyball': '🏐',
  handball: '🤾', 'water-polo': '🤽', 'field-hockey': '🏑',
  futsal: '⚽', lacrosse: '🥍', 'aussie-rules': '🏉',
  snooker: '🎱', darts: '🎯', 'table-tennis': '🏓', badminton: '🏸',
  squash: '🎾', cycling: '🚴', athletics: '🏃', swimming: '🏊',
  wrestling: '🤼', 'horse-racing': '🐎',
  esports: '🎮', chess: '♟️', 'ski-jumping': '⛷️',
}

function FormBadge({ result }: { result: string }) {
  const r = result.toUpperCase()
  return (
    <span className={cn(
      "flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white",
      r === 'W' && "bg-emerald-500",
      r === 'D' && "bg-amber-500",
      r === 'L' && "bg-rose-500",
      !['W', 'D', 'L'].includes(r) && "bg-muted-foreground"
    )}>{r}</span>
  )
}

function EventIcon({ type }: { type: MatchEvent['type'] }) {
  if (type === 'goal') return <span className="text-base">⚽</span>
  if (type === 'own_goal') return <span className="text-base">🔴</span>
  if (type === 'penalty_goal') return <span className="text-base">⚽</span>
  if (type === 'yellow_card') return <span className="inline-block h-4 w-3 rounded-sm bg-yellow-400 shadow-sm" />
  if (type === 'red_card') return <span className="inline-block h-4 w-3 rounded-sm bg-rose-500 shadow-sm" />
  if (type === 'yellow_red_card') return <span className="inline-block h-4 w-3 rounded-sm bg-orange-500 shadow-sm" />
  if (type === 'substitution') return <RotateCcw className="h-4 w-4 text-sky-400" />
  if (type === 'var') return <Tv className="h-4 w-4 text-violet-400" />
  return <Zap className="h-4 w-4 text-muted-foreground" />
}

// ---- Live Minute Timer ----
// For soccer / rugby: ticks the clock every 15 s based on kickoff so the
// displayed minute keeps moving between API polls. For all other sports
// the ESPN `minute` field actually means "current period" — we just
// pass it through and let `liveStatusLabel` translate it (Q1 / Set 3 / etc).
function useLiveMinute(kickoffTime: string, storedMinute: number | undefined, status: string, sportSlug: string = 'soccer') {
  const [minute, setMinute] = useState(storedMinute ?? 0)
  const isLive = status === 'live' || status === 'halftime' || status === 'extra_time' || status === 'penalties'
  const isHalftime = status === 'halftime'
  const ticksByMinute = sportSlug === 'soccer' || sportSlug === 'football' || sportSlug === 'rugby'

  useEffect(() => {
    if (!isLive) { setMinute(storedMinute ?? 0); return }
    if (!ticksByMinute) { setMinute(storedMinute ?? 0); return }
    const kick = new Date(kickoffTime).getTime()
    const compute = () => {
      if (isHalftime) { setMinute(45); return }
      const elapsed = Math.floor((Date.now() - kick) / 60000)
      setMinute(Math.max(storedMinute ?? 0, Math.min(elapsed, 120)))
    }
    compute()
    const id = setInterval(compute, 15000)
    return () => clearInterval(id)
  }, [isLive, isHalftime, ticksByMinute, kickoffTime, storedMinute])

  return minute
}

// ---- Formation Pitch Component ----
function FormationPitch({ home, away }: { home: TeamRoster | null; away: TeamRoster | null }) {
  if (!home && !away) return null

  const parseFormation = (f?: string): number[] => {
    if (!f) return [4, 4, 2]
    return f.split('-').map(n => parseInt(n, 10)).filter(n => !isNaN(n))
  }

  const homeRows = home ? [1, ...parseFormation(home.formation)] : []
  const awayRows = away ? [...parseFormation(away.formation), 1] : []

  const getStarters = (roster: TeamRoster) => roster.starting.slice(0, 11)

  const distributeToRows = (players: Player[], rows: number[]) => {
    const result: Player[][] = []
    let idx = 0
    for (const count of rows) {
      result.push(players.slice(idx, idx + count))
      idx += count
    }
    return result
  }

  const homeStarters = home ? getStarters(home) : []
  const awayStarters = away ? getStarters(away) : []
  const homeDistributed = home ? distributeToRows(homeStarters, homeRows) : []
  const awayDistributed = away ? distributeToRows(awayStarters, awayRows.slice().reverse()) : []

  return (
    <div className="relative overflow-hidden rounded-xl" style={{ background: 'linear-gradient(180deg, #1a5c2a 0%, #1e7a35 50%, #1a5c2a 100%)' }}>
      {/* Pitch markings */}
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 400 600" preserveAspectRatio="none">
        {/* Outer border */}
        <rect x="20" y="20" width="360" height="560" fill="none" stroke="white" strokeWidth="2" />
        {/* Center line */}
        <line x1="20" y1="300" x2="380" y2="300" stroke="white" strokeWidth="2" />
        {/* Center circle */}
        <circle cx="200" cy="300" r="50" fill="none" stroke="white" strokeWidth="2" />
        <circle cx="200" cy="300" r="3" fill="white" />
        {/* Home penalty area */}
        <rect x="95" y="460" width="210" height="100" fill="none" stroke="white" strokeWidth="1.5" />
        <rect x="145" y="520" width="110" height="60" fill="none" stroke="white" strokeWidth="1.5" />
        {/* Away penalty area */}
        <rect x="95" y="40" width="210" height="100" fill="none" stroke="white" strokeWidth="1.5" />
        <rect x="145" y="20" width="110" height="60" fill="none" stroke="white" strokeWidth="1.5" />
        {/* Penalty spots */}
        <circle cx="200" cy="500" r="3" fill="white" />
        <circle cx="200" cy="100" r="3" fill="white" />
      </svg>

      <div className="relative flex flex-col gap-0 py-4 px-2" style={{ minHeight: 480 }}>
        {/* Away team (top) */}
        {away && (
          <div className="flex flex-col gap-2 pb-3">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TeamLogo teamName={away.teamName || ''} logoUrl={away.teamLogo} size="sm" />
              <span className="text-xs font-bold text-white/90">{away.teamName}</span>
              {away.formation && <span className="text-[10px] text-white/60 bg-black/30 px-1.5 py-0.5 rounded-full">{away.formation}</span>}
            </div>
            {awayDistributed.map((row, ri) => (
              <div key={ri} className="flex justify-center gap-2">
                {row.map((p, pi) => (
                  <PitchPlayer key={pi} player={p} color="bg-sky-500" />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Midfield divider */}
        <div className="my-1 flex items-center gap-2 opacity-50">
          <div className="h-px flex-1 bg-white/40" />
          <div className="h-2 w-2 rounded-full bg-white/60" />
          <div className="h-px flex-1 bg-white/40" />
        </div>

        {/* Home team (bottom) */}
        {home && (
          <div className="flex flex-col-reverse gap-2 pt-3">
            <div className="flex items-center justify-center gap-2 mt-1">
              <TeamLogo teamName={home.teamName || ''} logoUrl={home.teamLogo} size="sm" />
              <span className="text-xs font-bold text-white/90">{home.teamName}</span>
              {home.formation && <span className="text-[10px] text-white/60 bg-black/30 px-1.5 py-0.5 rounded-full">{home.formation}</span>}
            </div>
            {homeDistributed.map((row, ri) => (
              <div key={ri} className="flex justify-center gap-2">
                {row.map((p, pi) => (
                  <PitchPlayer key={pi} player={p} color="bg-rose-500" />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PitchPlayer({ player, color }: { player: Player; color: string }) {
  const [imgError, setImgError] = useState(false)
  const showHeadshot = player.headshot && !imgError
  return (
    <div className="flex flex-col items-center gap-0.5 w-12">
      <div className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-full text-white text-[11px] font-bold shadow-lg border-2 border-white/50 overflow-hidden",
        !showHeadshot && color
      )}>
        {showHeadshot ? (
          <Image
            src={player.headshot!}
            alt={player.name}
            fill
            sizes="36px"
            className="object-cover"
            onError={() => setImgError(true)}
            unoptimized
          />
        ) : (
          <span>{player.jersey || player.name.slice(0, 2).toUpperCase()}</span>
        )}
        {/* jersey number chip on top of headshot */}
        {showHeadshot && player.jersey && (
          <span className={cn(
            "absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black text-white border border-white/70",
            color
          )}>
            {player.jersey}
          </span>
        )}
      </div>
      <span className="text-[9px] text-white/90 text-center leading-tight line-clamp-1 w-full text-center px-1">
        {player.name.split(' ').pop() || player.name}
      </span>
    </div>
  )
}

// ---- Match Events Timeline ----
function EventsTimeline({ events, homeName, awayName }: { events: MatchEvent[]; homeName: string; awayName: string }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
        <Zap className="h-10 w-10 mb-3 opacity-40" />
        <p className="font-semibold">Match events will appear here</p>
        <p className="text-sm mt-1">Events update live once the match kicks off</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {events.map((ev) => {
        const isHome = ev.side === 'home'
        const isGoal = ev.type === 'goal' || ev.type === 'own_goal' || ev.type === 'penalty_goal'
        return (
          <div key={ev.id} className={cn(
            "grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-2 px-3 rounded-lg transition-colors",
            isGoal ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
          )}>
            {/* Home side */}
            {isHome ? (
              <div className="flex items-center gap-2 justify-end min-w-0">
                <div className="text-right min-w-0">
                  <p className={cn("text-sm font-semibold truncate", isGoal && "text-foreground")}>{ev.playerName || '—'}</p>
                  {ev.type === 'substitution' && ev.playerOut && (
                    <p className="text-[10px] text-rose-400 truncate">↓ {ev.playerOut}</p>
                  )}
                  {ev.assistName && <p className="text-[10px] text-muted-foreground truncate">Assist: {ev.assistName}</p>}
                  {ev.type === 'own_goal' && <p className="text-[10px] text-rose-400">Own Goal</p>}
                  {ev.type === 'penalty_goal' && <p className="text-[10px] text-emerald-400">Penalty</p>}
                </div>
                <EventIcon type={ev.type} />
              </div>
            ) : <div />}

            {/* Center: minute + score snapshot */}
            <div className="flex flex-col items-center">
              <span className="text-xs font-mono font-bold text-muted-foreground w-12 text-center leading-none">
                {ev.minute}
              </span>
              {isGoal && ev.homeScore !== undefined && ev.awayScore !== undefined && (
                <span className="text-[10px] font-bold text-primary mt-0.5">
                  {ev.homeScore}–{ev.awayScore}
                </span>
              )}
            </div>

            {/* Away side */}
            {!isHome ? (
              <div className="flex items-center gap-2 min-w-0">
                <EventIcon type={ev.type} />
                <div className="min-w-0">
                  <p className={cn("text-sm font-semibold truncate", isGoal && "text-foreground")}>{ev.playerName || '—'}</p>
                  {ev.type === 'substitution' && ev.playerOut && (
                    <p className="text-[10px] text-rose-400 truncate">↓ {ev.playerOut}</p>
                  )}
                  {ev.assistName && <p className="text-[10px] text-muted-foreground truncate">Assist: {ev.assistName}</p>}
                  {ev.type === 'own_goal' && <p className="text-[10px] text-rose-400">Own Goal</p>}
                  {ev.type === 'penalty_goal' && <p className="text-[10px] text-emerald-400">Penalty</p>}
                </div>
              </div>
            ) : <div />}
          </div>
        )
      })}
    </div>
  )
}

// ---- Odds Probability Bar ----
function OddsProbBar({ home, draw, away }: { home: number; draw?: number; away: number }) {
  const toProb = (o: number) => Math.round((1 / o) * 100)
  const hp = toProb(home)
  const dp = draw ? toProb(draw) : 0
  const ap = toProb(away)
  const total = hp + dp + ap
  const hPct = Math.round((hp / total) * 100)
  const dPct = Math.round((dp / total) * 100)
  const aPct = 100 - hPct - dPct

  return (
    <div className="space-y-2">
      <div className="flex h-2.5 w-full overflow-hidden rounded-full">
        <div className="bg-emerald-500 transition-all" style={{ width: `${hPct}%` }} />
        {dPct > 0 && <div className="bg-amber-500 transition-all" style={{ width: `${dPct}%` }} />}
        <div className="bg-rose-500 transition-all" style={{ width: `${aPct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="text-emerald-600 font-medium">{hPct}%</span>
        {dPct > 0 && <span className="text-amber-500 font-medium">{dPct}%</span>}
        <span className="text-rose-500 font-medium">{aPct}%</span>
      </div>
    </div>
  )
}

// ---- Sport-specific score breakdown grid ----
// Renders quarters / periods / innings / sets / rounds in a tight, readable grid.
// One component handles every sport — labels and totals come from the API.
function SegmentBreakdownGrid({
  data,
  homeName,
  awayName,
  homeLogo,
  awayLogo,
}: {
  data: SegmentBreakdown
  homeName: string
  awayName: string
  homeLogo?: string
  awayLogo?: string
}) {
  if (!data || data.labels.length === 0) return null

  const heading: Record<SegmentBreakdown['variant'], string> = {
    quarters: 'Quarter-by-quarter',
    periods: 'Period-by-period',
    innings: 'Inning-by-inning',
    sets: 'Set-by-set',
    rounds: 'Round-by-round',
    generic: 'Score by segment',
  }

  // Choose how to colour the winning side per segment (small visual cue).
  const cellClass = (a: number, b: number) =>
    a > b
      ? 'text-emerald-600 dark:text-emerald-400 font-bold'
      : a < b
        ? 'text-muted-foreground'
        : 'text-foreground font-medium'

  return (
    <div className="rounded-xl border border-border bg-card p-3 md:p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {heading[data.variant]}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] text-center text-sm tabular-nums">
          <thead>
            <tr className="text-[11px] uppercase text-muted-foreground">
              <th className="px-1.5 py-1 text-left font-medium">Team</th>
              {data.labels.map((l) => (
                <th key={l} className="px-1.5 py-1 font-medium">{l}</th>
              ))}
              <th className="px-1.5 py-1 font-semibold text-foreground">T</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <td className="px-1.5 py-1.5 text-left">
                <div className="flex items-center gap-2">
                  {homeLogo ? <img src={homeLogo} alt="" className="h-4 w-4 rounded-sm object-contain" /> : null}
                  <span className="truncate text-xs font-medium">{homeName}</span>
                </div>
              </td>
              {data.home.map((v, i) => (
                <td key={i} className={cn('px-1.5 py-1.5', cellClass(v, data.away[i] ?? 0))}>{v}</td>
              ))}
              <td className="px-1.5 py-1.5 text-base font-bold">{data.totals?.home ?? data.home.reduce((a, b) => a + b, 0)}</td>
            </tr>
            <tr className="border-t border-border">
              <td className="px-1.5 py-1.5 text-left">
                <div className="flex items-center gap-2">
                  {awayLogo ? <img src={awayLogo} alt="" className="h-4 w-4 rounded-sm object-contain" /> : null}
                  <span className="truncate text-xs font-medium">{awayName}</span>
                </div>
              </td>
              {data.away.map((v, i) => (
                <td key={i} className={cn('px-1.5 py-1.5', cellClass(v, data.home[i] ?? 0))}>{v}</td>
              ))}
              <td className="px-1.5 py-1.5 text-base font-bold">{data.totals?.away ?? data.away.reduce((a, b) => a + b, 0)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---- Scorers inline display for hero ----
function ScorersList({ events, side }: { events: MatchEvent[]; side: 'home' | 'away' }) {
  const goals = events.filter(e => e.side === side && (e.type === 'goal' || e.type === 'own_goal' || e.type === 'penalty_goal'))
  if (goals.length === 0) return null
  return (
    <div className={cn("flex flex-col gap-0.5 mt-2", side === 'home' ? "items-end" : "items-start")}>
      {goals.map((g, i) => (
        <span key={i} className="flex items-center gap-1 text-[11px] text-white/80">
          <span>⚽</span>
          <span>{g.playerName || '?'}</span>
          <span className="text-white/50">{g.minute}</span>
        </span>
      ))}
    </div>
  )
}

export default function MatchDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const timezone = getBrowserTimezone()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [savedMatch, setSavedMatch] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [tipSubmitted, setTipSubmitted] = useState<null | { label: string; odds: number }>(null)

  const { data, error, isLoading } = useSWR<MatchDetails>(
    `/api/matches/${encodeURIComponent(id)}/details`,
    fetcher,
    { refreshInterval: 20000 }
  )

  const match0 = data?.match
  const tipsUrl = match0
    ? `/api/matches/${encodeURIComponent(id)}/tips?home=${encodeURIComponent(match0.homeTeam.name)}&away=${encodeURIComponent(match0.awayTeam.name)}`
    : null
  const { data: tipsData } = useSWR<TipsData>(tipsUrl, fetcher)
  const tips = tipsData?.tips || []

  const match = data?.match
  const isLive = match && (match.status === 'live' || match.status === 'halftime' || match.status === 'extra_time' || match.status === 'penalties')
  const isFinished = match?.status === 'finished'
  const isHalftime = match?.status === 'halftime'
  const liveMinute = useLiveMinute(
    match?.kickoffTime || new Date().toISOString(),
    match?.minute,
    match?.status || '',
    match?.sport.slug || 'soccer'
  )
  const sportSlug = match?.sport.slug || 'soccer'
  const ticksByMinute = sportSlug === 'soccer' || sportSlug === 'football' || sportSlug === 'rugby'
  const liveLabel = liveStatusLabel(sportSlug, match?.status || '', liveMinute)

  if (isLoading) {
    return (
      <div className="flex h-96 flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-10 w-10" />
          <span className="text-sm text-muted-foreground">Loading match...</span>
        </div>
      </div>
    )
  }

  if (error || !data?.match) {
    return (
      <div className="flex-1 p-8 text-center">
        <div className="text-4xl mb-4">🏟️</div>
        <h1 className="text-2xl font-bold">Match not found</h1>
        <p className="mt-2 text-muted-foreground">This match may no longer be available.</p>
        <Button asChild className="mt-6"><Link href="/matches">Back to Matches</Link></Button>
      </div>
    )
  }

  const { bookmakerOdds, lineups, h2h, standings, news, leaders, matchEvents, segmentBreakdown, hasRealOdds } = data
  const sport = match.sport.slug

  return (
    <div className="flex-1 overflow-hidden">
      <div className="mx-auto max-w-7xl px-3 py-4 pb-28 md:px-6 md:py-6 md:pb-10">
        {/* Back */}
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground hover:text-foreground" asChild>
          <Link href="/matches"><ArrowLeft className="mr-1.5 h-4 w-4" />Matches</Link>
        </Button>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">

        {/* ─── HERO CARD ─── */}
        <div className="mb-5 overflow-hidden rounded-2xl shadow-2xl" style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
        }}>
          {/* League strip */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg shrink-0" aria-hidden>{SPORT_EMOJI[sport] || '🏆'}</span>
              <span className="text-base shrink-0" aria-hidden title={match.league.country}>{countryCodeToFlag(match.league.countryCode)}</span>
              <span className="text-sm font-semibold text-white/90 truncate">{match.league.name}</span>
              <span className="text-xs text-white/40 shrink-0 hidden sm:inline">• {match.league.country}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {isLive && !isHalftime && (
                <div className="flex items-center gap-1.5 bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-bold px-2.5 py-1 rounded-full">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                  LIVE {liveLabel !== 'LIVE' ? liveLabel : ''}
                </div>
              )}
              {isHalftime && (
                <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full">
                  HT
                </div>
              )}
              {match.status === 'scheduled' && (
                <div className="flex items-center gap-1.5 bg-white/10 text-white/70 text-xs font-medium px-2.5 py-1 rounded-full">
                  <Clock className="h-3 w-3" />
                  {getDayLabel(match.kickoffTime, timezone)} {formatTime(match.kickoffTime, timezone)}
                </div>
              )}
              {isFinished && (
                <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="h-3 w-3" /> FT
                </div>
              )}
              <button onClick={() => setSavedMatch(!savedMatch)} className="ml-1 p-1.5 rounded-full hover:bg-white/10 transition-colors">
                <Bookmark className={cn("h-4 w-4", savedMatch ? "fill-white text-white" : "text-white/50")} />
              </button>
              <button className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
                <Share2 className="h-4 w-4 text-white/50" />
              </button>
            </div>
          </div>

          {/* Teams + Score */}
          <div className="px-5 py-7 md:py-10">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-8">
              {/* Home */}
              <div className="flex flex-col items-center text-center">
                <div className="mb-3">
                  <TeamLogo teamName={match.homeTeam.name} logoUrl={match.homeTeam.logo} size="lg" />
                </div>
                {match.homeTeam.espnTeamId && match.homeTeam.leagueSlug ? (
                  <Link
                    href={`/teams/espn_${match.homeTeam.leagueSlug}_${match.homeTeam.espnTeamId}`}
                    className="text-base md:text-lg font-bold text-white line-clamp-2 hover:text-white/80 hover:underline"
                    onClick={e => e.stopPropagation()}
                  >
                    {match.homeTeam.name}
                  </Link>
                ) : (
                  <p className="text-base md:text-lg font-bold text-white line-clamp-2">{match.homeTeam.name}</p>
                )}
                {match.homeTeam.record && (
                  <p className="mt-0.5 text-xs text-white/40">{match.homeTeam.record}</p>
                )}
                {match.homeTeam.form && (
                  <div className="mt-2 flex gap-1 justify-center">
                    {match.homeTeam.form.split('').slice(0, 5).map((r, i) => <FormBadge key={i} result={r} />)}
                  </div>
                )}
                {(isLive || isFinished) && matchEvents.length > 0 && (
                  <ScorersList events={matchEvents} side="home" />
                )}
              </div>

              {/* Score / Time */}
              <div className="flex flex-col items-center min-w-[90px] md:min-w-[120px]">
                {(isLive || isFinished) ? (
                  <>
                    <div className="flex items-center gap-2 md:gap-4 tabular-nums">
                      <span className="text-5xl md:text-7xl font-black text-white leading-none">
                        {match.homeScore ?? 0}
                      </span>
                      <span className="text-2xl md:text-4xl font-light text-white/30">:</span>
                      <span className="text-5xl md:text-7xl font-black text-white leading-none">
                        {match.awayScore ?? 0}
                      </span>
                    </div>
                    {isLive && !isHalftime && (
                      <div className="mt-3 flex items-center gap-1.5">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse" />
                        <span className="font-mono text-sm font-bold text-rose-400">
                          {ticksByMinute ? `${liveMinute}'` : liveLabel}
                        </span>
                      </div>
                    )}
                    {isHalftime && <p className="mt-2 text-xs font-bold text-amber-400">HALF TIME</p>}
                    {isFinished && <p className="mt-2 text-xs text-white/40 font-medium">FULL TIME</p>}
                  </>
                ) : (
                  <>
                    <p className="text-3xl md:text-5xl font-bold text-white tabular-nums">
                      {formatTime(match.kickoffTime, timezone)}
                    </p>
                    <p className="mt-1.5 text-xs text-white/40">
                      {getDayLabel(match.kickoffTime, timezone)} • {formatDate(match.kickoffTime, timezone)}
                    </p>
                    <div className="mt-3 text-2xl text-white/20 font-light">vs</div>
                  </>
                )}
              </div>

              {/* Away */}
              <div className="flex flex-col items-center text-center">
                <div className="mb-3">
                  <TeamLogo teamName={match.awayTeam.name} logoUrl={match.awayTeam.logo} size="lg" />
                </div>
                {match.awayTeam.espnTeamId && match.awayTeam.leagueSlug ? (
                  <Link
                    href={`/teams/espn_${match.awayTeam.leagueSlug}_${match.awayTeam.espnTeamId}`}
                    className="text-base md:text-lg font-bold text-white line-clamp-2 hover:text-white/80 hover:underline"
                    onClick={e => e.stopPropagation()}
                  >
                    {match.awayTeam.name}
                  </Link>
                ) : (
                  <p className="text-base md:text-lg font-bold text-white line-clamp-2">{match.awayTeam.name}</p>
                )}
                {match.awayTeam.record && (
                  <p className="mt-0.5 text-xs text-white/40">{match.awayTeam.record}</p>
                )}
                {match.awayTeam.form && (
                  <div className="mt-2 flex gap-1 justify-center">
                    {match.awayTeam.form.split('').slice(0, 5).map((r, i) => <FormBadge key={i} result={r} />)}
                  </div>
                )}
                {(isLive || isFinished) && matchEvents.length > 0 && (
                  <ScorersList events={matchEvents} side="away" />
                )}
              </div>
            </div>
          </div>

          {/* Odds bar — always shown */}
          {match.odds && (
            <div className="px-5 pb-5">
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <OddsButton label="1" sublabel={match.homeTeam.name.split(' ')[0]} value={match.odds.home} />
                  {match.odds.draw !== undefined ? (
                    <OddsButton label="X" sublabel="Draw" value={match.odds.draw} />
                  ) : <div />}
                  <OddsButton label="2" sublabel={match.awayTeam.name.split(' ')[0]} value={match.odds.away} />
                </div>
                <OddsProbBar home={match.odds.home} draw={match.odds.draw} away={match.odds.away} />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] text-white/30">
                    {match.oddsIsComputed ? '📊 Estimated odds' : `Odds • ${match.odds.bookmaker || 'Market'}`}
                  </p>
                  {!hasRealOdds && <Badge variant="outline" className="text-[9px] border-white/20 text-white/30 py-0">Estimated</Badge>}
                </div>
              </div>
            </div>
          )}

          {/* Venue strip */}
          {(match.venue || match.broadcasts?.length || match.attendance) && (
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-5 pb-4 text-xs text-white/40">
              {match.venue && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />{match.venue}{match.venueCity ? `, ${match.venueCity}` : ''}
                </span>
              )}
              {match.attendance ? <span>👥 {match.attendance.toLocaleString()}</span> : null}
              {match.broadcasts && match.broadcasts.length > 0 && (
                <span className="flex items-center gap-1">
                  <Tv className="h-3 w-3" />{match.broadcasts.slice(0, 3).join(', ')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ─── SPORT-SPECIFIC SCORE BREAKDOWN ───
            Quarter / inning / set / round grids. Only renders when ESPN
            actually returned linescores (i.e. live or finished games). For
            soccer we skip — there are no meaningful periods beyond HT/FT
            which the hero already shows. */}
        {segmentBreakdown && sport !== 'soccer' && segmentBreakdown.labels.length > 0 && (
          <div className="mb-4">
            <SegmentBreakdownGrid
              data={segmentBreakdown}
              homeName={match.homeTeam.name}
              awayName={match.awayTeam.name}
              homeLogo={match.homeTeam.logo}
              awayLogo={match.awayTeam.logo}
            />
          </div>
        )}

        {/* ─── TABS ─── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-auto flex flex-wrap gap-1 bg-muted/60 p-1 rounded-xl mb-4">
            <TabsTrigger value="overview" className="flex-1 text-xs md:text-sm rounded-lg">
              <BarChart3 className="mr-1 h-3.5 w-3.5 hidden sm:inline" />Overview
            </TabsTrigger>
            <TabsTrigger value="tips" className="flex-1 text-xs md:text-sm rounded-lg relative">
              <Star className="mr-1 h-3.5 w-3.5 hidden sm:inline text-amber-400" />
              Tips
              {tips.length > 0 && (
                <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0 text-[9px] font-bold text-white leading-4">{tips.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="events" className="flex-1 text-xs md:text-sm rounded-lg relative">
              <Zap className="mr-1 h-3.5 w-3.5 hidden sm:inline" />Events
              {isLive && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />}
            </TabsTrigger>
            <TabsTrigger value="odds" className="flex-1 text-xs md:text-sm rounded-lg">
              <TrendingUp className="mr-1 h-3.5 w-3.5 hidden sm:inline" />Odds
            </TabsTrigger>
            <TabsTrigger value="lineups" className="flex-1 text-xs md:text-sm rounded-lg">
              <Shirt className="mr-1 h-3.5 w-3.5 hidden sm:inline" />Lineups
            </TabsTrigger>
            <TabsTrigger value="h2h" className="flex-1 text-xs md:text-sm rounded-lg">
              <Award className="mr-1 h-3.5 w-3.5 hidden sm:inline" />H2H
            </TabsTrigger>
            <TabsTrigger value="standings" className="flex-1 text-xs md:text-sm rounded-lg">
              <Trophy className="mr-1 h-3.5 w-3.5 hidden sm:inline" />Table
            </TabsTrigger>
            <TabsTrigger value="news" className="flex-1 text-xs md:text-sm rounded-lg">
              <Newspaper className="mr-1 h-3.5 w-3.5 hidden sm:inline" />News
            </TabsTrigger>
          </TabsList>

          {/* ══ OVERVIEW ══ */}
          <TabsContent value="overview" className="mt-0 space-y-4">
            {/* AI Auto-Prediction */}
            <AIMatchPrediction
              homeTeam={match.homeTeam.name}
              awayTeam={match.awayTeam.name}
              sportSlug={sport}
              odds={match.odds || null}
              homeForm={match.homeTeam.form}
              awayForm={match.awayTeam.form}
              h2h={data.h2h}
            />

            {/* AI Multi-Market Predictions */}
            <AIMultiMarket
              homeTeam={match.homeTeam.name}
              awayTeam={match.awayTeam.name}
              sportSlug={sport}
              odds={match.odds || null}
              homeForm={match.homeTeam.form}
              awayForm={match.awayTeam.form}
              h2h={data.h2h}
              markets={match.markets || null}
            />

            {/* Tips Preview */}
            {tips.length > 0 && (
              <Card className="overflow-hidden border-amber-500/20">
                <div className="flex items-center justify-between px-4 pt-4 pb-3 bg-gradient-to-r from-amber-500/10 to-transparent">
                  <h3 className="flex items-center gap-2 text-sm font-bold">
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                    Expert Tips
                    <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-[10px]">{tips.length} predictions</Badge>
                  </h3>
                  <Button variant="ghost" size="sm" className="text-xs h-7 text-amber-600 hover:text-amber-700" onClick={() => setActiveTab('tips')}>
                    View all <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Button>
                </div>
                <CardContent className="p-3 space-y-2">
                  {tips.slice(0, 2).map((tip, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/30 px-3 py-2.5">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                          {tip.tipster.displayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold">{tip.tipster.displayName}</span>
                          {tip.tipster.isPremium && <Badge className="h-4 text-[9px] bg-amber-500/20 text-amber-600 border-0">PRO</Badge>}
                          <span className="text-[10px] text-muted-foreground">• {tip.tipster.winRate}% win rate</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm font-bold text-primary">{tip.prediction}</span>
                          <span className="text-xs text-muted-foreground">@ {tip.odds.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-emerald-500">{tip.confidence}%</div>
                        <div className="text-[9px] text-muted-foreground">confident</div>
                      </div>
                    </div>
                  ))}
                  {tips.length > 2 && (
                    <button onClick={() => setActiveTab('tips')} className="w-full py-2 text-xs text-amber-600 hover:text-amber-700 font-medium text-center rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors">
                      +{tips.length - 2} more tips →
                    </button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Match summary events preview */}
            {matchEvents.length > 0 && (
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <h3 className="flex items-center gap-2 text-sm font-bold">
                    <Zap className="h-4 w-4 text-primary" />Match Events
                  </h3>
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setActiveTab('events')}>
                    View all
                  </Button>
                </div>
                <CardContent className="px-4 pb-4">
                  <div className="mb-2 grid grid-cols-3 text-[10px] uppercase tracking-wide text-muted-foreground">
                    <span className="text-right">{match.homeTeam.name}</span>
                    <span className="text-center">Min</span>
                    <span>{match.awayTeam.name}</span>
                  </div>
                  <EventsTimeline
                    events={matchEvents.filter(e => e.type === 'goal' || e.type === 'own_goal' || e.type === 'penalty_goal').slice(0, 6)}
                    homeName={match.homeTeam.name}
                    awayName={match.awayTeam.name}
                  />
                </CardContent>
              </Card>
            )}

            {/* Top Performers */}
            {leaders.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
                    <Award className="h-4 w-4 text-amber-500" />Top Performers
                  </h3>
                  <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {leaders.slice(0, 6).map((l, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/30 p-3">
                        {l.headshot ? (
                          <Image src={l.headshot} alt={l.athlete || ''} width={40} height={40} className="rounded-full ring-2 ring-border" unoptimized />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {l.athlete?.slice(0, 2)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{l.athlete}</p>
                          <p className="truncate text-xs text-muted-foreground">{l.category}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-primary">{l.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Form */}
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold">
                  <TrendingUp className="h-4 w-4 text-primary" />Recent Form
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { team: match.homeTeam, label: 'Home' },
                    { team: match.awayTeam, label: 'Away' },
                  ].map(({ team, label }) => (
                    <div key={label}>
                      <div className="mb-2 flex items-center gap-2">
                        <TeamLogo teamName={team.name} logoUrl={team.logo} size="sm" />
                        <span className="truncate text-sm font-semibold">{team.name}</span>
                      </div>
                      {team.form ? (
                        <div className="flex flex-wrap gap-1">
                          {team.form.split('').map((r, i) => <FormBadge key={i} result={r} />)}
                        </div>
                      ) : <p className="text-xs text-muted-foreground">No form data</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* H2H quick */}
            {h2h && h2h.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-bold">
                      <Users className="h-4 w-4 text-primary" />Head to Head
                    </h3>
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setActiveTab('h2h')}>View all</Button>
                  </div>
                  <div className="space-y-2">
                    {h2h.slice(0, 3).map((g, i) => (
                      <H2HRow key={i} game={g} timezone={timezone} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* News */}
            {news.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-bold">
                      <Newspaper className="h-4 w-4 text-primary" />Latest News
                    </h3>
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setActiveTab('news')}>View all</Button>
                  </div>
                  <div className="space-y-2">
                    {news.slice(0, 2).map((n, i) => <NewsRow key={i} item={n} />)}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ══ TIPS ══ */}
          <TabsContent value="tips" className="mt-0 space-y-4">
            {/* Tips Header Stats */}
            {tips.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border/40 bg-card p-3 text-center">
                  <div className="text-2xl font-black text-foreground">{tips.length}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Total Tips</div>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
                  <div className="text-2xl font-black text-emerald-500">
                    {Math.round(tips.reduce((s, t) => s + t.confidence, 0) / tips.length)}%
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Avg Confidence</div>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">
                  <div className="text-2xl font-black text-amber-500">
                    {(tips.reduce((s, t) => s + t.odds, 0) / tips.length).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Avg Odds</div>
                </div>
              </div>
            )}

            {/* Tips List */}
            {tips.length > 0 ? (
              <div className="space-y-3">
                {tips.map((tip) => (
                  <TipCard key={tip.id} tip={tip} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <Star className="h-12 w-12 mx-auto mb-3 text-amber-400/30" />
                  <p className="font-semibold text-lg">No tips yet for this match</p>
                  <p className="text-sm mt-1 text-muted-foreground">
                    {isAuthenticated ? "Be the first tipster — use the form below." : "Sign in to be the first tipster on this match."}
                  </p>
                  {!isAuthenticated && !authLoading && (
                    <Button asChild className="mt-5">
                      <Link href={`/login?redirect=/matches/${encodeURIComponent(id)}`}>Sign in to add a tip</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Inline Add Tip — auth-aware */}
            {tipSubmitted ? (
              <Card className="border-emerald-500/40 bg-emerald-500/5">
                <CardContent className="p-5 flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">Tip posted!</p>
                    <p className="text-sm text-muted-foreground">
                      {tipSubmitted.label} @ <span className="font-mono font-bold text-emerald-500">{tipSubmitted.odds.toFixed(2)}</span>
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setTipSubmitted(null)}>Add another</Button>
                </CardContent>
              </Card>
            ) : isAuthenticated && user ? (
              <AddTipForm
                matchId={match.id}
                homeTeam={match.homeTeam.name}
                awayTeam={match.awayTeam.name}
                odds={match.odds}
                markets={match.markets}
                isPremiumUser={user.role === 'admin' || user.role === 'tipster'}
                onSubmit={async (formData) => {
                  try {
                    const res = await fetch(`/api/matches/${encodeURIComponent(match.id)}/tips`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        ...formData,
                        homeTeam: match.homeTeam.name,
                        awayTeam: match.awayTeam.name,
                      }),
                    })
                    if (res.ok) {
                      setTipSubmitted({ label: formData.predictionLabel, odds: formData.odds })
                    }
                  } catch (err) {
                    console.error('Failed to post tip', err)
                  }
                }}
              />
            ) : authLoading ? null : (
              <Card className="border-dashed border-2 border-primary/20 bg-primary/3">
                <CardContent className="p-5 flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">Share your prediction</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Sign in or create an account to post a tip on this match. Your odds will auto-fill from real bookmaker prices.
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/login?redirect=/matches/${encodeURIComponent(id)}`}>Sign in</Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link href={`/register?redirect=/matches/${encodeURIComponent(id)}`}>Sign up</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ══ EVENTS ══ */}
          <TabsContent value="events" className="mt-0">
            <Card>
              <CardContent className="p-4">
                <div className="mb-3 grid grid-cols-3 text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                  <span className="text-right">{match.homeTeam.name}</span>
                  <span className="text-center">Min</span>
                  <span>{match.awayTeam.name}</span>
                </div>
                <EventsTimeline events={matchEvents} homeName={match.homeTeam.name} awayName={match.awayTeam.name} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══ ODDS ══ */}
          <TabsContent value="odds" className="mt-0 space-y-4">
            {/* Summary odds card */}
            {match.odds && (
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-primary/10 to-transparent px-4 pt-4 pb-3 border-b border-border/50">
                  <h3 className="flex items-center gap-2 text-sm font-bold">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Match Result
                    {match.oddsIsComputed && (
                      <Badge variant="outline" className="text-[9px] ml-1">Estimated</Badge>
                    )}
                  </h3>
                </div>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <OddsCardLarge label="1 Home" sublabel={match.homeTeam.name} value={match.odds.home} />
                    {match.odds.draw !== undefined
                      ? <OddsCardLarge label="X Draw" sublabel="Draw" value={match.odds.draw} highlight />
                      : <div />}
                    <OddsCardLarge label="2 Away" sublabel={match.awayTeam.name} value={match.odds.away} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Win Probability</p>
                    <OddsProbBar home={match.odds.home} draw={match.odds.draw} away={match.odds.away} />
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>{match.homeTeam.name}</span>
                      {match.odds.draw !== undefined && <span>Draw</span>}
                      <span>{match.awayTeam.name}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bookmaker comparison */}
            {bookmakerOdds.length > 0 && (
              <Card>
                <div className="px-4 pt-4 pb-3 border-b border-border/50">
                  <h3 className="text-sm font-bold">Bookmaker Comparison</h3>
                </div>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/40 text-xs uppercase text-muted-foreground bg-muted/30">
                          <th className="px-4 py-3 text-left">Bookmaker</th>
                          <th className="px-4 py-3 text-center">1</th>
                          {bookmakerOdds.some(o => o.draw !== undefined) && <th className="px-4 py-3 text-center">X</th>}
                          <th className="px-4 py-3 text-center">2</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookmakerOdds.map((o, i) => {
                          const best1 = Math.max(...bookmakerOdds.map(x => x.home))
                          const bestX = Math.max(...bookmakerOdds.map(x => x.draw ?? 0))
                          const best2 = Math.max(...bookmakerOdds.map(x => x.away))
                          return (
                            <tr key={i} className="border-b border-border/20 hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3 font-semibold text-sm">{o.bookmaker}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={cn("font-mono font-bold text-sm", o.home === best1 ? "text-emerald-500" : "text-foreground")}>
                                  {o.home.toFixed(2)}
                                </span>
                              </td>
                              {bookmakerOdds.some(x => x.draw !== undefined) && (
                                <td className="px-4 py-3 text-center">
                                  {o.draw !== undefined ? (
                                    <span className={cn("font-mono font-bold text-sm", o.draw === bestX ? "text-emerald-500" : "text-foreground")}>
                                      {o.draw.toFixed(2)}
                                    </span>
                                  ) : <span className="text-muted-foreground">—</span>}
                                </td>
                              )}
                              <td className="px-4 py-3 text-center">
                                <span className={cn("font-mono font-bold text-sm", o.away === best2 ? "text-emerald-500" : "text-foreground")}>
                                  {o.away.toFixed(2)}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="px-4 py-2 text-[10px] text-muted-foreground">Best odds highlighted in green</p>
                </CardContent>
              </Card>
            )}

            {/* Spreads / Totals */}
            {bookmakerOdds.some(o => o.spread || o.total) && (
              <div className="grid gap-4 md:grid-cols-2">
                {bookmakerOdds.some(o => o.spread) && (
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="mb-3 text-sm font-bold flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />Handicap / Spread
                      </h4>
                      <div className="space-y-2">
                        {bookmakerOdds.filter(o => o.spread).map((o, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5 text-sm">
                            <span className="font-medium text-muted-foreground">{o.bookmaker}</span>
                            <div className="flex gap-3 font-mono text-sm">
                              <span>{o.spread!.value > 0 ? '+' : ''}{o.spread!.value}</span>
                              <span className="font-bold text-primary">{o.spread!.homePrice.toFixed(2)}</span>
                              <span className="text-muted-foreground">/</span>
                              <span className="font-bold text-primary">{o.spread!.awayPrice.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {bookmakerOdds.some(o => o.total) && (
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="mb-3 text-sm font-bold flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />Over / Under
                      </h4>
                      <div className="space-y-2">
                        {bookmakerOdds.filter(o => o.total).map((o, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5 text-sm">
                            <span className="font-medium text-muted-foreground">{o.bookmaker} ({o.total!.value})</span>
                            <div className="flex gap-3 font-mono text-sm">
                              <span>O <span className="font-bold text-emerald-500">{o.total!.overPrice.toFixed(2)}</span></span>
                              <span>U <span className="font-bold text-rose-500">{o.total!.underPrice.toFixed(2)}</span></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {bookmakerOdds.length === 0 && !match.odds && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">No odds available</p>
                  <p className="text-sm mt-1">Odds will appear once published by bookmakers.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ══ LINEUPS ══ */}
          <TabsContent value="lineups" className="mt-0 space-y-4">
            {lineups && (lineups.home || lineups.away) ? (
              <>
                {/* Lineup status badge */}
                <div className="flex items-center gap-2">
                  <Badge className={cn(
                    "gap-1.5 px-3 py-1",
                    data?.hasLineups
                      ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-600 border-amber-500/30"
                  )}>
                    {data?.hasLineups ? (
                      <><CheckCircle2 className="h-3 w-3" />Confirmed Lineup</>
                    ) : (
                      <><AlertTriangle className="h-3 w-3" />Predicted Lineup — Official lineup not yet announced</>
                    )}
                  </Badge>
                </div>

                {/* Formation Pitch */}
                <Card className="overflow-hidden">
                  <div className="px-4 pt-4 pb-3 border-b border-border/50">
                    <h3 className="flex items-center gap-2 text-sm font-bold">
                      <Shirt className="h-4 w-4 text-primary" />
                      {data?.hasLineups ? 'Confirmed Formation' : 'Predicted Formation'}
                      {lineups.home?.formation && <span className="text-muted-foreground font-normal text-xs">({match.homeTeam.name}: {lineups.home.formation})</span>}
                      {lineups.away?.formation && <span className="text-muted-foreground font-normal text-xs">({match.awayTeam.name}: {lineups.away.formation})</span>}
                    </h3>
                  </div>
                  <CardContent className="p-4">
                    <FormationPitch home={lineups.home} away={lineups.away} />
                  </CardContent>
                </Card>

                {/* Squad lists */}
                <div className="grid gap-4 md:grid-cols-2">
                  {lineups.home && <RosterCard side="Home" roster={lineups.home} isConfirmed={!!data?.hasLineups} />}
                  {lineups.away && <RosterCard side="Away" roster={lineups.away} isConfirmed={!!data?.hasLineups} />}
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="py-14 text-center text-muted-foreground">
                  <Shirt className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold text-base">Lineup not announced yet</p>
                  <p className="text-sm mt-1">Squad lists are usually confirmed 1 hour before kickoff.</p>
                  <Badge variant="outline" className="mt-3 text-amber-500 border-amber-500/30">
                    <AlertTriangle className="h-3 w-3 mr-1" />Expected 1h before kickoff
                  </Badge>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ══ H2H ══ */}
          <TabsContent value="h2h" className="mt-0">
            {h2h && h2h.length > 0 ? (
              <div className="space-y-3">
                {/* Summary bar */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="mb-3 text-sm font-bold flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />Head to Head — Last {h2h.length} meetings
                    </h3>
                    <H2HSummaryBar games={h2h} homeName={match.homeTeam.name} />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {h2h.map((g, i) => <H2HRow key={i} game={g} timezone={timezone} homeName={match.homeTeam.name} />)}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="py-14 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">No previous meetings</p>
                  <p className="text-sm mt-1">No head-to-head history available.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ══ STANDINGS ══ */}
          <TabsContent value="standings" className="mt-0 space-y-4">
            {standings && standings.length > 0 ? (
              standings.map((g, i) => (
                <Card key={i} className="overflow-hidden">
                  {g.header && (
                    <div className="px-4 pt-4 pb-3 border-b border-border/50">
                      <h3 className="text-sm font-bold">{g.header}</h3>
                    </div>
                  )}
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/40 text-xs uppercase text-muted-foreground bg-muted/30">
                            <th className="px-3 py-3 text-left w-8">#</th>
                            <th className="px-3 py-3 text-left">Team</th>
                            <th className="px-3 py-3 text-center">P</th>
                            <th className="px-3 py-3 text-center">W</th>
                            <th className="px-3 py-3 text-center">D</th>
                            <th className="px-3 py-3 text-center">L</th>
                            {g.rows.some(r => r.goalsFor !== undefined) && <th className="px-3 py-3 text-center">GD</th>}
                            <th className="px-3 py-3 text-center font-bold">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.rows.map((r, ri) => {
                            const isCurrent = r.teamName === match.homeTeam.name || r.teamName === match.awayTeam.name
                            return (
                              <tr key={ri} className={cn(
                                "border-b border-border/20 hover:bg-muted/30 transition-colors",
                                isCurrent && "bg-primary/8 font-semibold"
                              )}>
                                <td className="px-3 py-2.5 text-muted-foreground text-center">{r.position ?? ri + 1}</td>
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <TeamLogo teamName={r.teamName || ''} logoUrl={r.teamLogo} size="sm" />
                                    {r.teamId && match.homeTeam.leagueSlug ? (
                                      <Link
                                        href={`/teams/espn_${match.homeTeam.leagueSlug}_${r.teamId}`}
                                        className={cn("truncate hover:underline", isCurrent ? "font-bold text-primary" : "hover:text-foreground")}
                                        onClick={e => e.stopPropagation()}
                                      >
                                        {r.teamName}
                                      </Link>
                                    ) : (
                                      <span className={cn("truncate", isCurrent && "font-bold text-primary")}>{r.teamName}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 text-center">{r.played}</td>
                                <td className="px-3 py-2.5 text-center text-emerald-600">{r.won}</td>
                                <td className="px-3 py-2.5 text-center text-amber-500">{r.drawn}</td>
                                <td className="px-3 py-2.5 text-center text-rose-500">{r.lost}</td>
                                {g.rows.some(x => x.goalsFor !== undefined) && (
                                  <td className="px-3 py-2.5 text-center text-muted-foreground">
                                    {r.goalDifference !== undefined ? (r.goalDifference > 0 ? '+' : '') + r.goalDifference : '—'}
                                  </td>
                                )}
                                <td className="px-3 py-2.5 text-center font-bold text-primary">{r.points}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-14 text-center text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">No standings available</p>
                  <p className="text-sm mt-1">Table data isn&apos;t published for this competition.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ══ NEWS ══ */}
          <TabsContent value="news" className="mt-0">
            <Card>
              <CardContent className="p-4">
                {news.length > 0 ? (
                  <div className="space-y-3">
                    {news.map((n, i) => <NewsRow key={i} item={n} />)}
                  </div>
                ) : (
                  <div className="py-14 text-center text-muted-foreground">
                    <Newspaper className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">No news yet</p>
                    <p className="text-sm mt-1">No articles available for this match.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
          </div>

          {/* ─── RIGHT RAIL (xl+) ─── */}
          <aside className="hidden xl:block">
            <div className="sticky top-4 space-y-4">
              <MatchInfoRail
                match={match!}
                bookmakerOdds={bookmakerOdds}
                hasRealOdds={hasRealOdds}
                standings={standings ?? []}
                h2h={h2h ?? []}
                onJumpToTab={setActiveTab}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

// ===== Right rail =====

function MatchInfoRail({
  match,
  bookmakerOdds,
  hasRealOdds,
  standings,
  h2h,
  onJumpToTab,
}: {
  match: MatchDetails['match']
  bookmakerOdds: BookmakerOdd[]
  hasRealOdds: boolean
  standings: StandingsGroup[]
  h2h: H2HGame[]
  onJumpToTab: (tab: string) => void
}) {
  const NO_DRAW = new Set(['basketball', 'baseball', 'tennis', 'mma'])
  const isTwoWay = NO_DRAW.has(match.sport.slug)
  const consensus = bookmakerOdds.length > 0 ? bookmakerOdds[0] : null
  const allRows = standings.flatMap(g => g.rows)
  const homeStanding = allRows.find(r => r.teamName === match.homeTeam.name)
  const awayStanding = allRows.find(r => r.teamName === match.awayTeam.name)
  const last3H2H = h2h.slice(0, 3)

  return (
    <>
      {/* Match info */}
      <Card>
        <CardContent className="p-4 space-y-3 text-sm">
          <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Match Info</h3>
          {match.venue && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-medium truncate">{match.venue}</p>
                {match.venueCity && <p className="text-xs text-muted-foreground truncate">{match.venueCity}{match.venueCountry ? `, ${match.venueCountry}` : ''}</p>}
              </div>
            </div>
          )}
          {match.league && (
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium truncate">{match.league.name}</span>
              {match.league.countryCode && (
                <span className="text-base leading-none">{countryCodeToFlag(match.league.countryCode)}</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-xs">{new Date(match.kickoffTime).toLocaleString()}</span>
          </div>
          {match.attendance && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs">{match.attendance.toLocaleString()} attendance</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick odds */}
      {consensus && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                {hasRealOdds ? 'Best Odds' : 'Estimated Odds'}
              </h3>
              <button
                onClick={() => onJumpToTab('odds')}
                className="text-xs text-primary hover:underline"
              >
                All →
              </button>
            </div>
            <div className={cn('grid gap-1.5', isTwoWay ? 'grid-cols-2' : 'grid-cols-3')}>
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">{isTwoWay ? 'Home' : '1'}</p>
                <p className="font-bold">{consensus.home.toFixed(2)}</p>
              </div>
              {!isTwoWay && consensus.draw !== undefined && (
                <div className="rounded-lg bg-muted/50 p-2 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase">X</p>
                  <p className="font-bold">{consensus.draw.toFixed(2)}</p>
                </div>
              )}
              <div className="rounded-lg bg-muted/50 p-2 text-center">
                <p className="text-[10px] text-muted-foreground uppercase">{isTwoWay ? 'Away' : '2'}</p>
                <p className="font-bold">{consensus.away.toFixed(2)}</p>
              </div>
            </div>
            {consensus.bookmaker && (
              <p className="text-[10px] text-muted-foreground text-center">via {consensus.bookmaker}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Standings snapshot */}
      {(homeStanding || awayStanding) && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Form</h3>
              <button
                onClick={() => onJumpToTab('standings')}
                className="text-xs text-primary hover:underline"
              >
                Table →
              </button>
            </div>
            {[homeStanding, awayStanding].filter(Boolean).map((t, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 px-2.5 py-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs text-muted-foreground w-5 text-right">{t!.position ?? '-'}</span>
                  <TeamLogo teamName={t!.teamName ?? ''} logoUrl={t!.teamLogo} size="sm" />
                  <span className="font-medium text-xs truncate">{t!.teamName}</span>
                </div>
                <span className="font-bold text-xs tabular-nums">{t!.points} pts</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* H2H teaser */}
      {last3H2H.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Last Meetings</h3>
              <button
                onClick={() => onJumpToTab('h2h')}
                className="text-xs text-primary hover:underline"
              >
                All →
              </button>
            </div>
            {last3H2H.map((g, i) => {
              const hs = g.home.score ?? 0
              const as_ = g.away.score ?? 0
              return (
                <div key={i} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate flex-1 text-right font-medium">{g.home.name}</span>
                  <span className="font-mono font-bold tabular-nums px-2 py-0.5 rounded bg-muted">
                    {hs}-{as_}
                  </span>
                  <span className="truncate flex-1 font-medium">{g.away.name}</span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </>
  )
}

// ===== Sub-components =====

function OddsButton({ label, sublabel, value }: { label: string; sublabel: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/8 border border-white/15 p-3 text-center cursor-pointer hover:bg-white/15 hover:border-white/25 transition-all">
      <p className="text-[10px] uppercase tracking-widest text-white/40 font-medium">{label}</p>
      <p className="text-xl font-black text-white mt-0.5">{value.toFixed(2)}</p>
      <p className="text-[9px] text-white/30 truncate mt-0.5">{sublabel}</p>
    </div>
  )
}

function OddsCardLarge({ label, sublabel, value, highlight }: { label: string; sublabel: string; value: number; highlight?: boolean }) {
  return (
    <div className={cn(
      "rounded-xl border p-4 text-center transition-all hover:shadow-md cursor-pointer",
      highlight ? "border-primary/30 bg-primary/8" : "border-border/50 bg-muted/40 hover:bg-muted/60"
    )}>
      <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">{label}</p>
      <p className={cn("text-2xl font-black mt-1", highlight ? "text-primary" : "text-foreground")}>{value.toFixed(2)}</p>
      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{sublabel}</p>
    </div>
  )
}

function H2HSummaryBar({ games, homeName }: { games: H2HGame[]; homeName: string }) {
  let hw = 0, draws = 0, aw = 0
  for (const g of games) {
    const hs = g.home.score ?? 0, as_ = g.away.score ?? 0
    const isHome = g.home.name === homeName
    if (hs > as_) isHome ? hw++ : aw++
    else if (as_ > hs) isHome ? aw++ : hw++
    else draws++
  }
  const total = hw + draws + aw || 1
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm font-semibold">
        <span className="text-emerald-600">{hw}W</span>
        <span className="text-muted-foreground">{draws}D</span>
        <span className="text-rose-500">{aw}W</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden">
        <div className="bg-emerald-500 transition-all" style={{ width: `${(hw / total) * 100}%` }} />
        <div className="bg-muted transition-all" style={{ width: `${(draws / total) * 100}%` }} />
        <div className="bg-rose-500 transition-all" style={{ width: `${(aw / total) * 100}%` }} />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{homeName}</span>
        <span>Draw</span>
        <span>Opponent</span>
      </div>
    </div>
  )
}

function H2HRow({ game, timezone, homeName }: { game: H2HGame; timezone: string; homeName?: string }) {
  const [expanded, setExpanded] = useState(false)
  const hs = game.home.score ?? 0
  const as_ = game.away.score ?? 0
  const homeWon = hs > as_
  const awayWon = as_ > hs
  const isFromCurrent = game.home.name === homeName

  return (
    <div className="rounded-xl border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors text-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2.5 text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 justify-end min-w-0">
          <span className={cn("truncate font-medium", homeWon && "font-bold text-emerald-600")}>{game.home.name}</span>
          <TeamLogo teamName={game.home.name} logoUrl={game.home.logo} size="sm" />
        </div>
        <div className="flex flex-col items-center min-w-[60px]">
          <div className="font-mono font-bold tabular-nums">
            <span className={cn(homeWon && "text-emerald-600")}>{game.home.score ?? '?'}</span>
            {' — '}
            <span className={cn(awayWon && "text-emerald-600")}>{game.away.score ?? '?'}</span>
          </div>
          <div className="text-[10px] text-muted-foreground flex items-center gap-1">
            {game.date ? formatDate(game.date, timezone) : ''}
            {game.league ? ` • ${game.league}` : ''}
            <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
          </div>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <TeamLogo teamName={game.away.name} logoUrl={game.away.logo} size="sm" />
          <span className={cn("truncate font-medium", awayWon && "font-bold text-emerald-600")}>{game.away.name}</span>
        </div>
      </button>
      {expanded && (
        <div className="border-t border-border/40 bg-muted/30 px-3 py-2.5 text-[11px] text-muted-foreground space-y-1.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-muted-foreground/70">Result:</span>{' '}
              <span className="font-semibold text-foreground">
                {homeWon ? `${game.home.name} won` : awayWon ? `${game.away.name} won` : 'Draw'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground/70">Total goals:</span>{' '}
              <span className="font-semibold text-foreground">{hs + as_}</span>
            </div>
            {game.league && (
              <div className="col-span-2">
                <span className="text-muted-foreground/70">Competition:</span>{' '}
                <span className="font-medium text-foreground">{game.league}</span>
              </div>
            )}
            {game.date && (
              <div className="col-span-2">
                <span className="text-muted-foreground/70">Played:</span>{' '}
                <span className="font-medium text-foreground">{formatDate(game.date, timezone)}</span>
              </div>
            )}
          </div>
          {!isFromCurrent && (
            <p className="pt-1 border-t border-border/30 text-[10px] italic text-muted-foreground/80">
              Reverse fixture — home/away swapped from current matchup.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function RosterCard({ side, roster, isConfirmed }: { side: string; roster: TeamRoster; isConfirmed?: boolean }) {
  const [showBench, setShowBench] = useState(false)
  return (
    <Card className="overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TeamLogo teamName={roster.teamName || ''} logoUrl={roster.teamLogo} size="sm" />
            <div>
              <p className="text-sm font-bold">{roster.teamName}</p>
              <p className="text-xs text-muted-foreground">
                {side}{roster.formation ? ` • ${roster.formation}` : ''}
              </p>
            </div>
          </div>
          <Badge className={cn(
            "text-[9px] px-2 py-0.5",
            isConfirmed
              ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
              : "bg-amber-500/15 text-amber-600 border-amber-500/30"
          )}>
            {isConfirmed ? 'Confirmed' : 'Predicted'}
          </Badge>
        </div>
        {roster.coach && (
          <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />Coach: <span className="font-medium text-foreground">{roster.coach}</span>
          </p>
        )}
      </div>
      <CardContent className="p-3">
        {roster.starting.length > 0 && (
          <>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Starting XI</p>
            <div className="mb-3 space-y-0.5">
              {roster.starting.map((p, i) => <PlayerRow key={i} player={p} />)}
            </div>
          </>
        )}
        {roster.bench.length > 0 && (
          <>
            <button
              className="flex w-full items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 hover:text-foreground transition-colors"
              onClick={() => setShowBench(!showBench)}
            >
              {showBench ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Bench ({roster.bench.length})
            </button>
            {showBench && (
              <div className="space-y-0.5">
                {roster.bench.slice(0, 12).map((p, i) => <PlayerRow key={i} player={p} bench />)}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

function PlayerRow({ player, bench }: { player: Player; bench?: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/50 transition-colors",
      bench && "opacity-70"
    )}>
      <span className="w-6 text-center font-mono text-xs text-muted-foreground shrink-0">{player.jersey || '-'}</span>
      {player.headshot ? (
        <Image src={player.headshot} alt="" width={24} height={24} className="rounded-full ring-1 ring-border shrink-0" unoptimized />
      ) : (
        <div className="h-6 w-6 rounded-full bg-muted shrink-0 flex items-center justify-center text-[8px] font-bold text-muted-foreground">
          {player.name.slice(0, 1)}
        </div>
      )}
      <span className="flex-1 truncate font-medium">{player.fullName || player.name}</span>
      {player.position && (
        <Badge variant="outline" className="text-[9px] py-0 px-1.5 shrink-0">{player.position}</Badge>
      )}
    </div>
  )
}

function NewsRow({ item }: { item: NewsItem }) {
  const inner = (
    <div className="flex gap-3 rounded-xl p-2 transition-colors hover:bg-muted/50">
      {item.image && (
        <Image src={item.image} alt="" width={80} height={60} className="h-16 w-20 shrink-0 rounded-lg object-cover" unoptimized />
      )}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-semibold leading-snug">{item.headline}</p>
        {item.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>}
        {item.published && (
          <p className="mt-1.5 text-[10px] text-muted-foreground/60">
            {new Date(item.published).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  )
  return item.link ? <a href={item.link} target="_blank" rel="noopener noreferrer">{inner}</a> : inner
}

// ===== TipCard Component =====
function TipCard({ tip }: { tip: MatchTip }) {
  const [likes, setLikes] = useState(tip.likes)
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null)

  const handleLike = () => {
    if (userVote === 'like') { setLikes(l => l - 1); setUserVote(null) }
    else { setLikes(l => userVote === 'dislike' ? l + 1 : l + 1); setUserVote('like') }
  }

  const confidenceColor =
    tip.confidence >= 80 ? 'text-emerald-500' :
    tip.confidence >= 65 ? 'text-amber-500' :
    'text-muted-foreground'

  return (
    <Card className={cn(
      "overflow-hidden transition-all hover:shadow-md",
      tip.tipster.isPremium && tip.isPremium && "border-amber-500/20"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-border/40",
        tip.tipster.isPremium && tip.isPremium && "bg-gradient-to-r from-amber-500/5 to-transparent"
      )}>
        <Link href={`/tipsters/${tip.tipster.id}`} className="flex items-center gap-3 hover:opacity-80 min-w-0 flex-1">
          <Avatar className="h-10 w-10 shrink-0 border-2 border-primary/20">
            <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
              {tip.tipster.displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-sm truncate">{tip.tipster.displayName}</span>
              {tip.tipster.isPremium && (
                <Badge className="h-4 shrink-0 gap-0.5 bg-amber-500/15 text-amber-600 border-amber-500/30 text-[9px]">
                  <Star className="h-2.5 w-2.5 fill-current" />PRO
                </Badge>
              )}
              {tip.tipster.verified && (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground flex-wrap">
              <span className="text-emerald-500 font-semibold">{tip.tipster.winRate}% win rate</span>
              <span>•</span>
              <span className={cn(tip.tipster.roi > 0 ? "text-emerald-500" : "text-rose-500", "font-semibold")}>
                {tip.tipster.roi > 0 ? '+' : ''}{tip.tipster.roi}% ROI
              </span>
              <span>•</span>
              <span>Rank #{tip.tipster.rank}</span>
            </div>
          </div>
        </Link>
        <div className="text-right shrink-0">
          <div className="text-xs text-muted-foreground">Stake</div>
          <div className="flex items-center gap-0.5 mt-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={cn(
                "h-2.5 w-2.5 rounded-sm",
                i < tip.stake ? "bg-primary" : "bg-muted"
              )} />
            ))}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{tip.stake}/5</div>
        </div>
      </div>

      {/* Prediction */}
      <div className="px-4 py-3">
        <div className="flex items-stretch gap-3">
          <div className="flex-1 rounded-xl bg-primary/6 border border-primary/15 p-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{tip.market}</div>
            <div className="mt-1 text-lg font-black text-primary leading-tight">{tip.prediction}</div>
          </div>
          <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 p-3 text-center min-w-[70px]">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Odds</div>
            <div className="mt-1 text-lg font-black text-emerald-500">{tip.odds.toFixed(2)}</div>
          </div>
          <div className="rounded-xl bg-muted/50 p-3 text-center min-w-[60px]">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Conf.</div>
            <div className={cn("mt-1 text-lg font-black", confidenceColor)}>{tip.confidence}%</div>
          </div>
        </div>

        {/* Analysis */}
        <div className="mt-3">
          {tip.isPremium && tip.tipster.isPremium ? (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-amber-500/8 border border-amber-500/20 px-4 py-3">
              <div className="flex items-center gap-2 text-amber-600 text-sm">
                <Lock className="h-4 w-4 shrink-0" />
                <span>Premium analysis — Subscribe to unlock</span>
              </div>
              <Button size="sm" variant="outline" className="shrink-0 border-amber-500/40 text-amber-600 hover:bg-amber-500/10 text-xs h-7">
                Unlock
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">{tip.analysis}</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 border-t border-border/40 px-4 py-2.5">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="sm"
            className={cn("h-7 gap-1 px-2 text-xs", userVote === 'like' && "text-emerald-500")}
            onClick={handleLike}
          >
            <ThumbsUp className="h-3.5 w-3.5" />{likes}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
            <MessageCircle className="h-3.5 w-3.5" />{tip.comments}
          </Button>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>{new Date(tip.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          <span>•</span>
          <span>{tip.tipster.followers.toLocaleString()} followers</span>
        </div>
      </div>
    </Card>
  )
}
