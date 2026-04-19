"use client"

import { useState } from "react"
import { Search, Plus, MoreHorizontal, Trophy, Users, Calendar, Award, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format, addDays } from "date-fns"

const competitions = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `Competition ${i + 1}`,
  description: "Weekly prediction competition with cash prizes",
  type: ["Weekly", "Monthly", "Special"][i % 3],
  status: i % 4 === 0 ? "upcoming" : i % 4 === 1 ? "active" : i % 4 === 2 ? "finished" : "draft",
  participants: Math.floor(50 + Math.random() * 500),
  prize: `$${Math.floor(100 + Math.random() * 1000)}`,
  startDate: addDays(new Date(), i * 7 - 30),
  endDate: addDays(new Date(), i * 7 - 23),
  predictions: Math.floor(100 + Math.random() * 2000)
}))

export default function AdminCompetitionsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredCompetitions = competitions.filter(comp => 
    comp.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Competitions Management</h1>
          <p className="text-muted-foreground">Create and manage prediction competitions</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Create Competition
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Trophy className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Competitions</p>
                <p className="text-2xl font-bold">{competitions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Award className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-emerald-500">
                  {competitions.filter(c => c.status === "active").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Participants</p>
                <p className="text-2xl font-bold">
                  {competitions.reduce((acc, c) => acc + c.participants, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Calendar className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">
                  {competitions.filter(c => c.status === "upcoming").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search competitions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCompetitions.map((comp) => (
          <Card key={comp.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <Badge variant={
                  comp.status === "active" ? "default" : 
                  comp.status === "upcoming" ? "secondary" : 
                  comp.status === "finished" ? "outline" : "outline"
                } className={comp.status === "active" ? "bg-emerald-500" : ""}>
                  {comp.status}
                </Badge>
                <Badge variant="outline" className="ml-2">{comp.type}</Badge>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                  <DropdownMenuItem>View Leaderboard</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-500">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-semibold">{comp.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{comp.description}</p>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Prize Pool</p>
                  <p className="font-bold text-emerald-500">{comp.prize}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Participants</p>
                  <p className="font-bold">{comp.participants}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Start</p>
                  <p className="font-medium">{format(comp.startDate, "MMM d")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">End</p>
                  <p className="font-medium">{format(comp.endDate, "MMM d")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
