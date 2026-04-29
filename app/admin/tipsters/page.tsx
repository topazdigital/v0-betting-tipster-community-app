'use client';

import { useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';
import {
  Search, MoreHorizontal, CheckCircle2, XCircle, Trophy, TrendingUp, Star,
  Bot, Sparkles, RefreshCw, Users, Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AdminTipster {
  id: number;
  username: string;
  displayName: string;
  avatar: string | null;
  bio: string | null;
  countryCode: string | null;
  winRate: number;
  roi: number;
  totalTips: number;
  wonTips: number;
  lostTips: number;
  pendingTips: number;
  followers: number;
  isPro: boolean;
  subscriptionPrice: number | null;
  isVerified: boolean;
  joinedAt: string;
  isFake: boolean;
  status: string;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function AdminTipstersPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'real' | 'fake'>('all');
  const [genOpen, setGenOpen] = useState(false);
  const [genCount, setGenCount] = useState(100);
  const [genSeed, setGenSeed] = useState('');
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postResult, setPostResult] = useState<string | null>(null);

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (filter !== 'all') params.set('filter', filter);

  const { data, isLoading } = useSWR<{
    tipsters: AdminTipster[];
    counts: { total: number; real: number; fake: number };
  }>(`/api/admin/tipsters?${params.toString()}`, fetcher);

  const tipsters = data?.tipsters ?? [];
  const counts = data?.counts ?? { total: 0, real: 0, fake: 0 };

  const stats = useMemo(() => {
    const verified = tipsters.filter(t => t.isVerified).length;
    const avg = tipsters.length
      ? Math.round((tipsters.reduce((s, t) => s + t.winRate, 0) / tipsters.length))
      : 0;
    const total = tipsters.reduce((s, t) => s + t.totalTips, 0);
    return { verified, avg, total };
  }, [tipsters]);

  async function regenerate() {
    setGenerating(true);
    try {
      const r = await fetch('/api/admin/tipsters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'regenerate',
          count: genCount,
          ...(genSeed.trim() ? { seed: Number(genSeed) } : {}),
        }),
      });
      if (r.ok) {
        await mutate(`/api/admin/tipsters?${params.toString()}`);
        setGenOpen(false);
      }
    } finally {
      setGenerating(false);
    }
  }

  async function postSampleTips() {
    setPosting(true);
    setPostResult(null);
    try {
      const r = await fetch('/api/cron/auto-tips?dry=1');
      const j = await r.json();
      setPostResult(`Plan ready: ${j.matchesEligible}/${j.matchesScanned} matches eligible. ${j.plan?.length || 0} plans generated. (Dry run — no tips posted yet.)`);
    } catch {
      setPostResult('Failed to dispatch.');
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-bold">Tipsters Management</h1>
          <p className="text-muted-foreground">Real users + seeded tipsters that power the public feed.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={postSampleTips} disabled={posting}>
            {posting ? <Spinner className="mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Plan auto-tips (dry)
          </Button>
          <Button size="sm" onClick={() => setGenOpen(true)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Generate fake tipsters
          </Button>
        </div>
      </div>

      {postResult && (
        <div className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs">{postResult}</div>
      )}

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard icon={Trophy} label="Total tipsters" value={counts.total} colour="amber" />
        <StatCard icon={Bot} label="Seeded (fake)" value={counts.fake} colour="purple" />
        <StatCard icon={CheckCircle2} label="Verified" value={stats.verified} colour="emerald" />
        <StatCard icon={Star} label="Total tips" value={stats.total.toLocaleString()} colour="primary" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search tipsters..." value={search}
                     onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2">
              {(['all', 'real', 'fake'] as const).map(opt => (
                <Button key={opt} size="sm"
                        variant={filter === opt ? 'default' : 'outline'}
                        onClick={() => setFilter(opt)}>
                  {opt === 'all' ? 'All' : opt === 'real' ? `Real (${counts.real})` : `Fake (${counts.fake})`}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><Spinner className="h-8 w-8" /></div>
      ) : tipsters.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No tipsters match those filters.
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                    <th className="p-3 font-medium">Tipster</th>
                    <th className="p-3 font-medium">Source</th>
                    <th className="p-3 font-medium text-right">Tips</th>
                    <th className="p-3 font-medium text-right">Win&nbsp;%</th>
                    <th className="p-3 font-medium text-right">ROI</th>
                    <th className="p-3 font-medium text-right">Followers</th>
                    <th className="p-3 font-medium text-right">Plan</th>
                    <th className="p-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {tipsters.map(t => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {t.avatar
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={t.avatar} alt="" className="h-9 w-9 rounded-full bg-muted" />
                              : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{t.displayName.charAt(0)}</div>}
                            {t.isVerified && (
                              <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500">
                                <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{t.displayName}</p>
                            <p className="truncate text-xs text-muted-foreground">@{t.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={cn(
                          'text-[10px]',
                          t.isFake ? 'border-purple-500/30 text-purple-500' : 'border-emerald-500/30 text-emerald-500',
                        )}>
                          {t.isFake ? <><Bot className="mr-1 h-2.5 w-2.5" />Seeded</> : 'Real'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right text-sm">{t.totalTips}</td>
                      <td className="p-3 text-right text-sm">
                        <span className={t.winRate >= 60 ? 'font-semibold text-emerald-500' : ''}>{t.winRate}%</span>
                      </td>
                      <td className="p-3 text-right text-sm">
                        <span className={t.roi > 0 ? 'text-emerald-500' : 'text-red-500'}>+{t.roi}%</span>
                      </td>
                      <td className="p-3 text-right text-sm">{t.followers.toLocaleString()}</td>
                      <td className="p-3 text-right">
                        {t.isPro
                          ? <Badge className="bg-primary text-[10px]"><Star className="mr-0.5 h-2.5 w-2.5" />PRO</Badge>
                          : <span className="text-xs text-muted-foreground">Free</span>}
                      </td>
                      <td className="p-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/tipsters/${t.id}`} target="_blank"><Eye className="mr-2 h-4 w-4" />View profile</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem><CheckCircle2 className="mr-2 h-4 w-4" />{t.isVerified ? 'Remove verification' : 'Verify'}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500"><XCircle className="mr-2 h-4 w-4" />Suspend</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate dialog */}
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Regenerate fake tipsters</DialogTitle>
            <DialogDescription>
              Replaces the current seeded catalogue. Real signups are unaffected.
              The seed lets you reproduce the exact same names — leave empty for random.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Count</label>
              <Input type="number" min={10} max={500} value={genCount}
                     onChange={(e) => setGenCount(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Seed (optional)</label>
              <Input placeholder="e.g. 42" value={genSeed} onChange={(e) => setGenSeed(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenOpen(false)}>Cancel</Button>
            <Button onClick={regenerate} disabled={generating}>
              {generating ? <Spinner className="mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, colour }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string | number;
  colour: 'amber' | 'emerald' | 'purple' | 'primary';
}) {
  const tone: Record<string, string> = {
    amber: 'bg-amber-500/10 text-amber-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    purple: 'bg-purple-500/10 text-purple-500',
    primary: 'bg-primary/10 text-primary',
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', tone[colour])}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-lg font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
