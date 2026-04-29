'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark, BookmarkX, Clock, Trophy, Loader2, LogIn, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MatchCardNew } from '@/components/matches/match-card-new';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/contexts/auth-context';
import { useAuthModal } from '@/contexts/auth-modal-context';
import { useMatches } from '@/lib/hooks/use-matches';
import type { Match } from '@/lib/api/sports-api';
import { cn } from '@/lib/utils';

interface BookmarkItem {
  entity_type: string;
  entity_id: string;
  created_at: string;
}

type FilterTab = 'all' | 'live' | 'upcoming' | 'finished';

export default function BookmarksPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { open: openAuthModal } = useAuthModal();
  const { matches: allMatches, isLoading: matchesLoading } = useMatches();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<FilterTab>('all');
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoadingBookmarks(false); return; }
    fetch('/api/bookmarks?type=match')
      .then(r => r.ok ? r.json() : { bookmarks: [] })
      .then(d => setBookmarks(d.bookmarks || []))
      .catch(() => setBookmarks([]))
      .finally(() => setLoadingBookmarks(false));
  }, [user, authLoading]);

  async function removeBookmark(entityId: string) {
    setRemoving(entityId);
    try {
      await fetch('/api/bookmarks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: entityId }),
      });
      setBookmarks(prev => prev.filter(b => b.entity_id !== entityId));
    } finally {
      setRemoving(null);
    }
  }

  // Match bookmarked IDs against live match data
  const bookmarkedIds = new Set(bookmarks.map(b => b.entity_id));
  const bookmarkedMatches: Match[] = allMatches.filter(m => bookmarkedIds.has(String(m.id)));

  // Matches that are bookmarked but not in the live feed (historical)
  const missingIds = bookmarks
    .filter(b => !allMatches.some(m => String(m.id) === b.entity_id))
    .map(b => b.entity_id);

  // Apply filters
  const filtered = bookmarkedMatches.filter(m => {
    if (tab === 'live' && m.status !== 'live' && m.status !== 'halftime') return false;
    if (tab === 'upcoming' && m.status !== 'scheduled') return false;
    if (tab === 'finished' && m.status !== 'finished') return false;
    if (search) {
      const s = search.toLowerCase();
      return m.homeTeam.name.toLowerCase().includes(s)
        || m.awayTeam.name.toLowerCase().includes(s)
        || m.league.name.toLowerCase().includes(s);
    }
    return true;
  });

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: bookmarkedMatches.length },
    { key: 'live', label: 'Live', count: bookmarkedMatches.filter(m => m.status === 'live' || m.status === 'halftime').length },
    { key: 'upcoming', label: 'Upcoming', count: bookmarkedMatches.filter(m => m.status === 'scheduled').length },
    { key: 'finished', label: 'Finished', count: bookmarkedMatches.filter(m => m.status === 'finished').length },
  ];

  if (authLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-xl px-4 py-16">
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Bookmark className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">My Bookmarks</h1>
          <p className="mt-2 text-muted-foreground">Sign in to save matches and revisit them anytime from one place.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => openAuthModal('login')}>
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
            <Button variant="outline" onClick={() => openAuthModal('register')}>
              Create Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isLoading = loadingBookmarks || matchesLoading;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bookmark className="h-6 w-6 text-primary" />
            My Bookmarks
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {bookmarks.length} saved {bookmarks.length === 1 ? 'match' : 'matches'}
          </p>
        </div>
        {bookmarks.length > 0 && (
          <Link href="/matches">
            <Button variant="outline" size="sm">
              Browse more matches
            </Button>
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      ) : bookmarks.length === 0 ? (
        /* Empty state */
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Bookmark className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h2 className="text-lg font-semibold">No bookmarks yet</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Save matches from the matches page by clicking the bookmark icon. They'll all appear here.
          </p>
          <Button asChild className="mt-6">
            <Link href="/matches">
              <Trophy className="mr-2 h-4 w-4" />
              Browse Matches
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Filter Tabs */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-border bg-card p-1">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    tab === t.key
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                      tab === t.key ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search bookmarks..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>

          {/* Match List */}
          {filtered.length > 0 ? (
            <div className="space-y-2">
              {filtered.map(match => (
                <div key={match.id} className="group relative">
                  <MatchCardNew match={match} variant="compact" showLeague />
                  <button
                    onClick={() => removeBookmark(String(match.id))}
                    disabled={removing === String(match.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md bg-background/80 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                    title="Remove bookmark"
                  >
                    {removing === String(match.id)
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <BookmarkX className="h-3.5 w-3.5" />
                    }
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
              <Filter className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">No matches for this filter</p>
              <button onClick={() => { setTab('all'); setSearch(''); }} className="mt-2 text-xs text-primary hover:underline">
                Clear filters
              </button>
            </div>
          )}

          {/* Missing matches (bookmarked but not in live feed) */}
          {missingIds.length > 0 && (
            <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{missingIds.length}</span> saved {missingIds.length === 1 ? 'match is' : 'matches are'} no longer in the live feed
                  (they may have ended long ago).{' '}
                  <button
                    onClick={async () => {
                      for (const id of missingIds) await removeBookmark(id);
                    }}
                    className="text-primary hover:underline"
                  >
                    Remove all
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
