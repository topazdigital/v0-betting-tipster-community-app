"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { User, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface Player {
  id?: string
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

interface LineupsProps {
  homeTeam: string
  awayTeam: string
  homeRoster?: TeamRoster | null
  awayRoster?: TeamRoster | null
  isConfirmed?: boolean
}

function PlayerRow({ player, bench }: { player: Player; bench?: boolean }) {
  const [imgError, setImgError] = useState(false)
  // Larger headshot (40px) when we have one — much more recognisable than the
  // tiny 24px chips. Players become a clickable link when an id is present.
  const Wrapper: React.ElementType = player.id ? Link : 'div'
  const wrapperProps = player.id ? { href: `/players/${player.id}` } : {}

  return (
    <Wrapper
      {...(wrapperProps as Record<string, unknown>)}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors",
        player.id ? "hover:bg-primary/10" : "hover:bg-muted/50",
        bench && "opacity-70"
      )}>
      <span className="w-6 text-center font-mono text-xs font-bold text-muted-foreground shrink-0">
        {player.jersey || "—"}
      </span>
      {player.headshot && !imgError ? (
        <Image
          src={player.headshot}
          alt={player.name}
          width={36}
          height={36}
          className="rounded-full ring-1 ring-border shrink-0 object-cover"
          onError={() => setImgError(true)}
          unoptimized
        />
      ) : (
        <div className="h-9 w-9 rounded-full bg-primary/10 shrink-0 flex items-center justify-center text-[11px] font-bold text-primary">
          {(player.fullName || player.name).slice(0, 1)}
        </div>
      )}
      <span className={cn(
        "flex-1 truncate text-sm font-medium",
        player.id && "group-hover:text-primary group-hover:underline underline-offset-2"
      )}>
        {player.fullName || player.name}
      </span>
      {player.position && (
        <Badge variant="outline" className="text-[9px] py-0 px-1.5 shrink-0 uppercase">
          {player.position}
        </Badge>
      )}
    </Wrapper>
  )
}

function RosterList({ roster, teamName }: { roster: TeamRoster; teamName: string }) {
  const [showBench, setShowBench] = useState(false)
  const starters = roster.starting.slice(0, 11)
  const bench = roster.bench

  return (
    <div className="space-y-1">
      {starters.length > 0 && (
        <div>
          <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Starting XI
          </p>
          <div className="space-y-0.5">
            {starters.map((p, i) => (
              <PlayerRow key={i} player={p} />
            ))}
          </div>
        </div>
      )}
      {bench.length > 0 && (
        <div className="mt-2">
          <button
            className="flex w-full items-center gap-1 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 hover:text-foreground transition-colors"
            onClick={() => setShowBench(!showBench)}
          >
            {showBench ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Bench ({bench.length})
          </button>
          {showBench && (
            <div className="space-y-0.5">
              {bench.slice(0, 12).map((p, i) => (
                <PlayerRow key={i} player={p} bench />
              ))}
            </div>
          )}
        </div>
      )}
      {starters.length === 0 && bench.length === 0 && (
        <p className="px-3 py-4 text-sm text-muted-foreground text-center">
          No lineup data available
        </p>
      )}
    </div>
  )
}

export function Lineups({
  homeTeam,
  awayTeam,
  homeRoster,
  awayRoster,
  isConfirmed = false,
}: LineupsProps) {
  const hasData = (homeRoster && homeRoster.starting.length > 0) ||
    (awayRoster && awayRoster.starting.length > 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Lineups</CardTitle>
          {isConfirmed ? (
            <Badge className="gap-1 text-xs bg-emerald-500/15 text-emerald-600 border-emerald-500/30">
              <CheckCircle2 className="h-3 w-3" />
              Confirmed
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-xs text-amber-600 border-amber-500/30">
              <AlertCircle className="h-3 w-3" />
              Predicted
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <Tabs defaultValue="home" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-3">
              <TabsTrigger value="home" className="gap-2 text-sm">
                <User className="h-4 w-4" />
                {homeRoster?.teamName || homeTeam}
                {homeRoster?.formation && (
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                    {homeRoster.formation}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="away" className="gap-2 text-sm">
                <User className="h-4 w-4" />
                {awayRoster?.teamName || awayTeam}
                {awayRoster?.formation && (
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                    {awayRoster.formation}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="home" className="mt-0">
              {homeRoster ? (
                <>
                  {homeRoster.coach && (
                    <p className="px-3 mb-2 text-xs text-muted-foreground">
                      Coach: <span className="font-medium text-foreground">{homeRoster.coach}</span>
                    </p>
                  )}
                  <RosterList roster={homeRoster} teamName={homeRoster.teamName || homeTeam} />
                </>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No lineup data for {homeTeam}
                </p>
              )}
            </TabsContent>

            <TabsContent value="away" className="mt-0">
              {awayRoster ? (
                <>
                  {awayRoster.coach && (
                    <p className="px-3 mb-2 text-xs text-muted-foreground">
                      Coach: <span className="font-medium text-foreground">{awayRoster.coach}</span>
                    </p>
                  )}
                  <RosterList roster={awayRoster} teamName={awayRoster.teamName || awayTeam} />
                </>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No lineup data for {awayTeam}
                </p>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="py-10 text-center text-muted-foreground">
            <User className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Lineup not announced yet</p>
            <p className="text-sm mt-1">Squad lists are usually confirmed 1 hour before kickoff.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
