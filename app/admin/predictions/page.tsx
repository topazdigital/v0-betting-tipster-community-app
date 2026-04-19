"use client"

import { useState } from "react"
import { Search, CheckCircle2, XCircle, Clock, TrendingUp, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { format, subHours } from "date-fns"

const predictions = Array.from({ length: 50 }, (_, i) => {
  const statuses = ["won", "lost", "pending"] as const
  const status = statuses[i % 3]
  
  return {
    id: i + 1,
    tipster: {
      name: `Tipster${(i % 10) + 1}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=tipster${i % 10}`
    },
    match: `Team ${i * 2 + 1} vs Team ${i * 2 + 2}`,
    prediction: ["Home Win", "Away Win", "Draw", "Over 2.5", "Under 2.5", "BTTS"][i % 6],
    odds: (1.5 + Math.random() * 2).toFixed(2),
    stake: Math.floor(1 + Math.random() * 10),
    status,
    result: status !== "pending" ? (status === "won" ? `+$${(Math.random() * 100).toFixed(2)}` : `-$${(Math.random() * 50).toFixed(2)}`) : null,
    createdAt: subHours(new Date(), i * 2)
  }
})

export default function AdminPredictionsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredPredictions = predictions.filter(pred => {
    if (searchQuery && !pred.match.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !pred.tipster.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (statusFilter !== "all" && pred.status !== statusFilter) return false
    return true
  })

  const stats = {
    total: predictions.length,
    won: predictions.filter(p => p.status === "won").length,
    lost: predictions.filter(p => p.status === "lost").length,
    pending: predictions.filter(p => p.status === "pending").length,
    winRate: Math.round((predictions.filter(p => p.status === "won").length / predictions.filter(p => p.status !== "pending").length) * 100) || 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Predictions Management</h1>
        <p className="text-muted-foreground">Review and manage all predictions</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Won</p>
            <p className="text-2xl font-bold text-emerald-500">{stats.won}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Lost</p>
            <p className="text-2xl font-bold text-red-500">{stats.lost}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold">{stats.winRate}%</p>
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
                placeholder="Search predictions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="all">All Status</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Predictions List */}
      <div className="space-y-3">
        {filteredPredictions.map((pred) => (
          <Card key={pred.id}>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <img src={pred.tipster.avatar} alt={pred.tipster.name} className="h-12 w-12 rounded-full" />
                  <div>
                    <p className="font-semibold">{pred.tipster.name}</p>
                    <p className="text-sm text-muted-foreground">{pred.match}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Prediction</p>
                    <p className="font-medium">{pred.prediction}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Odds</p>
                    <p className="font-bold text-primary">{pred.odds}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Stake</p>
                    <p className="font-medium">{pred.stake}u</p>
                  </div>
                  <Badge 
                    variant={pred.status === "won" ? "default" : pred.status === "lost" ? "destructive" : "secondary"}
                    className={pred.status === "won" ? "bg-emerald-500" : ""}
                  >
                    {pred.status === "won" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                    {pred.status === "lost" && <XCircle className="mr-1 h-3 w-3" />}
                    {pred.status === "pending" && <Clock className="mr-1 h-3 w-3" />}
                    {pred.status}
                  </Badge>
                  {pred.result && (
                    <span className={`font-bold ${pred.status === "won" ? "text-emerald-500" : "text-red-500"}`}>
                      {pred.result}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
