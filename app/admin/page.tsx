"use client"

import { 
  Users, Trophy, Calendar, TrendingUp, DollarSign, 
  Activity, ArrowUpRight, ArrowDownRight, Eye, MessageSquare,
  CheckCircle2, XCircle, Clock, Zap
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const stats = [
  { 
    title: "Total Users", 
    value: "24,532", 
    change: "+12.5%", 
    trend: "up",
    icon: Users,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10"
  },
  { 
    title: "Active Tipsters", 
    value: "1,284", 
    change: "+8.2%", 
    trend: "up",
    icon: Trophy,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10"
  },
  { 
    title: "Today Matches", 
    value: "156", 
    change: "+24", 
    trend: "up",
    icon: Calendar,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10"
  },
  { 
    title: "Predictions", 
    value: "8,942", 
    change: "+18.7%", 
    trend: "up",
    icon: TrendingUp,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10"
  },
  { 
    title: "Revenue", 
    value: "$45,231", 
    change: "+22.4%", 
    trend: "up",
    icon: DollarSign,
    color: "text-green-500",
    bgColor: "bg-green-500/10"
  },
  { 
    title: "Page Views", 
    value: "1.2M", 
    change: "-3.2%", 
    trend: "down",
    icon: Eye,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10"
  },
]

const recentUsers = [
  { id: 1, name: "John Smith", email: "john@example.com", joined: "2 mins ago", status: "active", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=john" },
  { id: 2, name: "Sarah Wilson", email: "sarah@example.com", joined: "15 mins ago", status: "active", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah" },
  { id: 3, name: "Mike Johnson", email: "mike@example.com", joined: "1 hour ago", status: "pending", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike" },
  { id: 4, name: "Emma Davis", email: "emma@example.com", joined: "2 hours ago", status: "active", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma" },
  { id: 5, name: "Chris Brown", email: "chris@example.com", joined: "3 hours ago", status: "active", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=chris" },
]

const recentPredictions = [
  { id: 1, tipster: "ProTipster99", match: "Arsenal vs Chelsea", prediction: "Over 2.5", odds: "1.85", status: "won" },
  { id: 2, tipster: "BetKing", match: "Lakers vs Warriors", prediction: "Lakers Win", odds: "2.10", status: "pending" },
  { id: 3, tipster: "SoccerGuru", match: "Real Madrid vs Barcelona", prediction: "BTTS", odds: "1.75", status: "won" },
  { id: 4, tipster: "TennisAce", match: "Djokovic vs Nadal", prediction: "Djokovic Win", odds: "1.65", status: "lost" },
  { id: 5, tipster: "HockeyPro", match: "Bruins vs Rangers", prediction: "Under 5.5", odds: "1.90", status: "pending" },
]

const topTipsters = [
  { rank: 1, name: "ProTipster99", winRate: 78, profit: "+$12,450", predictions: 342, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=pro99" },
  { rank: 2, name: "BetKing", winRate: 74, profit: "+$9,820", predictions: 289, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=betking" },
  { rank: 3, name: "SoccerGuru", winRate: 71, profit: "+$8,340", predictions: 456, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=soccer" },
  { rank: 4, name: "TennisAce", winRate: 69, profit: "+$7,120", predictions: 198, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=tennis" },
  { rank: 5, name: "HockeyPro", winRate: 67, profit: "+$5,890", predictions: 234, avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=hockey" },
]

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Download Report</Button>
          <Button>Add New Match</Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <Badge 
                  variant="outline" 
                  className={stat.trend === "up" ? "border-emerald-500 text-emerald-500" : "border-red-500 text-red-500"}
                >
                  {stat.trend === "up" ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
                  {stat.change}
                </Badge>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Users</CardTitle>
            <Link href="/admin/users">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full" />
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={user.status === "active" ? "default" : "secondary"}>
                      {user.status}
                    </Badge>
                    <p className="mt-1 text-xs text-muted-foreground">{user.joined}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Predictions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Predictions</CardTitle>
            <Link href="/admin/predictions">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPredictions.map((pred) => (
                <div key={pred.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{pred.match}</p>
                    <p className="text-sm text-muted-foreground">
                      {pred.tipster} - {pred.prediction} @ {pred.odds}
                    </p>
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Tipsters & Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Tipsters */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Top Tipsters</CardTitle>
            <Link href="/admin/tipsters">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Rank</th>
                    <th className="pb-3 font-medium">Tipster</th>
                    <th className="pb-3 font-medium">Win Rate</th>
                    <th className="pb-3 font-medium">Profit</th>
                    <th className="pb-3 font-medium">Predictions</th>
                  </tr>
                </thead>
                <tbody>
                  {topTipsters.map((tipster) => (
                    <tr key={tipster.rank} className="border-b border-border last:border-0">
                      <td className="py-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                          tipster.rank === 1 ? "bg-amber-500 text-white" :
                          tipster.rank === 2 ? "bg-gray-400 text-white" :
                          tipster.rank === 3 ? "bg-amber-700 text-white" :
                          "bg-muted"
                        }`}>
                          {tipster.rank}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <img src={tipster.avatar} alt={tipster.name} className="h-8 w-8 rounded-full" />
                          <span className="font-medium">{tipster.name}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                            <div 
                              className="h-full bg-emerald-500" 
                              style={{ width: `${tipster.winRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{tipster.winRate}%</span>
                        </div>
                      </td>
                      <td className="py-3 font-medium text-emerald-500">{tipster.profit}</td>
                      <td className="py-3 text-muted-foreground">{tipster.predictions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start gap-2" variant="outline">
              <Calendar className="h-4 w-4" /> Add Match
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline">
              <Users className="h-4 w-4" /> Manage Users
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline">
              <Trophy className="h-4 w-4" /> Verify Tipster
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline">
              <MessageSquare className="h-4 w-4" /> Review Comments
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline">
              <Zap className="h-4 w-4" /> Send Notification
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Live Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-emerald-500" />
            Live Activity
            <span className="ml-2 flex h-2 w-2">
              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { action: "New user registered", user: "alex@example.com", time: "Just now" },
              { action: "Prediction placed", user: "ProTipster99", time: "30 seconds ago" },
              { action: "Comment posted", user: "SoccerFan123", time: "1 minute ago" },
              { action: "Tipster verified", user: "BetMaster", time: "2 minutes ago" },
              { action: "Match result updated", user: "System", time: "3 minutes ago" },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-sm">{activity.action}</span>
                  <span className="text-sm font-medium text-primary">{activity.user}</span>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
