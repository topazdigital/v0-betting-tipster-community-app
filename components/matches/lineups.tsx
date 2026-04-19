"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, AlertCircle } from "lucide-react"

interface Player {
  number: number
  name: string
  position: string
  isCaptain?: boolean
  isSubstitute?: boolean
}

interface LineupsProps {
  homeTeam: string
  awayTeam: string
  homeFormation?: string
  awayFormation?: string
  homeLineup?: Player[]
  awayLineup?: Player[]
  isConfirmed?: boolean
}

// Mock lineup data
const mockHomeLineup: Player[] = [
  { number: 1, name: "Raya", position: "GK" },
  { number: 4, name: "White", position: "RB" },
  { number: 6, name: "Gabriel", position: "CB" },
  { number: 2, name: "Saliba", position: "CB" },
  { number: 35, name: "Zinchenko", position: "LB" },
  { number: 41, name: "Rice", position: "DM" },
  { number: 29, name: "Havertz", position: "CM" },
  { number: 8, name: "Odegaard", position: "AM", isCaptain: true },
  { number: 7, name: "Saka", position: "RW" },
  { number: 11, name: "Martinelli", position: "LW" },
  { number: 9, name: "Jesus", position: "ST" },
]

const mockAwayLineup: Player[] = [
  { number: 1, name: "Sanchez", position: "GK" },
  { number: 24, name: "James", position: "RB", isCaptain: true },
  { number: 6, name: "Silva", position: "CB" },
  { number: 26, name: "Colwill", position: "CB" },
  { number: 21, name: "Chilwell", position: "LB" },
  { number: 45, name: "Caicedo", position: "DM" },
  { number: 25, name: "Fernandez", position: "CM" },
  { number: 20, name: "Palmer", position: "AM" },
  { number: 11, name: "Madueke", position: "RW" },
  { number: 18, name: "Nkunku", position: "LW" },
  { number: 15, name: "Jackson", position: "ST" },
]

const mockHomeSubs: Player[] = [
  { number: 22, name: "Ramsdale", position: "GK", isSubstitute: true },
  { number: 18, name: "Tomiyasu", position: "DEF", isSubstitute: true },
  { number: 5, name: "Partey", position: "MID", isSubstitute: true },
  { number: 19, name: "Trossard", position: "FWD", isSubstitute: true },
]

const mockAwaySubs: Player[] = [
  { number: 13, name: "Bettinelli", position: "GK", isSubstitute: true },
  { number: 14, name: "Chalobah", position: "DEF", isSubstitute: true },
  { number: 8, name: "Gallagher", position: "MID", isSubstitute: true },
  { number: 10, name: "Mudryk", position: "FWD", isSubstitute: true },
]

function PlayerRow({ player }: { player: Player }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {player.number}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{player.name}</span>
          {player.isCaptain && (
            <Badge variant="outline" className="h-5 px-1.5 text-[10px]">C</Badge>
          )}
        </div>
      </div>
      <Badge variant="secondary" className="text-xs">
        {player.position}
      </Badge>
    </div>
  )
}

export function Lineups({ 
  homeTeam, 
  awayTeam, 
  homeFormation = "4-3-3",
  awayFormation = "4-2-3-1",
  isConfirmed = false 
}: LineupsProps) {
  const homeLineup = mockHomeLineup
  const awayLineup = mockAwayLineup

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Lineups</CardTitle>
          {!isConfirmed && (
            <Badge variant="outline" className="gap-1 text-xs text-warning">
              <AlertCircle className="h-3 w-3" />
              Predicted
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="home" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="home" className="gap-2">
              <User className="h-4 w-4" />
              {homeTeam}
            </TabsTrigger>
            <TabsTrigger value="away" className="gap-2">
              <User className="h-4 w-4" />
              {awayTeam}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Formation</span>
              <Badge>{homeFormation}</Badge>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Starting XI</h4>
              <div className="grid gap-2">
                {homeLineup.map((player) => (
                  <PlayerRow key={player.number} player={player} />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Substitutes</h4>
              <div className="grid gap-2">
                {mockHomeSubs.map((player) => (
                  <PlayerRow key={player.number} player={player} />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="away" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Formation</span>
              <Badge>{awayFormation}</Badge>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Starting XI</h4>
              <div className="grid gap-2">
                {awayLineup.map((player) => (
                  <PlayerRow key={player.number} player={player} />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Substitutes</h4>
              <div className="grid gap-2">
                {mockAwaySubs.map((player) => (
                  <PlayerRow key={player.number} player={player} />
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
