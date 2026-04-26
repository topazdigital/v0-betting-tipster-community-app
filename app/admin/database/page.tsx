'use client';

import { useState, useEffect } from 'react';
import { Database, CheckCircle, XCircle, Loader2, ShieldAlert, Trash2, Save, TestTube } from 'lucide-react';

interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: boolean;
}

interface ApiState {
  source: 'env' | 'file' | 'none';
  hasEnvVar: boolean;
  config: DbConfig | null;
}

const EMPTY: DbConfig = { host: '', port: 3306, user: '', password: '', database: '', ssl: false };

export default function DatabaseSettingsPage() {
  const [apiState, setApiState] = useState<ApiState | null>(null);
  const [form, setForm] = useState<DbConfig>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveMsg, setSaveMsg] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const res = await fetch('/api/admin/db-config');
    if (res.ok) {
      const data: ApiState = await res.json();
      setApiState(data);
      if (data.config) {
        setForm(data.config);
      }
    }
  }

  useEffect(() => { load(); }, []);

  function field(key: keyof DbConfig, value: string | number | boolean) {
    setForm(f => ({ ...f, [key]: value }));
    setTestResult(null);
    setSaveMsg('');
  }

  async function save() {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/admin/db-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMsg('Configuration saved. Restart the server to apply.');
        await load();
      } else {
        setSaveMsg(data.error || 'Save failed.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function test() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/db-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),
      });
      const data = await res.json();
      setTestResult(data);
    } finally {
      setTesting(false);
    }
  }

  async function clear() {
    if (!confirm('Remove the saved database configuration?')) return;
    setDeleting(true);
    await fetch('/api/admin/db-config', { method: 'DELETE' });
    setForm(EMPTY);
    setTestResult(null);
    setSaveMsg('');
    await load();
    setDeleting(false);
  }

  const source = apiState?.source ?? 'none';
  const hasEnvVar = apiState?.hasEnvVar ?? false;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" /> Database Connection
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure your MySQL database. Settings are stored locally and applied on the next server restart.
          </p>
        </div>

        {/* Status banner */}
        <div className={`rounded-xl border p-4 flex items-start gap-3 ${
          source === 'none'
            ? 'border-amber-500/40 bg-amber-50 dark:bg-amber-950/30'
            : source === 'env'
            ? 'border-blue-500/40 bg-blue-50 dark:bg-blue-950/30'
            : 'border-green-500/40 bg-green-50 dark:bg-green-950/30'
        }`}>
          {source === 'none' ? (
            <XCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          ) : source === 'env' ? (
            <ShieldAlert className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
          )}
          <div>
            {source === 'none' && (
              <>
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">No database configured</p>
                <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-0.5">
                  The app is running on mock / in-memory data. Fill in the form below to connect your MySQL database.
                </p>
              </>
            )}
            {source === 'env' && (
              <>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Using DATABASE_URL environment variable</p>
                <p className="text-xs text-blue-600/80 dark:text-blue-300/70 mt-0.5">
                  A <code className="font-mono">DATABASE_URL</code> env var is set and takes priority over any form settings below.
                  To override it, update the environment variable directly.
                </p>
              </>
            )}
            {source === 'file' && (
              <>
                <p className="text-sm font-semibold text-green-700 dark:text-green-300">Configuration saved</p>
                <p className="text-xs text-green-600/80 dark:text-green-300/70 mt-0.5">
                  Using settings from the admin panel. Click "Test Connection" to verify the credentials are working.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="rounded-xl border bg-card p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Connection Details</h2>

          {hasEnvVar && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 text-xs text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> A <code className="font-mono">DATABASE_URL</code> environment variable is already set and will be used at runtime.
              The form below lets you store a backup/fallback configuration for when that variable is absent.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Host</label>
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="db.example.com or 192.168.1.1"
                value={form.host}
                onChange={e => field('host', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Port</label>
              <input
                type="number"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="3306"
                value={form.port}
                onChange={e => field('port', parseInt(e.target.value) || 3306)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Username</label>
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="betcheza_user"
                autoComplete="off"
                value={form.user}
                onChange={e => field('user', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <input
                type="password"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="••••••••••••"
                autoComplete="new-password"
                value={form.password}
                onChange={e => field('password', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Database Name</label>
            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="betcheza_db"
              value={form.database}
              onChange={e => field('database', e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="rounded"
              checked={form.ssl}
              onChange={e => field('ssl', e.target.checked)}
            />
            <span className="text-sm">Require SSL / TLS</span>
          </label>

          {/* Save message */}
          {saveMsg && (
            <p className={`text-sm rounded-md px-3 py-2 ${
              saveMsg.includes('saved')
                ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}>
              {saveMsg}
            </p>
          )}

          {/* Test result */}
          {testResult && (
            <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
              testResult.success
                ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300'
                : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300'
            }`}>
              {testResult.success
                ? <CheckCircle className="h-4 w-4 shrink-0" />
                : <XCircle className="h-4 w-4 shrink-0" />}
              {testResult.message}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              onClick={save}
              disabled={saving || !form.host || !form.user || !form.database}
              className="flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Configuration
            </button>

            <button
              onClick={test}
              disabled={testing}
              className="flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
              Test Connection
            </button>

            {source === 'file' && (
              <button
                onClick={clear}
                disabled={deleting}
                className="flex items-center gap-2 rounded-md border border-destructive/40 text-destructive px-4 py-2 text-sm font-semibold hover:bg-destructive/5 disabled:opacity-50 ml-auto"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Clear
              </button>
            )}
          </div>
        </div>

        {/* How it works */}
        <div className="rounded-xl border bg-muted/40 p-5 space-y-2">
          <h3 className="text-sm font-semibold">How this works</h3>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Fill in your VPS MySQL host, port, username, password and database name above.</li>
            <li>Click <strong>Save Configuration</strong> — credentials are stored securely on this server only.</li>
            <li>Click <strong>Test Connection</strong> to verify the server can reach your database.</li>
            <li>Restart the server (or redeploy) for the connection to take full effect across all routes.</li>
            <li>If a <code className="font-mono">DATABASE_URL</code> environment variable is also set, it takes priority.</li>
          </ol>
        </div>

    </div>
  );
}
