'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useUserSettings } from '@/contexts/user-settings-context';
import { formatOdds } from '@/lib/utils/odds-converter';
import { TeamLogo, SportIcon, LeagueFlag } from '@/components/ui/team-logo';
import type { Match } from '@/lib/api/sports-api';

interface MatchCardNewProps {
  match: Match;
  variant?: 'default' | 'compact' | 'featured';
  showLeague?: boolean;
  showSport?: boolean;
}

export function MatchCardNew({ 
  match, 
  variant = 'default',
  showLeague = true,
  showSport = false 
}: MatchCardNewProps) {
  const { settings } = useUserSettings();
  const isLive = match.status === 'live' || match.status === 'halftime';
  const isFinished = match.status === 'finished';

  const kickoffTime = new Date(match.kickoffTime);
  const timeStr = kickoffTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
  const dateStr = kickoffTime.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });

  if (variant === 'compact') {
    return (
      <div className={cn(
        'flex items-center gap-4 rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/50 hover:bg-card/80',
        isLive && 'border-live/30 bg-live/5'
      )}>
        {/* Time / Status */}
        <div className="w-14 shrink-0 text-center">
          {isLive ? (
            <div className="flex flex-col items-center">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-live"></span>
              </span>
              <span className="mt-1 text-xs font-bold text-live">{match.minute}&apos;</span>
            </div>
          ) : isFinished ? (
            <span className="text-xs font-medium text-muted-foreground">FT</span>
          ) : (
            <div className="text-xs text-muted-foreground">
              <div className="font-medium">{timeStr}</div>
              <div>{dateStr}</div>
            </div>
          )}
        </div>

        {/* Teams with logos */}
        <Link href={`/matches/${match.id}`} className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TeamLogo teamName={match.homeTeam.name} size="xs" />
              <span className={cn(
                'truncate text-sm font-medium',
                isFinished && match.homeScore !== null && match.awayScore !== null && 
                match.homeScore > match.awayScore && 'text-success'
              )}>
                {match.homeTeam.name}
              </span>
            </div>
            {(isLive || isFinished) && match.homeScore !== null && (
              <span className={cn('font-mono text-sm font-bold', isLive && 'text-live')}>
                {match.homeScore}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TeamLogo teamName={match.awayTeam.name} size="xs" />
              <span className={cn(
                'truncate text-sm font-medium',
                isFinished && match.homeScore !== null && match.awayScore !== null && 
                match.awayScore > match.homeScore && 'text-success'
              )}>
                {match.awayTeam.name}
              </span>
            </div>
            {(isLive || isFinished) && match.awayScore !== null && (
              <span className={cn('font-mono text-sm font-bold', isLive && 'text-live')}>
                {match.awayScore}
              </span>
            )}
          </div>
        </Link>

        {/* League link */}
        {showLeague && (
          <Link 
            href={`/leagues/${match.league.slug || match.league.name.toLowerCase().replace(/\s+/g, '-')}`}
            className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-primary sm:flex"
            onClick={(e) => e.stopPropagation()}
          >
            <LeagueFlag countryCode={match.league.countryCode} size="xs" />
          </Link>
        )}

        {/* Odds */}
        {match.odds && !isFinished && (
          <div className="hidden shrink-0 gap-1 sm:flex">
            <OddsButton value={match.odds.home} label="1" format={settings.oddsFormat} />
            <OddsButton value={match.odds.draw || 3.5} label="X" format={settings.oddsFormat} />
            <OddsButton value={match.odds.away} label="2" format={settings.oddsFormat} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      'group rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5',
      isLive && 'border-live/30 bg-gradient-to-br from-live/5 to-transparent',
      variant === 'featured' && 'bg-gradient-to-br from-card to-muted/30'
    )}>
      {/* Header with clickable league */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showSport && (
            <SportIcon sportSlug={match.sport.slug} size="md" />
          )}
          {showLeague && (
            <Link 
              href={`/leagues/${match.league.slug || match.league.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="flex items-center gap-1.5 hover:text-primary"
              onClick={(e) => e.stopPropagation()}
            >
              <LeagueFlag countryCode={match.league.countryCode} size="sm" />
              <span className="text-xs text-muted-foreground hover:text-primary hover:underline">
                {match.league.name}
              </span>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isLive ? (
            <div className="flex items-center gap-1.5 rounded-full bg-live/10 px-2 py-0.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-live"></span>
              </span>
              <span className="text-xs font-bold text-live">{match.minute}&apos;</span>
            </div>
          ) : isFinished ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">FT</span>
          ) : (
            <div className="text-right text-xs text-muted-foreground">
              <div className="font-medium">{dateStr}</div>
              <div>{timeStr}</div>
            </div>
          )}
        </div>
      </div>

      {/* Teams and Score with logos */}
      <Link href={`/matches/${match.id}`} className="block">
        <div className="mb-3 space-y-2">
          {/* Home Team */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <TeamLogo teamName={match.homeTeam.name} size="sm" />
              <span className={cn(
                'truncate text-sm font-semibold',
                isFinished && match.homeScore !== null && match.awayScore !== null && 
                match.homeScore > match.awayScore && 'text-success'
              )}>
                {match.homeTeam.name}
              </span>
            </div>
            {(isLive || isFinished) && match.homeScore !== null && (
              <span className={cn(
                'font-mono text-xl font-bold',
                isLive && 'text-live'
              )}>
                {match.homeScore}
              </span>
            )}
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <TeamLogo teamName={match.awayTeam.name} size="sm" />
              <span className={cn(
                'truncate text-sm font-semibold',
                isFinished && match.homeScore !== null && match.awayScore !== null && 
                match.awayScore > match.homeScore && 'text-success'
              )}>
                {match.awayTeam.name}
              </span>
            </div>
            {(isLive || isFinished) && match.awayScore !== null && (
              <span className={cn(
                'font-mono text-xl font-bold',
                isLive && 'text-live'
              )}>
                {match.awayScore}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Odds */}
      {match.odds && !isFinished && (
        <div className="grid grid-cols-3 gap-1.5">
          <OddsButton value={match.odds.home} label="1" format={settings.oddsFormat} size="lg" />
          <OddsButton value={match.odds.draw || 3.5} label="X" format={settings.oddsFormat} size="lg" />
          <OddsButton value={match.odds.away} label="2" format={settings.oddsFormat} size="lg" />
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{match.tipsCount} tips</span>
        <Link href={`/matches/${match.id}`} className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-primary">
          View details
        </Link>
      </div>
    </div>
  );
}

// Odds Button Component
function OddsButton({ 
  value, 
  label, 
  format,
  size = 'sm' 
}: { 
  value: number; 
  label: string; 
  format: 'decimal' | 'fractional' | 'american';
  size?: 'sm' | 'lg';
}) {
  return (
    <button className={cn(
      'flex flex-col items-center rounded-md bg-secondary transition-colors hover:bg-primary hover:text-primary-foreground',
      size === 'sm' ? 'px-2 py-1' : 'px-3 py-2'
    )}>
      <span className={cn(
        'text-muted-foreground',
        size === 'sm' ? 'text-[10px]' : 'text-xs'
      )}>{label}</span>
      <span className={cn(
        'font-mono font-semibold',
        size === 'sm' ? 'text-xs' : 'text-sm'
      )}>{formatOdds(value, format)}</span>
    </button>
  );
}
