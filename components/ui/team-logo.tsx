"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface TeamLogoProps {
  teamName: string
  teamId?: number
  leagueId?: number
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
  showFallback?: boolean
}

// Team to logo URL mappings (using public APIs)
const TEAM_LOGOS: Record<string, string> = {
  // Premier League
  'Arsenal': 'https://media.api-sports.io/football/teams/42.png',
  'Manchester City': 'https://media.api-sports.io/football/teams/50.png',
  'Liverpool': 'https://media.api-sports.io/football/teams/40.png',
  'Manchester United': 'https://media.api-sports.io/football/teams/33.png',
  'Chelsea': 'https://media.api-sports.io/football/teams/49.png',
  'Tottenham Hotspur': 'https://media.api-sports.io/football/teams/47.png',
  'Newcastle United': 'https://media.api-sports.io/football/teams/34.png',
  'Brighton': 'https://media.api-sports.io/football/teams/51.png',
  'Aston Villa': 'https://media.api-sports.io/football/teams/66.png',
  'West Ham': 'https://media.api-sports.io/football/teams/48.png',
  'Crystal Palace': 'https://media.api-sports.io/football/teams/52.png',
  'Fulham': 'https://media.api-sports.io/football/teams/36.png',
  'Everton': 'https://media.api-sports.io/football/teams/45.png',
  'Brentford': 'https://media.api-sports.io/football/teams/55.png',
  'Nottingham Forest': 'https://media.api-sports.io/football/teams/65.png',
  'Wolves': 'https://media.api-sports.io/football/teams/39.png',
  'Bournemouth': 'https://media.api-sports.io/football/teams/35.png',
  'Leicester City': 'https://media.api-sports.io/football/teams/46.png',
  'Southampton': 'https://media.api-sports.io/football/teams/41.png',
  'Ipswich Town': 'https://media.api-sports.io/football/teams/57.png',

  // La Liga
  'Real Madrid': 'https://media.api-sports.io/football/teams/541.png',
  'Barcelona': 'https://media.api-sports.io/football/teams/529.png',
  'Atletico Madrid': 'https://media.api-sports.io/football/teams/530.png',
  'Sevilla': 'https://media.api-sports.io/football/teams/536.png',
  'Real Sociedad': 'https://media.api-sports.io/football/teams/548.png',
  'Real Betis': 'https://media.api-sports.io/football/teams/543.png',
  'Villarreal': 'https://media.api-sports.io/football/teams/533.png',
  'Athletic Bilbao': 'https://media.api-sports.io/football/teams/531.png',
  'Valencia': 'https://media.api-sports.io/football/teams/532.png',
  'Girona': 'https://media.api-sports.io/football/teams/547.png',

  // Bundesliga
  'Bayern Munich': 'https://media.api-sports.io/football/teams/157.png',
  'Borussia Dortmund': 'https://media.api-sports.io/football/teams/165.png',
  'RB Leipzig': 'https://media.api-sports.io/football/teams/173.png',
  'Bayer Leverkusen': 'https://media.api-sports.io/football/teams/168.png',
  'Eintracht Frankfurt': 'https://media.api-sports.io/football/teams/169.png',
  'Union Berlin': 'https://media.api-sports.io/football/teams/182.png',
  'SC Freiburg': 'https://media.api-sports.io/football/teams/160.png',
  'VfB Stuttgart': 'https://media.api-sports.io/football/teams/172.png',

  // Serie A
  'Inter Milan': 'https://media.api-sports.io/football/teams/505.png',
  'AC Milan': 'https://media.api-sports.io/football/teams/489.png',
  'Juventus': 'https://media.api-sports.io/football/teams/496.png',
  'Napoli': 'https://media.api-sports.io/football/teams/492.png',
  'AS Roma': 'https://media.api-sports.io/football/teams/497.png',
  'Lazio': 'https://media.api-sports.io/football/teams/487.png',
  'Atalanta': 'https://media.api-sports.io/football/teams/499.png',
  'Fiorentina': 'https://media.api-sports.io/football/teams/502.png',

  // Ligue 1
  'Paris Saint-Germain': 'https://media.api-sports.io/football/teams/85.png',
  'Monaco': 'https://media.api-sports.io/football/teams/91.png',
  'Marseille': 'https://media.api-sports.io/football/teams/81.png',
  'Lyon': 'https://media.api-sports.io/football/teams/80.png',
  'Lille': 'https://media.api-sports.io/football/teams/79.png',

  // NBA
  'Los Angeles Lakers': 'https://media.api-sports.io/basketball/teams/145.png',
  'Golden State Warriors': 'https://media.api-sports.io/basketball/teams/140.png',
  'Boston Celtics': 'https://media.api-sports.io/basketball/teams/133.png',
  'Miami Heat': 'https://media.api-sports.io/basketball/teams/146.png',
  'Denver Nuggets': 'https://media.api-sports.io/basketball/teams/138.png',
  'Milwaukee Bucks': 'https://media.api-sports.io/basketball/teams/147.png',
  'Phoenix Suns': 'https://media.api-sports.io/basketball/teams/151.png',
  'Dallas Mavericks': 'https://media.api-sports.io/basketball/teams/137.png',

  // NFL
  'Kansas City Chiefs': 'https://media.api-sports.io/american-football/teams/12.png',
  'Philadelphia Eagles': 'https://media.api-sports.io/american-football/teams/20.png',
  'San Francisco 49ers': 'https://media.api-sports.io/american-football/teams/25.png',
  'Dallas Cowboys': 'https://media.api-sports.io/american-football/teams/8.png',
  'Buffalo Bills': 'https://media.api-sports.io/american-football/teams/4.png',
  'Miami Dolphins': 'https://media.api-sports.io/american-football/teams/18.png',
  'Detroit Lions': 'https://media.api-sports.io/american-football/teams/10.png',
  'Baltimore Ravens': 'https://media.api-sports.io/american-football/teams/3.png',
}

// Generate fallback initials
function getInitials(name: string): string {
  const words = name.split(' ')
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

// Generate consistent color from team name
function getColorFromName(name: string): string {
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500',
    'bg-orange-500', 'bg-teal-500', 'bg-emerald-500', 'bg-rose-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const sizeClasses = {
  xs: 'h-6 w-6 text-[8px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

export function TeamLogo({ 
  teamName, 
  teamId, 
  leagueId,
  size = 'md', 
  className,
  showFallback = true 
}: TeamLogoProps) {
  const [hasError, setHasError] = useState(false)
  const logoUrl = TEAM_LOGOS[teamName]
  
  // Use image if available and no error
  if (logoUrl && !hasError) {
    return (
      <div className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-muted",
        sizeClasses[size],
        className
      )}>
        <Image
          src={logoUrl}
          alt={teamName}
          fill
          className="object-contain p-0.5"
          onError={() => setHasError(true)}
          unoptimized
        />
      </div>
    )
  }
  
  // Fallback to initials
  if (showFallback) {
    const initials = getInitials(teamName)
    const bgColor = getColorFromName(teamName)
    
    return (
      <div className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-white",
        sizeClasses[size],
        bgColor,
        className
      )}>
        {initials}
      </div>
    )
  }
  
  return null
}

// Sport icon component
interface SportIconProps {
  sportSlug: string
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}

const SPORT_ICONS: Record<string, string> = {
  'football': '⚽',
  'basketball': '🏀',
  'tennis': '🎾',
  'cricket': '🏏',
  'american-football': '🏈',
  'baseball': '⚾',
  'ice-hockey': '🏒',
  'rugby': '🏉',
  'volleyball': '🏐',
  'handball': '🤾',
  'golf': '⛳',
  'boxing': '🥊',
  'mma': '🥋',
  'formula-1': '🏎️',
  'horse-racing': '🏇',
  'esports': '🎮',
  'table-tennis': '🏓',
  'badminton': '🏸',
  'cycling': '🚴',
  'swimming': '🏊',
  'darts': '🎯',
  'snooker': '🎱',
  'chess': '♟️',
  'futsal': '⚽',
  'water-polo': '🤽',
  'field-hockey': '🏑',
  'beach-volleyball': '🏐',
  'lacrosse': '🥍',
  'aussie-rules': '🏉',
  'squash': '🎾',
  'athletics': '🏃',
  'wrestling': '🤼',
  'nascar': '🏎️',
  'motogp': '🏍️',
  'ski-jumping': '⛷️',
}

const iconSizeClasses = {
  xs: 'text-sm',
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
}

export function SportIcon({ sportSlug, size = 'md', className }: SportIconProps) {
  const icon = SPORT_ICONS[sportSlug] || '🏆'
  
  return (
    <span className={cn(iconSizeClasses[size], className)} role="img" aria-label={sportSlug}>
      {icon}
    </span>
  )
}

// League flag component
interface LeagueFlagProps {
  countryCode: string
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}

export function LeagueFlag({ countryCode, size = 'md', className }: LeagueFlagProps) {
  // Convert country code to flag emoji
  const getFlag = (code: string): string => {
    const cleanCode = code.replace('GB-ENG', 'GB').replace('GB-SCT', 'GB').split('-')[0].toUpperCase()
    
    // Special cases
    if (cleanCode === 'EU') return '🇪🇺'
    if (cleanCode === 'WO' || cleanCode === 'WORLD') return '🌍'
    if (cleanCode === 'AF') return '🌍' // Africa
    if (cleanCode === 'AS') return '🌏' // Asia
    if (cleanCode === 'SA' && code !== 'SA') return '🌎' // South America
    if (cleanCode === 'SH') return '🌏' // Southern Hemisphere
    if (cleanCode === 'CB') return '🌴' // Caribbean
    
    // Standard country flag
    if (cleanCode.length === 2) {
      const codePoints = cleanCode
        .split('')
        .map(char => 127397 + char.charCodeAt(0))
      return String.fromCodePoint(...codePoints)
    }
    
    return '🏳️'
  }
  
  return (
    <span className={cn(iconSizeClasses[size], className)} role="img" aria-label={countryCode}>
      {getFlag(countryCode)}
    </span>
  )
}
