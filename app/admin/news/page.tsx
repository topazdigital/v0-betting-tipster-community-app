"use client"

import { useState } from "react"
import { Search, Plus, MoreHorizontal, Newspaper, Eye, Edit, Trash2, Calendar } from "lucide-react"
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
import { format, subDays } from "date-fns"

const articles = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  title: [
    "Premier League Weekend Preview: Top Matches to Watch",
    "Champions League Quarter-Finals Betting Guide",
    "NBA Playoffs: Best Value Bets This Week",
    "Tennis Grand Slam: Dark Horse Predictions",
    "Football Transfer News: Impact on Betting Markets",
    "Weekly Tipster Spotlight: Top Performers"
  ][i % 6],
  excerpt: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.",
  category: ["Football", "Basketball", "Tennis", "General"][i % 4],
  status: i % 3 === 0 ? "draft" : "published",
  author: `Author${(i % 5) + 1}`,
  views: Math.floor(100 + Math.random() * 5000),
  publishedAt: subDays(new Date(), i * 2),
  image: `https://picsum.photos/seed/news${i}/400/200`
}))

export default function AdminNewsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredArticles = articles.filter(article => {
    if (searchQuery && !article.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (statusFilter !== "all" && article.status !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-bold">News Management</h1>
          <p className="text-muted-foreground">Create and manage news articles</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> New Article
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Newspaper className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Articles</p>
                <p className="text-lg font-bold">{articles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Eye className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-lg font-bold">
                  {articles.reduce((acc, a) => acc + a.views, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Calendar className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Drafts</p>
                <p className="text-lg font-bold">
                  {articles.filter(a => a.status === "draft").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
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
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredArticles.map((article) => (
          <Card key={article.id} className="overflow-hidden">
            <img 
              src={article.image} 
              alt={article.title}
              className="h-40 w-full object-cover"
            />
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline">{article.category}</Badge>
                <Badge variant={article.status === "published" ? "default" : "secondary"}
                  className={article.status === "published" ? "bg-emerald-500" : ""}>
                  {article.status}
                </Badge>
              </div>
              <h3 className="font-semibold line-clamp-2">{article.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  <p>By {article.author}</p>
                  <p>{format(article.publishedAt, "MMM d, yyyy")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="h-3 w-3" /> {article.views}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem>View</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-500">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
