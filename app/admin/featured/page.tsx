"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, Star, Trash2, Plus, CheckCircle2, AlertCircle, Eye } from "lucide-react"

interface FeaturedConfig {
  enabled: boolean
  minConfidence: number
  minOdds: number
  maxOdds: number
  topTipsterOnly: boolean
  sport: string
  pinnedMatchIds: string[]
  limit: number
  updatedAt: string
}

const DEFAULTS: FeaturedConfig = {
  enabled: true,
  minConfidence: 60,
  minOdds: 1.5,
  maxOdds: 4.0,
  topTipsterOnly: false,
  sport: "",
  pinnedMatchIds: [],
  limit: 6,
  updatedAt: "",
}

export default function AdminFeaturedPage() {
  const [config, setConfig] = useState<FeaturedConfig>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [pinnedInput, setPinnedInput] = useState("")
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    fetch("/api/admin/featured")
      .then(r => r.json())
      .then(data => {
        if (data?.config) setConfig({ ...DEFAULTS, ...data.config })
      })
      .catch(() => setMessage({ type: "error", text: "Failed to load configuration." }))
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch("/api/admin/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data?.error || "Save failed")
      setConfig({ ...DEFAULTS, ...data.config })
      setMessage({ type: "success", text: "Featured configuration saved." })
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed"
      setMessage({ type: "error", text: msg })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 4000)
    }
  }

  function addPin() {
    const id = pinnedInput.trim()
    if (!id) return
    if (config.pinnedMatchIds.includes(id)) {
      setMessage({ type: "error", text: "Match ID already pinned." })
      return
    }
    setConfig(c => ({ ...c, pinnedMatchIds: [...c.pinnedMatchIds, id] }))
    setPinnedInput("")
  }

  function removePin(id: string) {
    setConfig(c => ({ ...c, pinnedMatchIds: c.pinnedMatchIds.filter(x => x !== id) }))
  }

  async function preview() {
    setPreviewLoading(true)
    try {
      const res = await fetch("/api/featured", { cache: "no-store" })
      const data = await res.json()
      setPreviewCount(Array.isArray(data?.items) ? data.items.length : 0)
    } catch {
      setPreviewCount(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Star className="h-7 w-7 text-amber-500" />
            Featured Tips
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Controls the &quot;Favorited Tips&quot; panel that appears on the homepage when there
            are 3 or fewer live games. Pin specific matches and tune the auto-fill criteria.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={preview} disabled={previewLoading}>
            {previewLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Eye className="h-4 w-4 mr-1" />}
            Preview
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save
          </Button>
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
            message.type === "success"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}

      {previewCount !== null && (
        <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
          Live preview: <span className="font-bold">{previewCount}</span> tip{previewCount === 1 ? "" : "s"} would be shown right now.
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Panel Status</CardTitle>
              <CardDescription>Master switch for the Favorited Tips panel.</CardDescription>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={v => setConfig(c => ({ ...c, enabled: v }))}
            />
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Auto-fill Criteria</CardTitle>
          <CardDescription>
            When the panel needs more picks beyond pinned matches, it pulls from today&apos;s upcoming games using these rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minConfidence">Minimum confidence (%)</Label>
              <Input
                id="minConfidence"
                type="number"
                min={0}
                max={100}
                value={config.minConfidence}
                onChange={e => setConfig(c => ({ ...c, minConfidence: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="limit">Max tips shown</Label>
              <Input
                id="limit"
                type="number"
                min={1}
                max={24}
                value={config.limit}
                onChange={e => setConfig(c => ({ ...c, limit: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minOdds">Minimum odds</Label>
              <Input
                id="minOdds"
                type="number"
                step="0.01"
                min={1}
                value={config.minOdds}
                onChange={e => setConfig(c => ({ ...c, minOdds: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxOdds">Maximum odds</Label>
              <Input
                id="maxOdds"
                type="number"
                step="0.01"
                min={1}
                value={config.maxOdds}
                onChange={e => setConfig(c => ({ ...c, maxOdds: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="sport">Sport filter (slug)</Label>
              <Input
                id="sport"
                placeholder="e.g. football  (leave blank for all sports)"
                value={config.sport}
                onChange={e => setConfig(c => ({ ...c, sport: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-semibold">Top tipsters only</p>
              <p className="text-xs text-muted-foreground">
                Restrict auto-picks to leaderboard rank ≤ 5.
              </p>
            </div>
            <Switch
              checked={config.topTipsterOnly}
              onCheckedChange={v => setConfig(c => ({ ...c, topTipsterOnly: v }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manually Pinned Matches</CardTitle>
          <CardDescription>
            Pinned matches are always shown first (in this order). Use the match ID from the URL,
            e.g. <code className="bg-muted px-1 rounded">soccer-123456</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Enter match ID and press Add"
              value={pinnedInput}
              onChange={e => setPinnedInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addPin() } }}
            />
            <Button type="button" onClick={addPin} variant="outline">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          {config.pinnedMatchIds.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No matches pinned.</p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {config.pinnedMatchIds.map((id, i) => (
                <li key={id} className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className="shrink-0">#{i + 1}</Badge>
                    <code className="text-sm truncate">{id}</code>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removePin(id)}>
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Last updated: {config.updatedAt ? new Date(config.updatedAt).toLocaleString() : "never"}
      </p>
    </div>
  )
}
