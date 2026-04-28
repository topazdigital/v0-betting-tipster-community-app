import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, MapPin, Calendar, Ruler, Weight, Star, GitCompareArrows } from 'lucide-react';
import { getSiteSettings } from '@/lib/site-settings';
import { extractNumericPlayerId } from '@/lib/utils/slug';

interface PlayerProfile {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  jersey?: string;
  team?: { id?: string; name?: string; logo?: string } | null;
  height?: string;
  weight?: string;
  age?: number;
  dateOfBirth?: string;
  birthPlace?: { city?: string; country?: string };
  nationality?: string;
  flag?: string;
  experienceYears?: number;
  status?: string;
  headshot?: string;
  sportPath?: string;
  stats?: unknown;
}

async function getPlayer(id: string): Promise<PlayerProfile | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  try {
    const r = await fetch(`${baseUrl}/api/players/${id}`, { next: { revalidate: 1800 } });
    if (!r.ok) return null;
    return (await r.json()) as PlayerProfile;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const [player, settings] = await Promise.all([getPlayer(id), getSiteSettings()]);
  if (!player) {
    return { title: `Player not found · ${settings.site_name}` };
  }
  const teamPart = player.team?.name ? ` — ${player.team.name}` : '';
  const positionPart = player.position ? ` (${player.position})` : '';
  const title = `${player.name}${positionPart}${teamPart} · ${settings.site_name}`;
  const description = `${player.name}${teamPart}${player.nationality ? ` — ${player.nationality}` : ''}. Stats, profile and recent matches.`;
  return {
    title,
    description,
    openGraph: { title, description, images: player.headshot ? [{ url: player.headshot }] : undefined },
  };
}

interface StatRow {
  name?: string;
  displayName?: string;
  displayValue?: string;
  value?: number;
}
interface StatCategory {
  name?: string;
  displayName?: string;
  stats?: StatRow[];
}
interface AthleteStats {
  splits?: { categories?: StatCategory[] };
  categories?: StatCategory[];
}

function extractStatCategories(stats: unknown): StatCategory[] {
  if (!stats || typeof stats !== 'object') return [];
  const s = stats as AthleteStats;
  return s.splits?.categories || s.categories || [];
}

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const player = await getPlayer(id);
  if (!player) notFound();

  const categories = extractStatCategories(player.stats).slice(0, 4);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href="/matches"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to matches
        </Link>
        <Link
          href={`/players/compare?a=${encodeURIComponent(extractNumericPlayerId(String(player.id)) || player.id)}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
        >
          <GitCompareArrows className="h-3.5 w-3.5" />
          Compare with another player
        </Link>
      </div>

      {/* Header card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start">
          {player.headshot ? (
            <div className="relative shrink-0">
              <Image
                src={player.headshot}
                alt={player.name}
                width={140}
                height={140}
                className="h-32 w-32 rounded-2xl border border-border bg-muted object-cover sm:h-36 sm:w-36"
                unoptimized
              />
              {player.jersey && (
                <span className="absolute -bottom-2 -right-2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow">
                  #{player.jersey}
                </span>
              )}
            </div>
          ) : (
            <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-4xl font-bold text-primary sm:h-36 sm:w-36">
              {player.name.charAt(0)}
            </div>
          )}

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {player.position && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {player.position}
                </span>
              )}
              {player.status && (
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  {player.status}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {player.name}
            </h1>
            {player.team?.name && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {player.team.logo && (
                  <Image
                    src={player.team.logo}
                    alt={player.team.name}
                    width={20}
                    height={20}
                    className="h-5 w-5 object-contain"
                    unoptimized
                  />
                )}
                <span>{player.team.name}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 pt-3 text-xs sm:grid-cols-4">
              {player.age && (
                <div className="rounded-lg border border-border bg-card p-2.5">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" /> Age
                  </div>
                  <div className="mt-0.5 font-semibold text-foreground">{player.age}</div>
                </div>
              )}
              {player.height && (
                <div className="rounded-lg border border-border bg-card p-2.5">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Ruler className="h-3 w-3" /> Height
                  </div>
                  <div className="mt-0.5 font-semibold text-foreground">{player.height}</div>
                </div>
              )}
              {player.weight && (
                <div className="rounded-lg border border-border bg-card p-2.5">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Weight className="h-3 w-3" /> Weight
                  </div>
                  <div className="mt-0.5 font-semibold text-foreground">{player.weight}</div>
                </div>
              )}
              {player.nationality && (
                <div className="rounded-lg border border-border bg-card p-2.5">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3" /> Nationality
                  </div>
                  <div className="mt-0.5 font-semibold text-foreground">{player.nationality}</div>
                </div>
              )}
              {player.experienceYears !== undefined && (
                <div className="rounded-lg border border-border bg-card p-2.5">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Star className="h-3 w-3" /> Experience
                  </div>
                  <div className="mt-0.5 font-semibold text-foreground">{player.experienceYears} yr</div>
                </div>
              )}
            </div>
            {(player.birthPlace?.city || player.birthPlace?.country) && (
              <p className="pt-2 text-xs text-muted-foreground">
                Born in {[player.birthPlace.city, player.birthPlace.country].filter(Boolean).join(', ')}
                {player.dateOfBirth ? ` on ${new Date(player.dateOfBirth).toLocaleDateString()}` : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      {categories.length > 0 && (
        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {categories.map((cat, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                {cat.displayName || cat.name || 'Stats'}
              </h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {(cat.stats || []).slice(0, 10).map((s, j) => (
                  <div key={j} className="flex justify-between gap-2 border-b border-border/50 pb-1">
                    <dt className="truncate text-muted-foreground">{s.displayName || s.name}</dt>
                    <dd className="font-semibold text-foreground">{s.displayValue ?? s.value ?? '—'}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </section>
      )}

      {categories.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Detailed stats for this player aren&apos;t available right now. Check back closer to their next fixture.
        </div>
      )}
    </div>
  );
}
