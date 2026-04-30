"use client"

import useSWR from "swr"
import Link from "next/link"
import { Trophy, Users, Gift, Timer, ChevronRight, ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface AdminCompetition {
  id: number
  slug: string
  name: string
  type: string
  status: 'upcoming' | 'active' | 'completed'
  endDate: string
  prizePool: number
  currency: string
  entryFee: number
  maxParticipants: number
  currentParticipants: number
  sportFocus: string
}

interface CompResponse {
  competitions: AdminCompetition[]
  stats: { active: number; upcoming: number; totalParticipants: number; totalPrizePool: number }
}

function fmtTimeLeft(end: string): string {
  const diff = new Date(end).getTime() - Date.now()
  if (diff <= 0) return 'Ended'
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h`
  return '<1h'
}

export default function AdminCompetitionsPage() {
  const { data, isLoading } = useSWR<CompResponse>('/api/competitions', fetcher, { revalidateOnFocus: false })
  const comps = data?.competitions ?? []
  const stats = data?.stats

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-1.5 text-base font-bold">
            <Trophy className="h-4 w-4 text-warning" />
            Competitions
          </h1>
          <p className="text-[11px] text-muted-foreground">Prediction competitions and tipster tournaments</p>
        </div>
        <Button asChild variant="outline" size="sm" className="h-7 text-xs">
          <Link href="/competitions" target="_blank">
            View public<ExternalLink className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <StatCard label="Active" value={stats?.active ?? 0} icon={Trophy} tone="primary" />
        <StatCard label="Upcoming" value={stats?.upcoming ?? 0} icon={Timer} tone="info" />
        <StatCard label="Tipsters" value={stats?.totalParticipants ?? 0} icon={Users} tone="success" />
        <StatCard label={`Prizes (K ${(stats?.totalPrizePool ?? 0) >= 1000 ? 'KES' : ''})`} value={`${Math.round((stats?.totalPrizePool ?? 0) / 1000)}K`} icon={Gift} tone="warning" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : comps.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Trophy className="mx-auto h-8 w-8 text-amber-500/60" />
            <p className="mt-2 text-xs text-muted-foreground">No competitions yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted/30">
              <tr className="border-b border-border">
                <th className="px-2.5 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Name</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Type</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-2 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Sport</th>
                <th className="px-2 py-1.5 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Tipsters</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Prize</th>
                <th className="px-2 py-1.5 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Ends</th>
                <th className="px-2 py-1.5"></th>
              </tr>
            </thead>
            <tbody>
              {comps.map(c => (
                <tr key={c.id} className="border-b border-border hover:bg-muted/30">
                  <td className="px-2.5 py-1.5 font-medium truncate max-w-[200px]">{c.name}</td>
                  <td className="px-2 py-1.5 capitalize text-muted-foreground">{c.type}</td>
                  <td className="px-2 py-1.5">
                    <Badge variant="outline" className={cn(
                      'h-4 text-[9px] px-1.5 capitalize',
                      c.status === 'active' && 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10',
                      c.status === 'upcoming' && 'border-blue-500/30 text-blue-500 bg-blue-500/10',
                      c.status === 'completed' && 'border-muted-foreground/30 text-muted-foreground',
                    )}>{c.status}</Badge>
                  </td>
                  <td className="px-2 py-1.5 capitalize text-muted-foreground hidden md:table-cell">{c.sportFocus}</td>
                  <td className="px-2 py-1.5 text-center">{c.currentParticipants}/{c.maxParticipants}</td>
                  <td className="px-2 py-1.5 text-right font-semibold text-warning">{c.currency} {(c.prizePool / 1000).toFixed(0)}K</td>
                  <td className="px-2 py-1.5 text-right text-muted-foreground">{fmtTimeLeft(c.endDate)}</td>
                  <td className="px-2 py-1.5 text-right">
                    <Button asChild variant="ghost" size="icon" className="h-6 w-6">
                      <Link href={`/competitions/${c.slug}`} target="_blank">
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, tone }: {
  label: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  tone: 'primary' | 'info' | 'success' | 'warning'
}) {
  return (
    <div className={cn(
      'rounded-lg border p-2',
      tone === 'primary' && 'border-primary/30 bg-primary/5',
      tone === 'info' && 'border-blue-500/30 bg-blue-500/5',
      tone === 'success' && 'border-emerald-500/30 bg-emerald-500/5',
      tone === 'warning' && 'border-amber-500/30 bg-amber-500/5',
    )}>
      <div className="flex items-center justify-between">
        <Icon className={cn(
          'h-3.5 w-3.5',
          tone === 'primary' && 'text-primary',
          tone === 'info' && 'text-blue-500',
          tone === 'success' && 'text-emerald-500',
          tone === 'warning' && 'text-amber-500',
        )} />
        <span className="text-base font-bold leading-none">{value}</span>
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  )
}
