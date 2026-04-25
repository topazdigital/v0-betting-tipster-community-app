"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Heart, Trash2, RefreshCw, FileText, Loader2 } from "lucide-react"

interface FeedPost {
  id: string
  userId: number
  authorName: string
  content: string
  pick?: string | null
  odds?: number | null
  matchTitle?: string | null
  likes: number
  commentCount: number
  createdAt: string
}

export default function AdminFeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/feed/posts?limit=100', { cache: 'no-store' })
      const data = await res.json()
      setPosts(data.posts || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  async function remove(id: string) {
    if (!confirm('Delete this post permanently?')) return
    setBusyId(id)
    try {
      await fetch(`/api/admin/feed/${id}`, { method: 'DELETE' })
      setPosts(posts.filter(p => p.id !== id))
    } finally { setBusyId(null) }
  }

  const totalLikes = posts.reduce((s, p) => s + p.likes, 0)
  const totalComments = posts.reduce((s, p) => s + p.commentCount, 0)
  const today = posts.filter(p => Date.now() - new Date(p.createdAt).getTime() < 86_400_000).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Community Feed</h1>
          <p className="text-sm text-muted-foreground">Moderate posts shared by users</p>
        </div>
        <Button onClick={load} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard icon={FileText} label="Total posts" value={posts.length} color="text-blue-500 bg-blue-500/10" />
        <StatCard icon={FileText} label="Posts today" value={today} color="text-emerald-500 bg-emerald-500/10" />
        <StatCard icon={Heart} label="Total likes" value={totalLikes} color="text-pink-500 bg-pink-500/10" />
        <StatCard icon={MessageSquare} label="Total comments" value={totalComments} color="text-violet-500 bg-violet-500/10" />
      </div>

      <Card>
        <CardHeader><CardTitle>Recent posts</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No posts yet</p>
          ) : (
            <ul className="divide-y divide-border">
              {posts.map(p => (
                <li key={p.id} className="flex items-start gap-3 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {p.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{p.authorName}</span>
                      <span className="text-xs text-muted-foreground">user #{p.userId}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-sm">{p.content}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {p.pick && <Badge variant="outline" className="text-xs">{p.pick}</Badge>}
                      {p.odds && <Badge variant="outline" className="text-xs">@ {p.odds}</Badge>}
                      {p.matchTitle && <Badge variant="secondary" className="text-xs">{p.matchTitle}</Badge>}
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Heart className="h-3 w-3" /> {p.likes}</span>
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {p.commentCount}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => remove(p.id)} disabled={busyId === p.id} className="text-red-500 hover:bg-red-500/10">
                    {busyId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
