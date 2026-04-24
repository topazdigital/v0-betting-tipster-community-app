"use client"

import { useState } from "react"
import { Search, CheckCircle2, XCircle, Flag, MoreHorizontal, MessageSquare, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format, subHours } from "date-fns"

const comments = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  user: {
    name: `User${i + 1}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`
  },
  content: [
    "Great prediction! I followed this tip and it was a winner.",
    "Not sure about this one, the odds seem too high.",
    "Thanks for sharing your analysis, very helpful!",
    "This tipster is consistently profitable.",
    "I disagree with this prediction based on recent form."
  ][i % 5],
  match: `Team ${i * 2 + 1} vs Team ${i * 2 + 2}`,
  status: i % 5 === 0 ? "flagged" : i % 3 === 0 ? "pending" : "approved",
  reports: i % 5 === 0 ? Math.floor(1 + Math.random() * 5) : 0,
  createdAt: subHours(new Date(), i * 2)
}))

export default function AdminCommentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredComments = comments.filter(comment => {
    if (searchQuery && !comment.content.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !comment.user.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (statusFilter !== "all" && comment.status !== statusFilter) return false
    return true
  })

  const stats = {
    total: comments.length,
    pending: comments.filter(c => c.status === "pending").length,
    flagged: comments.filter(c => c.status === "flagged").length,
    approved: comments.filter(c => c.status === "approved").length
  }

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-lg font-bold">Comments Moderation</h1>
        <p className="text-muted-foreground">Review and moderate user comments</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Comments</p>
            <p className="text-lg font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending Review</p>
            <p className="text-lg font-bold text-amber-500">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Flagged</p>
            <p className="text-lg font-bold text-red-500">{stats.flagged}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="text-lg font-bold text-emerald-500">{stats.approved}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search comments..."
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
              <option value="pending">Pending</option>
              <option value="flagged">Flagged</option>
              <option value="approved">Approved</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {filteredComments.map((comment) => (
          <Card key={comment.id} className={comment.status === "flagged" ? "border-red-500/50" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <img 
                  src={comment.user.avatar} 
                  alt={comment.user.name}
                  className="h-10 w-10 rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{comment.user.name}</span>
                      <Badge variant={
                        comment.status === "approved" ? "default" :
                        comment.status === "flagged" ? "destructive" : "secondary"
                      } className={comment.status === "approved" ? "bg-emerald-500" : ""}>
                        {comment.status}
                      </Badge>
                      {comment.reports > 0 && (
                        <Badge variant="outline" className="gap-1 border-red-500 text-red-500">
                          <Flag className="h-3 w-3" /> {comment.reports} reports
                        </Badge>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" /> Flag
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-500">
                          <XCircle className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="mt-2 text-muted-foreground">{comment.content}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> on {comment.match}
                    </span>
                    <span>{format(comment.createdAt, "MMM d, HH:mm")}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
