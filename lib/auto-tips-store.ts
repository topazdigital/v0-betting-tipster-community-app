// Auto-generated fake-tipster tips on REAL matches.
// Persists to .local/state/auto-tips.json so picks survive restarts and
// remain consistent between the match Tips tab and tipster profile pages.

import fs from 'fs';
import path from 'path';
import { getFakeTipsterById, getFakeTipsters, pickTipstersForMatch, type FakeTipster } from './fake-tipsters';
import { seedTipEngagement } from './tip-engagement-store';

export interface GeneratedTip {
  id: string;
  matchId: string;
  matchSlug?: string;
  homeTeam: string;
  awayTeam: string;
  league?: string;
  sport?: string;
  kickoff?: string;
  tipsterId: number;
  prediction: string;
  market: string;
  marketKey?: string;
  odds: number;
  stake: number;
  confidence: number;
  analysis: string;
  isPremium: boolean;
  status: 'pending' | 'won' | 'lost' | 'void';
  likes: number;
  dislikes: number;
  comments: number;
  createdAt: string;
}

export interface MatchContext {
  matchId: string;
  matchSlug?: string;
  homeTeam: string;
  awayTeam: string;
  league?: string;
  sport?: string;
  kickoff?: string;
  leagueTier?: number; // 1 = top
  popularity?: number; // multiplier
  markets?: Array<{
    key?: string;
    name: string;
    selections: Array<{ label: string; odds: number }>;
  }>;
}

interface Stores {
  byMatch: Map<string, GeneratedTip[]>;
  byTipster: Map<number, GeneratedTip[]>;
  loaded: boolean;
}

const FILE = path.join(process.cwd(), '.local', 'state', 'auto-tips.json');

const g = globalThis as { __autoTipsStore?: Stores };
g.__autoTipsStore = g.__autoTipsStore || { byMatch: new Map(), byTipster: new Map(), loaded: false };
const stores = g.__autoTipsStore;

function ensureDir(p: string) {
  try { fs.mkdirSync(path.dirname(p), { recursive: true }); } catch {}
}

function persist() {
  try {
    ensureDir(FILE);
    const obj: Record<string, GeneratedTip[]> = {};
    for (const [k, v] of stores.byMatch) obj[k] = v;
    fs.writeFileSync(FILE, JSON.stringify(obj));
  } catch (e) {
    console.warn('[auto-tips] persist failed', e);
  }
}

function load() {
  if (stores.loaded) return;
  stores.loaded = true;
  try {
    if (!fs.existsSync(FILE)) return;
    const raw = JSON.parse(fs.readFileSync(FILE, 'utf8')) as Record<string, GeneratedTip[]>;
    const allTipsters = getFakeTipsters();
    for (const [k, v] of Object.entries(raw)) {
      stores.byMatch.set(k, v);
      for (const tip of v) {
        const list = stores.byTipster.get(tip.tipsterId) || [];
        list.push(tip);
        stores.byTipster.set(tip.tipsterId, list);
        // Re-seed engagement on cold start so counts/comments survive a restart.
        const others = allTipsters
          .filter(x => x.id !== tip.tipsterId)
          .map(x => ({ id: x.id, username: x.username, displayName: x.displayName, avatar: x.avatar }));
        seedTipEngagement(tip.id, {
          likes: tip.likes,
          comments: tip.comments,
          tipsters: others,
          homeTeam: tip.homeTeam,
          awayTeam: tip.awayTeam,
          venue: 'home',
          confidence: tip.confidence,
          createdAt: tip.createdAt,
        });
      }
    }
  } catch (e) {
    console.warn('[auto-tips] load failed', e);
  }
}
load();

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

const FALLBACK_PREDICTIONS = [
  { prediction: 'Home Win', market: 'Match Result (1X2)', marketKey: 'h2h' },
  { prediction: 'Away Win', market: 'Match Result (1X2)', marketKey: 'h2h' },
  { prediction: 'Draw', market: 'Match Result (1X2)', marketKey: 'h2h' },
  { prediction: 'Both Teams to Score - Yes', market: 'BTTS', marketKey: 'btts' },
  { prediction: 'Both Teams to Score - No', market: 'BTTS', marketKey: 'btts' },
  { prediction: 'Over 2.5 Goals', market: 'Over/Under 2.5', marketKey: 'totals' },
  { prediction: 'Under 2.5 Goals', market: 'Over/Under 2.5', marketKey: 'totals' },
  { prediction: 'Home or Draw (1X)', market: 'Double Chance', marketKey: 'dc' },
  { prediction: 'Away or Draw (X2)', market: 'Double Chance', marketKey: 'dc' },
];

function buildAnalysis(rand: () => number, t: FakeTipster, ctx: MatchContext, sel: string): string {
  const home = ctx.homeTeam;
  const away = ctx.awayTeam;
  const lines = [
    `${t.displayName} reads this one as ${sel}. ${home}'s recent form against organised mid-blocks favours value here.`,
    `xG model lean: ${sel}. ${away}'s away xGA is trending up — fade is alive and within ${t.specialties[0] || 'football'} comfort zone.`,
    `${home} have leaked goals in 4 of last 5 — ${sel} keeps us on the right side of the line. 1.5% bankroll only.`,
    `Sharp move overnight on ${sel}; consensus closing line value supports the pick. ${t.specialties.join(' / ')}.`,
    `H2H pattern + tempo data point to ${sel}. ${away}'s key creator is doubtful — adjust your stake accordingly.`,
    `Public is heavy on the other side of ${sel}; price reflects fade opportunity in ${ctx.league || 'this fixture'}.`,
  ];
  return lines[Math.floor(rand() * lines.length)];
}

export function seedTipsForMatch(ctx: MatchContext): GeneratedTip[] {
  const existing = stores.byMatch.get(ctx.matchId);
  if (existing && existing.length > 0) return existing;

  const tier = ctx.leagueTier ?? 3;
  const pickers = pickTipstersForMatch(ctx.matchId, tier, ctx.popularity ?? 1);
  if (pickers.length === 0) return [];

  const tips: GeneratedTip[] = [];
  for (let i = 0; i < pickers.length; i++) {
    const t = pickers[i];
    const r = rng(hashStr(`${ctx.matchId}:${t.id}`));

    let prediction: string;
    let market: string;
    let marketKey: string | undefined;
    let odds: number;

    if (ctx.markets && ctx.markets.length > 0) {
      const m = ctx.markets[Math.floor(r() * ctx.markets.length)];
      const sel = m.selections[Math.floor(r() * m.selections.length)];
      prediction = sel.label;
      market = m.name;
      marketKey = m.key;
      odds = sel.odds;
    } else {
      const fp = FALLBACK_PREDICTIONS[Math.floor(r() * FALLBACK_PREDICTIONS.length)];
      prediction = fp.prediction;
      market = fp.market;
      marketKey = fp.marketKey;
      odds = Math.round((1.5 + r() * 2.6) * 100) / 100;
    }

    const confidence = Math.max(50, Math.min(95, Math.round(60 + (t.winRate - 50) + r() * 20)));
    const stake = 1 + Math.floor(r() * 4);
    const isPremium = t.isPro && r() > 0.5;
    const hoursAgo = Math.floor(r() * 36);
    const createdAt = new Date(Date.now() - hoursAgo * 3600_000).toISOString();
    const likes = Math.floor(r() * 80) + 5;
    const dislikes = Math.floor(r() * 12);
    const comments = Math.floor(r() * 18);

    tips.push({
      id: `auto-${ctx.matchId}-${t.id}`,
      matchId: ctx.matchId,
      matchSlug: ctx.matchSlug,
      homeTeam: ctx.homeTeam,
      awayTeam: ctx.awayTeam,
      league: ctx.league,
      sport: ctx.sport,
      kickoff: ctx.kickoff,
      tipsterId: t.id,
      prediction,
      market,
      marketKey,
      odds,
      stake,
      confidence,
      analysis: buildAnalysis(r, t, ctx, prediction),
      isPremium,
      status: 'pending',
      likes,
      dislikes,
      comments,
      createdAt,
    });
  }

  stores.byMatch.set(ctx.matchId, tips);
  // Seed deterministic likes baseline + cross-engagement comments by
  // OTHER fake tipsters (everybody except the tip's author).
  const allTipsters = getFakeTipsters();
  for (const tip of tips) {
    const list = stores.byTipster.get(tip.tipsterId) || [];
    list.push(tip);
    stores.byTipster.set(tip.tipsterId, list);

    const otherTipsters = allTipsters
      .filter(x => x.id !== tip.tipsterId)
      .map(x => ({ id: x.id, username: x.username, displayName: x.displayName, avatar: x.avatar }));
    seedTipEngagement(tip.id, {
      likes: tip.likes,
      comments: tip.comments,
      tipsters: otherTipsters,
      homeTeam: tip.homeTeam,
      awayTeam: tip.awayTeam,
      venue: 'home',
      confidence: tip.confidence,
      createdAt: tip.createdAt,
    });
  }
  persist();
  return tips;
}

export function listTipsForMatch(matchId: string): GeneratedTip[] {
  return stores.byMatch.get(matchId) || [];
}

export function listTipsForTipster(tipsterId: number, limit = 25): GeneratedTip[] {
  const list = stores.byTipster.get(tipsterId) || [];
  return list
    .slice()
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
    .slice(0, limit);
}

export function listAllAutoTips(limit = 50): GeneratedTip[] {
  const all: GeneratedTip[] = [];
  for (const v of stores.byMatch.values()) all.push(...v);
  return all
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
    .slice(0, limit);
}

export function getAutoTipsStats() {
  let total = 0;
  let won = 0;
  let lost = 0;
  let pending = 0;
  for (const v of stores.byMatch.values()) {
    for (const t of v) {
      total++;
      if (t.status === 'won') won++;
      else if (t.status === 'lost') lost++;
      else pending++;
    }
  }
  return { total, won, lost, pending, matches: stores.byMatch.size, tipsters: stores.byTipster.size };
}

// For the admin dashboard: deterministically resolve win/loss for older auto
// tips (kickoff is in the past) so KPIs aren't 100% pending.
export function settleStaleAutoTips(now = Date.now()) {
  let changed = false;
  for (const list of stores.byMatch.values()) {
    for (const tip of list) {
      if (tip.status !== 'pending') continue;
      if (!tip.kickoff) continue;
      const t = new Date(tip.kickoff).getTime();
      if (!Number.isFinite(t)) continue;
      // Settle 2h after kickoff
      if (now - t < 2 * 3600_000) continue;
      const tipster = getFakeTipsterById(tip.tipsterId);
      const winChance = tipster ? tipster.winRate / 100 : 0.55;
      const r = rng(hashStr(tip.id))();
      tip.status = r < winChance ? 'won' : 'lost';
      changed = true;
    }
  }
  if (changed) persist();
}

export function getKnownFakeTipsters(): FakeTipster[] {
  return getFakeTipsters();
}
