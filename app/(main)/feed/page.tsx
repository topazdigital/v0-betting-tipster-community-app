'use client';

import { useRef, useState } from 'react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FollowTipsterButton } from '@/components/tipsters/follow-tipster-button';
import {
  Heart, MessageCircle, Send, Sparkles, Loader2, Flame, TrendingUp, Users, Lock,
  Crown, Trophy, Star, BarChart3, Activity, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(r => r.json());
const POSTS_KEY = '/api/feed/posts';

interface Post {
  id: string;
  userId: number;
  authorName: string;
  authorAvatar?: string | null;
  content: string;
  matchTitle?: string | null;
  pick?: string | null;
  odds?: number | null;
  likes: number;
  liked?: boolean;
  commentCount: number;
  createdAt: string;
}

interface Comment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

interface Me {
  user?: { id: number; username?: string; email?: string; displayName?: string } | null;
}

interface RecommendedTipster {
  id: number;
  username: string;
  displayName: string;
  winRate: number;
  roi: number;
  streak: number;
  followers: number;
  isPro: boolean;
  specialty: string;
  following?: boolean;
}

interface TrendingPick {
  id: string;
  authorName: string;
  pick?: string | null;
  odds?: number | null;
  matchTitle?: string | null;
  likes: number;
  commentCount: number;
  createdAt: string;
}

interface TrendingResponse {
  trending: TrendingPick[];
  stats: {
    postsToday: number;
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    activeUsers: number;
  };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function avatarInitials(name: string) {
  return name.split(/\s|_/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || '?';
}

function gradientFor(seed: string) {
  const palettes = [
    'from-pink-500 to-rose-600',
    'from-purple-500 to-indigo-600',
    'from-cyan-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-fuchsia-500 to-pink-600',
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return palettes[Math.abs(h) % palettes.length];
}

function CommentList({ postId, open }: { postId: string; open: boolean }) {
  const { data } = useSWR<{ comments: Comment[] }>(open ? `/api/feed/posts/${postId}/comments` : null, fetcher);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const t = text.trim();
    if (!t) return;
    setSending(true);
    const r = await fetch(`/api/feed/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: t }),
    });
    setSending(false);
    if (r.ok) {
      setText('');
      mutate(`/api/feed/posts/${postId}/comments`);
      mutate(POSTS_KEY);
    } else if (r.status === 401) {
      window.location.href = '/login?next=/feed';
    }
  };

  if (!open) return null;
  const comments = data?.comments ?? [];
  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3">
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-2">Be the first to reply.</p>
        ) : comments.map(c => (
          <div key={c.id} className="flex gap-2">
            <div className={cn('h-7 w-7 shrink-0 rounded-full bg-gradient-to-br text-[10px] font-bold text-white flex items-center justify-center', gradientFor(c.authorName))}>
              {avatarInitials(c.authorName)}
            </div>
            <div className="flex-1 rounded-2xl bg-muted/40 px-3 py-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold">{c.authorName}</span>
                <span className="text-[10px] text-muted-foreground">{timeAgo(c.createdAt)}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap break-words">{c.content}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder="Write a reply…"
          className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary"
        />
        <Button size="icon" onClick={submit} disabled={sending || !text.trim()} className="rounded-full">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const [openComments, setOpenComments] = useState(false);
  const [liked, setLiked] = useState(!!post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [busy, setBusy] = useState(false);

  const toggleLike = async () => {
    if (busy) return;
    setBusy(true);
    const optimistic = !liked;
    setLiked(optimistic);
    setLikes(l => l + (optimistic ? 1 : -1));
    const r = await fetch(`/api/feed/posts/${post.id}/like`, { method: 'POST' });
    setBusy(false);
    if (!r.ok) {
      setLiked(!optimistic);
      setLikes(l => l + (optimistic ? -1 : 1));
      if (r.status === 401) window.location.href = '/login?next=/feed';
      return;
    }
    const j = await r.json();
    if (typeof j.likes === 'number') setLikes(j.likes);
  };

  return (
    <Card className="overflow-hidden border-border/60 bg-card/60 backdrop-blur transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className={cn('h-10 w-10 shrink-0 rounded-full bg-gradient-to-br text-sm font-bold text-white flex items-center justify-center', gradientFor(post.authorName))}>
            {avatarInitials(post.authorName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{post.authorName}</span>
              <span className="text-xs text-muted-foreground">· {timeAgo(post.createdAt)}</span>
            </div>
            {post.matchTitle && (
              <p className="text-xs text-muted-foreground mt-0.5">on {post.matchTitle}</p>
            )}
          </div>
          <FollowTipsterButton tipsterId={post.userId} tipsterName={post.authorName} variant="pill" />
        </div>

        <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-relaxed">{post.content}</p>

        {(post.pick || post.odds) && (
          <div className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-3 py-2">
            {post.pick && (
              <Badge className="bg-primary/20 text-primary border-primary/30">
                <TrendingUp className="mr-1 h-3 w-3" />
                {post.pick}
              </Badge>
            )}
            {post.odds && (
              <span className="text-sm font-bold text-primary">@ {post.odds.toFixed(2)}</span>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={toggleLike}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors',
              liked ? 'bg-rose-500/15 text-rose-500' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
            <span className="font-medium">{likes}</span>
          </button>
          <button
            onClick={() => setOpenComments(o => !o)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="font-medium">{post.commentCount}</span>
          </button>
        </div>

        <CommentList postId={post.id} open={openComments} />
      </CardContent>
    </Card>
  );
}

function Composer({ me, onPosted }: { me: Me['user'] | null | undefined; onPosted: () => void }) {
  const [content, setContent] = useState('');
  const [pick, setPick] = useState('');
  const [odds, setOdds] = useState<string>('');
  const [matchTitle, setMatchTitle] = useState('');
  const [showExtras, setShowExtras] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef<HTMLTextAreaElement | null>(null);

  if (!me) {
    return (
      <Card className="border-dashed border-primary/40 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center sm:flex-row sm:text-left">
          <Lock className="h-10 w-10 text-primary" />
          <div className="flex-1">
            <p className="font-semibold">Join the conversation</p>
            <p className="text-sm text-muted-foreground">Sign in to share tips, react to posts, and chat with other tipsters.</p>
          </div>
          <Button asChild><Link href="/login?next=/feed">Sign in</Link></Button>
        </CardContent>
      </Card>
    );
  }

  const submit = async () => {
    const t = content.trim();
    if (!t) return;
    setSubmitting(true);
    const r = await fetch('/api/feed/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: t,
        pick: pick.trim() || null,
        odds: odds.trim() ? Number(odds) : null,
        matchTitle: matchTitle.trim() || null,
      }),
    });
    setSubmitting(false);
    if (r.ok) {
      setContent(''); setPick(''); setOdds(''); setMatchTitle(''); setShowExtras(false);
      onPosted();
    }
  };

  const name = me.displayName || me.username || me.email || `user_${me.id}`;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card">
      <CardContent className="p-4 sm:p-5">
        <div className="flex gap-3">
          <div className={cn('h-10 w-10 shrink-0 rounded-full bg-gradient-to-br text-sm font-bold text-white flex items-center justify-center', gradientFor(name))}>
            {avatarInitials(name)}
          </div>
          <div className="flex-1">
            <Textarea
              ref={ref}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="What's your pick today? Share analysis, results, or just hype it up 🔥"
              rows={2}
              className="resize-none border-0 bg-transparent text-[15px] focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
            />
            {showExtras && (
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <input value={matchTitle} onChange={e => setMatchTitle(e.target.value)} placeholder="Match (e.g. Arsenal vs Chelsea)" className="rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
                <input value={pick} onChange={e => setPick(e.target.value)} placeholder="Pick (e.g. Over 2.5)" className="rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
                <input value={odds} onChange={e => setOdds(e.target.value)} type="number" step="0.01" placeholder="Odds" className="rounded-md border border-border bg-background px-3 py-1.5 text-sm" />
              </div>
            )}
            <div className="mt-3 flex items-center justify-between">
              <button onClick={() => setShowExtras(s => !s)} className="text-xs text-primary hover:underline">
                {showExtras ? '− Hide tip details' : '+ Add a tip'}
              </button>
              <Button onClick={submit} disabled={submitting || !content.trim()} className="rounded-full">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="ml-1.5">Post</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendedTipstersRail() {
  const { data } = useSWR<{ tipsters: RecommendedTipster[] }>('/api/feed/recommended-tipsters', fetcher, { refreshInterval: 60000 });
  const tipsters = data?.tipsters ?? [];

  return (
    <Card className="border-border/60 bg-gradient-to-br from-card to-card/40">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-bold">Recommended Tipsters</h3>
        </div>
        <div className="space-y-3">
          {tipsters.length === 0 ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/40" />
              ))}
            </div>
          ) : tipsters.map(t => (
            <div key={t.id} className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50">
              <Link href={`/tipsters/${t.id}`} className="shrink-0">
                <div className={cn('relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white', gradientFor(t.displayName))}>
                  {avatarInitials(t.displayName)}
                  {t.isPro && (
                    <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-amber-950">P</span>
                  )}
                </div>
              </Link>
              <Link href={`/tipsters/${t.id}`} className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="truncate text-sm font-semibold group-hover:text-primary">{t.displayName}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-emerald-500 font-semibold">{t.winRate}%</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-amber-500">{t.specialty}</span>
                </div>
              </Link>
              <FollowTipsterButton tipsterId={t.id} tipsterName={t.displayName} variant="pill" />
            </div>
          ))}
        </div>
        <Link href="/tipsters" className="mt-3 block text-center text-xs font-semibold text-primary hover:underline">
          See all tipsters →
        </Link>
      </CardContent>
    </Card>
  );
}

function TrendingRail() {
  const { data } = useSWR<TrendingResponse>('/api/feed/trending', fetcher, { refreshInterval: 60000 });
  const trending = data?.trending ?? [];
  const stats = data?.stats;

  return (
    <div className="space-y-4">
      <Card className="border-border/60 bg-gradient-to-br from-rose-500/5 via-card to-card">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Flame className="h-4 w-4 text-rose-500" />
            <h3 className="text-sm font-bold">Trending Picks</h3>
            <span className="ml-auto rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-500">24h</span>
          </div>
          <div className="space-y-3">
            {trending.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-4">No trending picks yet.</p>
            ) : trending.map((p, i) => (
              <div key={p.id} className="flex items-start gap-2">
                <span className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold',
                  i === 0 && 'bg-amber-500/20 text-amber-500',
                  i === 1 && 'bg-zinc-400/20 text-zinc-400',
                  i === 2 && 'bg-orange-700/20 text-orange-600',
                  i > 2 && 'bg-muted text-muted-foreground',
                )}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] py-0 px-1.5">{p.pick}</Badge>
                    {p.odds && <span className="text-[11px] font-bold text-primary">@ {p.odds.toFixed(2)}</span>}
                  </div>
                  {p.matchTitle && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{p.matchTitle}</p>}
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>by <span className="font-semibold text-foreground">{p.authorName}</span></span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5"><Heart className="h-2.5 w-2.5" />{p.likes}</span>
                    <span className="flex items-center gap-0.5"><MessageCircle className="h-2.5 w-2.5" />{p.commentCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-bold">Community Pulse</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <div className="text-lg font-bold text-emerald-500">{stats?.postsToday ?? '–'}</div>
              <div className="text-[10px] text-muted-foreground">Posts today</div>
            </div>
            <div className="rounded-lg bg-rose-500/10 p-2">
              <div className="text-lg font-bold text-rose-500">{stats?.totalLikes ?? '–'}</div>
              <div className="text-[10px] text-muted-foreground">Total likes</div>
            </div>
            <div className="rounded-lg bg-blue-500/10 p-2">
              <div className="text-lg font-bold text-blue-500">{stats?.totalComments ?? '–'}</div>
              <div className="text-[10px] text-muted-foreground">Comments</div>
            </div>
            <div className="rounded-lg bg-purple-500/10 p-2">
              <div className="text-lg font-bold text-purple-500">{stats?.activeUsers ?? '–'}</div>
              <div className="text-[10px] text-muted-foreground">Active</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-purple-500/5 to-card">
        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold">Get Notified</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Follow your favourite tipsters and teams to receive push alerts when they post a pick or have a match starting.
          </p>
          <Link href="/notifications" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            Manage alerts →
          </Link>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold">Quick Links</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link href="/leaderboard" className="rounded-lg border border-border p-2 hover:border-primary/40 hover:bg-primary/5">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              <p className="mt-1 font-semibold">Leaderboard</p>
            </Link>
            <Link href="/competitions" className="rounded-lg border border-border p-2 hover:border-primary/40 hover:bg-primary/5">
              <Star className="h-3.5 w-3.5 text-purple-500" />
              <p className="mt-1 font-semibold">Competitions</p>
            </Link>
            <Link href="/stats" className="rounded-lg border border-border p-2 hover:border-primary/40 hover:bg-primary/5">
              <BarChart3 className="h-3.5 w-3.5 text-blue-500" />
              <p className="mt-1 font-semibold">Stats Hub</p>
            </Link>
            <Link href="/live" className="rounded-lg border border-border p-2 hover:border-primary/40 hover:bg-primary/5">
              <Activity className="h-3.5 w-3.5 text-rose-500" />
              <p className="mt-1 font-semibold">Live Now</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function FeedPage() {
  const { data: meRes } = useSWR<Me>('/api/auth/me', fetcher);
  const { data: postsRes, isLoading } = useSWR<{ posts: Post[] }>(POSTS_KEY, fetcher, { refreshInterval: 30000 });
  const posts = postsRes?.posts ?? [];

  const refresh = () => mutate(POSTS_KEY);

  return (
    <div className="overflow-x-hidden">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)_300px] xl:grid-cols-[280px_minmax(0,1fr)_320px]">
            {/* LEFT RAIL */}
            <aside className="hidden lg:block space-y-4">
              <RecommendedTipstersRail />
            </aside>

            {/* CENTER FEED */}
            <main className="space-y-4 min-w-0">
              {/* Hero */}
              <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 via-purple-500/10 to-pink-500/10 p-6">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />
                <div className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-pink-500/20 blur-3xl" />
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight">The Feed</h1>
                      <p className="text-sm text-muted-foreground">Live community of tipsters, fans & analysts.</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-3 py-1 text-rose-500"><Flame className="h-3 w-3" /> Hot picks</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-500"><TrendingUp className="h-3 w-3" /> Live odds chat</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-primary"><Users className="h-3 w-3" /> {posts.length} posts today</span>
                  </div>
                </div>
              </div>

              {/* Composer */}
              <Composer me={meRes?.user ?? null} onPosted={refresh} />

              {/* Feed */}
              {isLoading ? (
                <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : posts.length === 0 ? (
                <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No posts yet. Be the first to share!</CardContent></Card>
              ) : (
                <div className="space-y-3">
                  {posts.map(p => <PostCard key={p.id} post={p} />)}
                </div>
              )}
            </main>

            {/* RIGHT RAIL */}
            <aside className="hidden lg:block">
              <div className="sticky top-4">
                <TrendingRail />
              </div>
            </aside>
        </div>
      </div>
    </div>
  );
}
