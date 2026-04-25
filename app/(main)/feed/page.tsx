'use client';

import { useEffect, useRef, useState } from 'react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { SidebarNew } from '@/components/layout/sidebar-new';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Heart, MessageCircle, Send, Sparkles, Loader2, Flame, TrendingUp, Users, Lock,
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
      window.location.href = '/login?redirect=/feed';
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
      if (r.status === 401) window.location.href = '/login?redirect=/feed';
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
          <Button asChild><Link href="/login?redirect=/feed">Sign in</Link></Button>
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

export default function FeedPage() {
  const { data: meRes } = useSWR<Me>('/api/auth/me', fetcher);
  const { data: postsRes, isLoading } = useSWR<{ posts: Post[] }>(POSTS_KEY, fetcher, { refreshInterval: 30000 });
  const posts = postsRes?.posts ?? [];

  const refresh = () => mutate(POSTS_KEY);

  return (
    <div className="flex">
      <SidebarNew />
      <div className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-2xl space-y-4 p-4 lg:p-8">
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
        </div>
      </div>
    </div>
  );
}
