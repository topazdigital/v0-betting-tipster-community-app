'use client';

import { useState } from 'react';
import { Bell, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [audience, setAudience] = useState<'all' | 'push' | 'email'>('all');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function broadcast() {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, link, audience }),
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(`Sent to ${data.count ?? 0} recipients`);
        setTitle('');
        setBody('');
        setLink('');
      } else {
        setStatus('Failed to send notification');
      }
    } catch {
      setStatus('Failed to send notification');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Broadcast Notifications</h1>
        <p className="text-sm text-muted-foreground">
          Send a push or email notification to your audience.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> New Broadcast
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Match starting in 30 minutes" />
          </div>
          <div>
            <label className="text-sm font-medium">Message</label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Don't miss out on tonight's top picks…" />
          </div>
          <div>
            <label className="text-sm font-medium">Link (optional)</label>
            <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/matches/123" />
          </div>
          <div>
            <label className="text-sm font-medium">Audience</label>
            <div className="mt-1 flex gap-2">
              {(['all', 'push', 'email'] as const).map((a) => (
                <Button
                  key={a}
                  variant={audience === a ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAudience(a)}
                >
                  {a === 'all' ? 'All channels' : a === 'push' ? 'Push only' : 'Email only'}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            {status && <p className="text-sm text-muted-foreground">{status}</p>}
            <Button onClick={broadcast} disabled={sending || !title.trim() || !body.trim()}>
              <Send className="mr-2 h-4 w-4" />
              {sending ? 'Sending…' : 'Send broadcast'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
