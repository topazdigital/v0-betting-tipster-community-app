'use client';

import useSWR from 'swr';
import { Mail, Download, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Subscriber {
  id: number | string;
  email: string;
  userId?: number | null;
  source?: string;
  topics?: string[];
  isVerified?: boolean;
  unsubscribedAt?: string | null;
  createdAt?: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminSubscribersPage() {
  const { data, isLoading, mutate } = useSWR<{ subscribers: Subscriber[] }>(
    '/api/admin/subscribers',
    fetcher,
    { refreshInterval: 60000 }
  );

  const subscribers = data?.subscribers ?? [];
  const active = subscribers.filter((s) => !s.unsubscribedAt);
  const unsubscribed = subscribers.filter((s) => s.unsubscribedAt);

  function exportCsv() {
    const rows = [
      ['email', 'source', 'verified', 'topics', 'created_at', 'unsubscribed_at'],
      ...subscribers.map((s) => [
        s.email,
        s.source ?? '',
        s.isVerified ? 'yes' : 'no',
        (s.topics ?? []).join('|'),
        s.createdAt ?? '',
        s.unsubscribedAt ?? '',
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email Subscribers</h1>
          <p className="text-sm text-muted-foreground">
            Newsletter signups and event notification opt-ins.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button size="sm" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{subscribers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">{active.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Unsubscribed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground">{unsubscribed.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" /> Subscribers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : subscribers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subscribers yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2">Topics</th>
                    <th className="px-3 py-2">Verified</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {subscribers.map((s) => (
                    <tr key={String(s.id) + s.email}>
                      <td className="px-3 py-2 font-medium">{s.email}</td>
                      <td className="px-3 py-2 text-muted-foreground">{s.source ?? '—'}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {(s.topics ?? []).map((t) => (
                            <Badge key={t} variant="secondary" className="text-[10px]">
                              {t}
                            </Badge>
                          ))}
                          {(s.topics ?? []).length === 0 && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {s.isVerified ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {s.unsubscribedAt ? (
                          <Badge variant="destructive">Unsubscribed</Badge>
                        ) : (
                          <Badge variant="default">Active</Badge>
                        )}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
