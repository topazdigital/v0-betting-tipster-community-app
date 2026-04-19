"use client"

import { useState } from "react"
import { Search, MoreHorizontal, CheckCircle2, XCircle, Trophy, TrendingUp, Star, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const tipsters = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `Tipster${i + 1}`,
  email: `tipster${i + 1}@example.com`,
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=tipster${i}`,
  verified: i % 3 !== 0,
  status: i % 5 === 0 ? "pending" : "active",
  predictions: 100 + Math.floor(Math.random() * 500),
  winRate: 50 + Math.floor(Math.random() * 35),
  profit: (Math.random() * 20000 - 5000).toFixed(0),
  followers: Math.floor(Math.random() * 5000),
  joined: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
  sports: ["Football", "Basketball", "Tennis"].slice(0, 1 + Math.floor(Math.random() * 3))
}))

export default function AdminTipstersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [verifiedFilter, setVerifiedFilter] = useState("all")

  const filteredTipsters = tipsters.filter(tipster => {
    if (searchQuery && !tipster.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (verifiedFilter === "verified" && !tipster.verified) return false
    if (verifiedFilter === "unverified" && tipster.verified) return false
    return true
  })

  const pendingVerification = tipsters.filter(t => t.status === "pending").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tipsters Management</h1>
          <p className="text-muted-foreground">Manage and verify tipsters</p>
        </div>
        {pendingVerification > 0 && (
          <Badge variant="destructive" className="w-fit">
            {pendingVerification} pending verification
          </Badge>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Trophy className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tipsters</p>
                <p className="text-2xl font-bold">1,284</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold text-emerald-500">892</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Win Rate</p>
                <p className="text-2xl font-bold">67%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Star className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Predictions</p>
                <p className="text-2xl font-bold">45.2K</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tipsters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="all">All Tipsters</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tipsters Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTipsters.map((tipster) => (
          <Card key={tipster.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center gap-4 p-4">
                <div className="relative">
                  <img src={tipster.avatar} alt={tipster.name} className="h-16 w-16 rounded-full" />
                  {tipster.verified && (
                    <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{tipster.name}</h3>
                    {tipster.status === "pending" && (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{tipster.email}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {tipster.sports.map(sport => (
                      <Badge key={sport} variant="outline" className="text-xs">{sport}</Badge>
                    ))}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Profile</DropdownMenuItem>
                    <DropdownMenuItem>
                      <Shield className="mr-2 h-4 w-4" /> 
                      {tipster.verified ? "Remove Verification" : "Verify Tipster"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-500">
                      <XCircle className="mr-2 h-4 w-4" /> Suspend
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="grid grid-cols-4 gap-px border-t border-border bg-border">
                <div className="bg-card p-3 text-center">
                  <p className="text-lg font-bold">{tipster.predictions}</p>
                  <p className="text-xs text-muted-foreground">Tips</p>
                </div>
                <div className="bg-card p-3 text-center">
                  <p className={`text-lg font-bold ${tipster.winRate >= 60 ? "text-emerald-500" : ""}`}>
                    {tipster.winRate}%
                  </p>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </div>
                <div className="bg-card p-3 text-center">
                  <p className={`text-lg font-bold ${Number(tipster.profit) > 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {Number(tipster.profit) > 0 ? "+" : ""}{tipster.profit}
                  </p>
                  <p className="text-xs text-muted-foreground">Profit</p>
                </div>
                <div className="bg-card p-3 text-center">
                  <p className="text-lg font-bold">{tipster.followers}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
