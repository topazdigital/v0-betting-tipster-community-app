// ─────────────────────────────────────────────────────────────────────
// Tipster competitions store.
//
// Competitions are seeded deterministically from the fake-tipster
// catalogue so leaderboards always have content. They persist in
// memory for the life of the process, with hooks for future MySQL
// persistence (table is created lazily if DATABASE_URL exists).
// ─────────────────────────────────────────────────────────────────────

import { getFakeTipsters, type FakeTipster } from './fake-tipsters';

export interface CompetitionParticipant {
  rank: number;
  tipsterId: number;
  username: string;
  displayName: string;
  avatar: string | null;
  countryCode: string | null;
  winRate: number;
  roi: number;
  tips: number;
  won: number;
  points: number;
  streak: number;
  isVerified: boolean;
}

export interface Competition {
  id: number;
  slug: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  status: 'upcoming' | 'active' | 'completed';
  startDate: string;
  endDate: string;
  prizePool: number;
  currency: string;
  entryFee: number;
  maxParticipants: number;
  prizes: Array<{ place: string; amount: number }>;
  participants: CompetitionParticipant[];
  rules: string[];
  sportFocus: string;
}

const NOW = () => Date.now();
const DAY = 24 * 60 * 60 * 1000;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function pickN<T>(arr: T[], n: number, seed: number): T[] {
  // Deterministic pick using simple LCG
  const out: T[] = [];
  const used = new Set<number>();
  let s = seed >>> 0;
  while (out.length < n && used.size < arr.length) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const idx = s % arr.length;
    if (!used.has(idx)) {
      used.add(idx);
      out.push(arr[idx]);
    }
  }
  return out;
}

function buildParticipants(seed: number, count: number, multiplier: number): CompetitionParticipant[] {
  const all = getFakeTipsters();
  const picked = pickN(all, Math.min(count, all.length), seed);
  // Sort by composite score (winRate + roi) for deterministic ranking.
  const ranked = picked
    .map(t => ({
      t,
      score: t.winRate * 1.2 + t.roi * 2 + t.streak * 0.5,
    }))
    .sort((a, b) => b.score - a.score);
  return ranked.map(({ t }, i) => {
    const tips = Math.max(3, Math.round(t.totalTips * multiplier));
    const won = Math.round(tips * (t.winRate / 100));
    const points = Math.round(won * 12 + (tips - won) * -3 + t.streak * 5);
    return {
      rank: i + 1,
      tipsterId: t.id,
      username: t.username,
      displayName: t.displayName,
      avatar: t.avatar,
      countryCode: t.countryCode,
      winRate: t.winRate,
      roi: t.roi,
      tips,
      won,
      points,
      streak: t.streak,
      isVerified: t.isVerified,
    };
  });
}

let _seeded: Competition[] | null = null;

function seedCompetitions(): Competition[] {
  const t0 = NOW();
  const defs: Array<Omit<Competition, 'participants' | 'slug'> & { _seed: number; _mult: number }> = [
    {
      id: 1,
      name: 'Weekly Tipster Challenge',
      description: 'Open competition for all football tipsters. Top performers by ROI win the pot.',
      type: 'weekly',
      status: 'active',
      startDate: new Date(t0 - 2 * DAY).toISOString(),
      endDate: new Date(t0 + 5 * DAY).toISOString(),
      prizePool: 50000,
      currency: 'KES',
      entryFee: 100,
      maxParticipants: 500,
      prizes: [
        { place: '1st', amount: 20000 },
        { place: '2nd', amount: 12000 },
        { place: '3rd', amount: 8000 },
        { place: '4-10th', amount: 1428 },
      ],
      rules: [
        'Minimum 5 tips during the contest window.',
        'Tips must be placed at least 30 minutes before kickoff.',
        'Average odds must be ≥ 1.50.',
      ],
      sportFocus: 'football',
      _seed: 17,
      _mult: 0.18,
    },
    {
      id: 2,
      name: 'Monthly Masters League',
      description: 'The ultimate monthly competition for serious tipsters across all sports.',
      type: 'monthly',
      status: 'active',
      startDate: new Date(t0 - 5 * DAY).toISOString(),
      endDate: new Date(t0 + 25 * DAY).toISOString(),
      prizePool: 200000,
      currency: 'KES',
      entryFee: 500,
      maxParticipants: 200,
      prizes: [
        { place: '1st', amount: 80000 },
        { place: '2nd', amount: 50000 },
        { place: '3rd', amount: 30000 },
        { place: '4-10th', amount: 5714 },
      ],
      rules: [
        'Minimum 25 tips across the month.',
        'Tracked across football, basketball, tennis, and esports.',
        'Verified tipsters earn a 10% point bonus.',
      ],
      sportFocus: 'multi-sport',
      _seed: 91,
      _mult: 0.55,
    },
    {
      id: 3,
      name: 'Daily Football Showdown',
      description: 'Fast-paced 24-hour contest for football tippers. Highest win-rate takes the day.',
      type: 'daily',
      status: 'active',
      startDate: new Date(t0 - 4 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(t0 + 20 * 60 * 60 * 1000).toISOString(),
      prizePool: 10000,
      currency: 'KES',
      entryFee: 50,
      maxParticipants: 250,
      prizes: [
        { place: '1st', amount: 5000 },
        { place: '2nd', amount: 3000 },
        { place: '3rd', amount: 2000 },
        { place: '4-10th', amount: 0 },
      ],
      rules: [
        'Minimum 3 tips during the 24-hour window.',
        'No void/postponed bets count.',
        'Tie-breaker is total ROI.',
      ],
      sportFocus: 'football',
      _seed: 251,
      _mult: 0.05,
    },
    {
      id: 4,
      name: 'Premier League Weekly',
      description: 'EPL-only weekly competition: who can call the Big-6 fixtures best?',
      type: 'weekly',
      status: 'active',
      startDate: new Date(t0 - 1 * DAY).toISOString(),
      endDate: new Date(t0 + 6 * DAY).toISOString(),
      prizePool: 25000,
      currency: 'KES',
      entryFee: 0,
      maxParticipants: 1000,
      prizes: [
        { place: '1st', amount: 12000 },
        { place: '2nd', amount: 7000 },
        { place: '3rd', amount: 4000 },
        { place: '4-10th', amount: 285 },
      ],
      rules: [
        'Free to enter.',
        'Only Premier League fixtures count.',
        'Maximum 10 tips per gameweek.',
      ],
      sportFocus: 'football',
      _seed: 401,
      _mult: 0.12,
    },
    {
      id: 5,
      name: 'Champions League Outright Special',
      description: 'Long-form contest tracking accuracy across the entire Champions League knockout phase.',
      type: 'special',
      status: 'upcoming',
      startDate: new Date(t0 + 7 * DAY).toISOString(),
      endDate: new Date(t0 + 60 * DAY).toISOString(),
      prizePool: 150000,
      currency: 'KES',
      entryFee: 250,
      maxParticipants: 500,
      prizes: [
        { place: '1st', amount: 75000 },
        { place: '2nd', amount: 40000 },
        { place: '3rd', amount: 20000 },
        { place: '4-10th', amount: 2142 },
      ],
      rules: [
        'Tips on UEFA Champions League knockout matches only.',
        'Both team-to-win and over/under markets accepted.',
        'Bonus 50 points for correctly calling the eventual finalists.',
      ],
      sportFocus: 'football',
      _seed: 511,
      _mult: 0.32,
    },
  ];

  return defs.map(d => {
    const { _seed, _mult, ...rest } = d;
    const slug = slugify(d.name);
    const targetParticipants = Math.min(d.maxParticipants, 75);
    return {
      ...rest,
      slug,
      participants: buildParticipants(_seed, targetParticipants, _mult),
    } satisfies Competition;
  });
}

export function getCompetitions(): Competition[] {
  if (!_seeded) _seeded = seedCompetitions();
  return _seeded;
}

export function getCompetitionBySlug(slug: string): Competition | undefined {
  return getCompetitions().find(c => c.slug === slug);
}

export function getCompetitionById(id: number): Competition | undefined {
  return getCompetitions().find(c => c.id === id);
}

export function publicCompetitionSummary(c: Competition) {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    type: c.type,
    status: c.status,
    startDate: c.startDate,
    endDate: c.endDate,
    prizePool: c.prizePool,
    currency: c.currency,
    entryFee: c.entryFee,
    maxParticipants: c.maxParticipants,
    currentParticipants: c.participants.length,
    prizes: c.prizes,
    sportFocus: c.sportFocus,
    topThree: c.participants.slice(0, 3).map(p => ({
      rank: p.rank,
      username: p.username,
      displayName: p.displayName,
      avatar: p.avatar,
    })),
  };
}
