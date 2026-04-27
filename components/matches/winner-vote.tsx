"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Trophy, Users, CheckCircle2 } from "lucide-react";
import { TeamLogo } from "@/components/ui/team-logo";
import { cn } from "@/lib/utils";

type Pick = "home" | "draw" | "away";

interface Totals {
  home: number;
  draw: number;
  away: number;
  total: number;
}

interface VoteResponse {
  matchId: string;
  totals: Totals;
  myVote: Pick | null;
}

interface WinnerVoteProps {
  matchId: string;
  homeName: string;
  awayName: string;
  homeLogo?: string;
  awayLogo?: string;
  /** Hide the draw option for sports where ties don't apply (e.g. basketball, tennis). */
  allowDraw?: boolean;
}

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then((r) => r.json());

function pct(value: number, total: number): number {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export function WinnerVote({
  matchId,
  homeName,
  awayName,
  homeLogo,
  awayLogo,
  allowDraw = true,
}: WinnerVoteProps) {
  const url = `/api/matches/${encodeURIComponent(matchId)}/vote`;
  const { data, mutate, isLoading } = useSWR<VoteResponse>(url, fetcher, {
    revalidateOnFocus: false,
  });
  const [submitting, setSubmitting] = useState<Pick | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  // Local optimistic copy so the bars react immediately on click.
  const [optimistic, setOptimistic] = useState<VoteResponse | null>(null);
  useEffect(() => {
    if (data) setOptimistic(null);
  }, [data]);

  const view = optimistic ?? data;
  const totals = view?.totals ?? { home: 0, draw: 0, away: 0, total: 0 };
  const myVote = view?.myVote ?? null;
  const hasVoted = !!myVote;

  const homePct = pct(totals.home, totals.total);
  const drawPct = pct(totals.draw, totals.total);
  const awayPct = pct(totals.away, totals.total);

  async function cast(pick: Pick) {
    if (hasVoted || submitting) return;
    setSubmitting(pick);
    // Optimistic update
    const next: VoteResponse = {
      matchId,
      totals: {
        ...totals,
        [pick]: totals[pick] + 1,
        total: totals.total + 1,
      },
      myVote: pick,
    };
    setOptimistic(next);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pick }),
      });
      const json = (await res.json()) as VoteResponse & { ok?: boolean; reason?: string };
      if (!res.ok && json.reason === "already_voted") {
        setFlash("You've already voted on this match.");
      }
      // Replace optimistic with server truth.
      await mutate(json, { revalidate: false });
      setOptimistic(null);
    } catch {
      setFlash("Couldn't record your vote. Please try again.");
      setOptimistic(null);
      await mutate();
    } finally {
      setSubmitting(null);
      if (flash) setTimeout(() => setFlash(null), 2500);
    }
  }

  const buttons: Array<{ pick: Pick; label: string; logo?: string; pctVal: number; count: number }> = [
    { pick: "home", label: homeName, logo: homeLogo, pctVal: homePct, count: totals.home },
    ...(allowDraw
      ? [{ pick: "draw" as const, label: "Draw", logo: undefined, pctVal: drawPct, count: totals.draw }]
      : []),
    { pick: "away", label: awayName, logo: awayLogo, pctVal: awayPct, count: totals.away },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            Who will win?
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>
            {totals.total.toLocaleString()} {totals.total === 1 ? "vote" : "votes"}
          </span>
        </div>
      </div>

      <div className={cn("grid gap-2", allowDraw ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        {buttons.map(({ pick, label, logo, pctVal, count }) => {
          const isMine = myVote === pick;
          const disabled = hasVoted || submitting !== null;
          return (
            <button
              key={pick}
              type="button"
              onClick={() => cast(pick)}
              disabled={disabled}
              className={cn(
                "group relative overflow-hidden rounded-lg border p-3 text-left transition-all",
                "border-border bg-background",
                !disabled && "hover:border-primary hover:bg-primary/5",
                isMine && "border-primary bg-primary/10",
                disabled && !isMine && "opacity-80",
              )}
            >
              {/* Fill bar */}
              {hasVoted && (
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 -z-0",
                    isMine ? "bg-primary/20" : "bg-muted",
                  )}
                  style={{ width: `${pctVal}%` }}
                  aria-hidden
                />
              )}

              <div className="relative z-10 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  {pick === "draw" ? (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-bold text-muted-foreground">
                      X
                    </div>
                  ) : (
                    <TeamLogo teamName={label} logoUrl={logo} size="sm" />
                  )}
                  <span className="truncate text-sm font-medium text-foreground">{label}</span>
                  {isMine && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}
                </div>
                {hasVoted ? (
                  <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
                    {pctVal}%
                  </span>
                ) : (
                  <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Vote
                  </span>
                )}
              </div>
              {hasVoted && (
                <div className="relative z-10 mt-1 text-xs text-muted-foreground">
                  {count.toLocaleString()} {count === 1 ? "vote" : "votes"}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {isLoading
          ? "Loading votes…"
          : hasVoted
            ? "Thanks for voting! Results update live as more fans cast their pick."
            : "Cast your prediction — one vote per device, no login needed."}
      </p>
      {flash && (
        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{flash}</p>
      )}
    </div>
  );
}
