'use client';

import { useEffect, useState } from 'react';
import { Mail, Save, CheckCircle2, AlertTriangle, Send, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

interface Cfg {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  passwordSet?: boolean;
}

const DEFAULT: Cfg = {
  enabled: false,
  host: '',
  port: 587,
  secure: false,
  username: '',
  password: '',
  fromEmail: '',
  fromName: 'Betcheza',
  replyTo: '',
};

const PRESETS: Record<string, Partial<Cfg>> = {
  Gmail: { host: 'smtp.gmail.com', port: 587, secure: false },
  'SendGrid': { host: 'smtp.sendgrid.net', port: 587, secure: false, username: 'apikey' },
  Mailgun: { host: 'smtp.mailgun.org', port: 587, secure: false },
  'Amazon SES': { host: 'email-smtp.us-east-1.amazonaws.com', port: 587, secure: false },
  'Zoho': { host: 'smtp.zoho.com', port: 465, secure: true },
  'Outlook 365': { host: 'smtp.office365.com', port: 587, secure: false },
};

export default function AdminEmailConfigPage() {
  const [cfg, setCfg] = useState<Cfg>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);
  const [passwordChanged, setPasswordChanged] = useState(false);

  useEffect(() => {
    fetch('/api/admin/email-config')
      .then((r) => r.json())
      .then((d) => {
        if (d.config) setCfg({ ...DEFAULT, ...d.config, password: '' });
      })
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof Cfg>(k: K, v: Cfg[K]) {
    setCfg((c) => ({ ...c, [k]: v }));
  }

  function applyPreset(name: string) {
    const p = PRESETS[name];
    if (!p) return;
    setCfg((c) => ({ ...c, ...p }));
  }

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      const body: Partial<Cfg> & { keepPassword?: boolean } = { ...cfg };
      if (!passwordChanged && cfg.passwordSet) {
        body.keepPassword = true;
        delete body.password;
      }
      const res = await fetch('/api/admin/email-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (res.ok) {
        setCfg({ ...DEFAULT, ...d.config, password: '' });
        setPasswordChanged(false);
        setStatus({ kind: 'ok', msg: 'Settings saved.' });
      } else {
        setStatus({ kind: 'err', msg: d.error || 'Save failed' });
      }
    } catch {
      setStatus({ kind: 'err', msg: 'Save failed' });
    } finally {
      setSaving(false);
    }
  }

  async function verify() {
    setVerifying(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/email-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify' }),
      });
      const d = await res.json();
      setStatus(d.ok ? { kind: 'ok', msg: 'SMTP connection verified.' } : { kind: 'err', msg: d.error || 'Verification failed' });
    } finally {
      setVerifying(false);
    }
  }

  async function sendTest() {
    if (!testEmail) return;
    setTesting(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/email-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', to: testEmail }),
      });
      const d = await res.json();
      setStatus(d.ok ? { kind: 'ok', msg: `Test email sent to ${testEmail}` } : { kind: 'err', msg: d.error || 'Send failed' });
    } finally {
      setTesting(false);
    }
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Email Configuration</h1>
        <p className="text-sm text-muted-foreground">
          Configure the SMTP server used for transactional and broadcast emails.
        </p>
      </div>

      {status && (
        <div
          className={
            'flex items-center gap-2 rounded-lg border p-3 text-sm ' +
            (status.kind === 'ok'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400')
          }
        >
          {status.kind === 'ok' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {status.msg}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" /> SMTP Server
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground self-center">Quick presets:</span>
            {Object.keys(PRESETS).map((name) => (
              <Button key={name} variant="outline" size="sm" onClick={() => applyPreset(name)}>
                {name}
              </Button>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3">
            <div>
              <p className="text-sm font-medium">Enable email sending</p>
              <p className="text-xs text-muted-foreground">Off = nothing is sent (logs only).</p>
            </div>
            <Switch checked={cfg.enabled} onCheckedChange={(v) => update('enabled', v)} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">SMTP Host</label>
              <Input value={cfg.host} onChange={(e) => update('host', e.target.value)} placeholder="smtp.gmail.com" />
            </div>
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">Port</label>
              <Input
                type="number"
                value={cfg.port}
                onChange={(e) => update('port', parseInt(e.target.value, 10) || 587)}
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">Username</label>
              <Input value={cfg.username} onChange={(e) => update('username', e.target.value)} placeholder="user@example.com" />
            </div>
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">
                Password / App Key {cfg.passwordSet && !passwordChanged && <span className="ml-1 text-emerald-500">(saved)</span>}
              </label>
              <Input
                type="password"
                value={cfg.password}
                onChange={(e) => {
                  update('password', e.target.value);
                  setPasswordChanged(true);
                }}
                placeholder={cfg.passwordSet && !passwordChanged ? '••••••••' : 'app password'}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={cfg.secure} onCheckedChange={(v) => update('secure', v)} />
              <span className="text-sm">Use SSL/TLS (port 465)</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">From Name</label>
              <Input value={cfg.fromName} onChange={(e) => update('fromName', e.target.value)} placeholder="Betcheza" />
            </div>
            <div>
              <label className="text-xs font-medium uppercase text-muted-foreground">From Email</label>
              <Input value={cfg.fromEmail} onChange={(e) => update('fromEmail', e.target.value)} placeholder="noreply@betcheza.co.ke" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium uppercase text-muted-foreground">Reply-To (optional)</label>
              <Input value={cfg.replyTo || ''} onChange={(e) => update('replyTo', e.target.value)} placeholder="support@betcheza.co.ke" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button onClick={save} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving…' : 'Save settings'}
            </Button>
            <Button variant="outline" onClick={verify} disabled={verifying}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {verifying ? 'Verifying…' : 'Verify connection'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" /> Send a test email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Save your settings first, then send a quick test to confirm delivery.
          </p>
          <div className="flex gap-2">
            <Input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Button onClick={sendTest} disabled={testing || !testEmail}>
              {testing ? 'Sending…' : 'Send test'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
