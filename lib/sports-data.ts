// ============================================
// Sports Data Service - All 30+ Sports
// ============================================

export interface SportConfig {
  id: number;
  name: string;
  slug: string;
  icon: string;
  apiKey?: string;
  category: 'popular' | 'team' | 'individual' | 'combat' | 'racing' | 'other';
}

// All 35 sports supported
export const ALL_SPORTS: SportConfig[] = [
  // Popular Sports
  { id: 1, name: 'Football', slug: 'football', icon: 'soccer', category: 'popular' },
  { id: 2, name: 'Basketball', slug: 'basketball', icon: 'basketball', category: 'popular' },
  { id: 3, name: 'Tennis', slug: 'tennis', icon: 'tennis', category: 'popular' },
  { id: 4, name: 'Cricket', slug: 'cricket', icon: 'cricket', category: 'popular' },
  { id: 5, name: 'American Football', slug: 'american-football', icon: 'football', category: 'popular' },
  { id: 6, name: 'Baseball', slug: 'baseball', icon: 'baseball', category: 'popular' },
  { id: 7, name: 'Ice Hockey', slug: 'ice-hockey', icon: 'hockey', category: 'popular' },
  
  // Team Sports
  { id: 8, name: 'Rugby', slug: 'rugby', icon: 'rugby', category: 'team' },
  { id: 9, name: 'Volleyball', slug: 'volleyball', icon: 'volleyball', category: 'team' },
  { id: 10, name: 'Handball', slug: 'handball', icon: 'handball', category: 'team' },
  { id: 11, name: 'Water Polo', slug: 'water-polo', icon: 'water-polo', category: 'team' },
  { id: 12, name: 'Field Hockey', slug: 'field-hockey', icon: 'field-hockey', category: 'team' },
  { id: 13, name: 'Futsal', slug: 'futsal', icon: 'futsal', category: 'team' },
  { id: 14, name: 'Beach Volleyball', slug: 'beach-volleyball', icon: 'beach-volleyball', category: 'team' },
  { id: 15, name: 'Lacrosse', slug: 'lacrosse', icon: 'lacrosse', category: 'team' },
  { id: 16, name: 'Aussie Rules', slug: 'aussie-rules', icon: 'aussie-rules', category: 'team' },
  
  // Individual Sports
  { id: 17, name: 'Golf', slug: 'golf', icon: 'golf', category: 'individual' },
  { id: 18, name: 'Snooker', slug: 'snooker', icon: 'snooker', category: 'individual' },
  { id: 19, name: 'Darts', slug: 'darts', icon: 'darts', category: 'individual' },
  { id: 20, name: 'Table Tennis', slug: 'table-tennis', icon: 'table-tennis', category: 'individual' },
  { id: 21, name: 'Badminton', slug: 'badminton', icon: 'badminton', category: 'individual' },
  { id: 22, name: 'Squash', slug: 'squash', icon: 'squash', category: 'individual' },
  { id: 23, name: 'Cycling', slug: 'cycling', icon: 'cycling', category: 'individual' },
  { id: 24, name: 'Athletics', slug: 'athletics', icon: 'athletics', category: 'individual' },
  { id: 25, name: 'Swimming', slug: 'swimming', icon: 'swimming', category: 'individual' },
  
  // Combat Sports
  { id: 26, name: 'Boxing', slug: 'boxing', icon: 'boxing', category: 'combat' },
  { id: 27, name: 'MMA', slug: 'mma', icon: 'mma', category: 'combat' },
  { id: 28, name: 'Wrestling', slug: 'wrestling', icon: 'wrestling', category: 'combat' },
  
  // Racing Sports
  { id: 29, name: 'Formula 1', slug: 'formula-1', icon: 'formula-1', category: 'racing' },
  { id: 30, name: 'Horse Racing', slug: 'horse-racing', icon: 'horse-racing', category: 'racing' },
  { id: 31, name: 'NASCAR', slug: 'nascar', icon: 'nascar', category: 'racing' },
  { id: 32, name: 'MotoGP', slug: 'motogp', icon: 'motogp', category: 'racing' },
  
  // Esports & Other
  { id: 33, name: 'Esports', slug: 'esports', icon: 'esports', category: 'other' },
  { id: 34, name: 'Chess', slug: 'chess', icon: 'chess', category: 'other' },
  { id: 35, name: 'Ski Jumping', slug: 'ski-jumping', icon: 'ski-jumping', category: 'other' },
];

// Leagues per sport
export interface LeagueConfig {
  id: number;
  sportId: number;
  name: string;
  slug: string;
  country: string;
  countryCode: string;
  tier: number; // 1 = top tier, 2 = second tier, etc.
  logo?: string;
}

export const ALL_LEAGUES: LeagueConfig[] = [
  // Football
  { id: 1, sportId: 1, name: 'Premier League', slug: 'premier-league', country: 'England', countryCode: 'GB-ENG', tier: 1 },
  { id: 2, sportId: 1, name: 'La Liga', slug: 'la-liga', country: 'Spain', countryCode: 'ES', tier: 1 },
  { id: 3, sportId: 1, name: 'Bundesliga', slug: 'bundesliga', country: 'Germany', countryCode: 'DE', tier: 1 },
  { id: 4, sportId: 1, name: 'Serie A', slug: 'serie-a', country: 'Italy', countryCode: 'IT', tier: 1 },
  { id: 5, sportId: 1, name: 'Ligue 1', slug: 'ligue-1', country: 'France', countryCode: 'FR', tier: 1 },
  { id: 6, sportId: 1, name: 'Eredivisie', slug: 'eredivisie', country: 'Netherlands', countryCode: 'NL', tier: 1 },
  { id: 7, sportId: 1, name: 'Primeira Liga', slug: 'primeira-liga', country: 'Portugal', countryCode: 'PT', tier: 1 },
  { id: 8, sportId: 1, name: 'Scottish Premiership', slug: 'scottish-premiership', country: 'Scotland', countryCode: 'GB-SCT', tier: 1 },
  { id: 9, sportId: 1, name: 'Champions League', slug: 'champions-league', country: 'Europe', countryCode: 'EU', tier: 1 },
  { id: 10, sportId: 1, name: 'Europa League', slug: 'europa-league', country: 'Europe', countryCode: 'EU', tier: 1 },
  { id: 11, sportId: 1, name: 'MLS', slug: 'mls', country: 'USA', countryCode: 'US', tier: 1 },
  { id: 12, sportId: 1, name: 'Brazilian Serie A', slug: 'brazilian-serie-a', country: 'Brazil', countryCode: 'BR', tier: 1 },
  { id: 13, sportId: 1, name: 'Argentine Primera', slug: 'argentine-primera', country: 'Argentina', countryCode: 'AR', tier: 1 },
  { id: 14, sportId: 1, name: 'Saudi Pro League', slug: 'saudi-pro-league', country: 'Saudi Arabia', countryCode: 'SA', tier: 1 },
  { id: 15, sportId: 1, name: 'Turkish Super Lig', slug: 'turkish-super-lig', country: 'Turkey', countryCode: 'TR', tier: 1 },
  { id: 16, sportId: 1, name: 'Belgian Pro League', slug: 'belgian-pro-league', country: 'Belgium', countryCode: 'BE', tier: 1 },
  { id: 17, sportId: 1, name: 'Russian Premier League', slug: 'russian-premier-league', country: 'Russia', countryCode: 'RU', tier: 1 },
  { id: 18, sportId: 1, name: 'J League', slug: 'j-league', country: 'Japan', countryCode: 'JP', tier: 1 },
  { id: 19, sportId: 1, name: 'K League', slug: 'k-league', country: 'South Korea', countryCode: 'KR', tier: 1 },
  { id: 20, sportId: 1, name: 'A-League', slug: 'a-league', country: 'Australia', countryCode: 'AU', tier: 1 },
  { id: 21, sportId: 1, name: 'CAF Champions League', slug: 'caf-champions-league', country: 'Africa', countryCode: 'AF', tier: 1 },
  { id: 22, sportId: 1, name: 'Kenya Premier League', slug: 'kenya-premier-league', country: 'Kenya', countryCode: 'KE', tier: 1 },
  { id: 23, sportId: 1, name: 'Egyptian Premier League', slug: 'egyptian-premier-league', country: 'Egypt', countryCode: 'EG', tier: 1 },
  { id: 24, sportId: 1, name: 'AFCON', slug: 'afcon', country: 'Africa', countryCode: 'AF', tier: 1 },
  { id: 25, sportId: 1, name: 'Copa Libertadores', slug: 'copa-libertadores', country: 'South America', countryCode: 'SA', tier: 1 },
  { id: 26, sportId: 1, name: 'Ghana Premier League', slug: 'ghana-premier-league', country: 'Ghana', countryCode: 'GH', tier: 1 },
  { id: 27, sportId: 1, name: 'Nigerian Premier League', slug: 'nigerian-premier-league', country: 'Nigeria', countryCode: 'NG', tier: 1 },
  { id: 28, sportId: 1, name: 'Tanzanian Premier League', slug: 'tanzanian-premier-league', country: 'Tanzania', countryCode: 'TZ', tier: 1 },
  { id: 29, sportId: 1, name: 'Ugandan Premier League', slug: 'ugandan-premier-league', country: 'Uganda', countryCode: 'UG', tier: 1 },
  { id: 30, sportId: 1, name: 'South African Premier Soccer League', slug: 'south-african-premier-soccer-league', country: 'South Africa', countryCode: 'ZA', tier: 1 },
  { id: 31, sportId: 1, name: 'Moroccan Botola Pro', slug: 'moroccan-botola-pro', country: 'Morocco', countryCode: 'MA', tier: 1 },
  { id: 32, sportId: 1, name: 'Tunisian Ligue Professionnelle 1', slug: 'tunisian-ligue-1', country: 'Tunisia', countryCode: 'TN', tier: 1 },
  { id: 33, sportId: 1, name: 'Algerian Ligue Professionnelle 1', slug: 'algerian-ligue-1', country: 'Algeria', countryCode: 'DZ', tier: 1 },
  { id: 34, sportId: 1, name: 'CAF Confederation Cup', slug: 'caf-confederation-cup', country: 'Africa', countryCode: 'AF', tier: 1 },
  { id: 35, sportId: 1, name: 'UEFA Conference League', slug: 'uefa-conference-league', country: 'Europe', countryCode: 'EU', tier: 1 },
  { id: 36, sportId: 1, name: 'FA Cup', slug: 'fa-cup', country: 'England', countryCode: 'GB-ENG', tier: 1 },
  { id: 37, sportId: 1, name: 'EFL Championship', slug: 'efl-championship', country: 'England', countryCode: 'GB-ENG', tier: 2 },
  { id: 38, sportId: 1, name: 'Copa del Rey', slug: 'copa-del-rey', country: 'Spain', countryCode: 'ES', tier: 1 },
  { id: 39, sportId: 1, name: 'Coppa Italia', slug: 'coppa-italia', country: 'Italy', countryCode: 'IT', tier: 1 },
  { id: 40, sportId: 1, name: 'DFB-Pokal', slug: 'dfb-pokal', country: 'Germany', countryCode: 'DE', tier: 1 },
  
  // Basketball
  { id: 101, sportId: 2, name: 'NBA', slug: 'nba', country: 'USA', countryCode: 'US', tier: 1 },
  { id: 102, sportId: 2, name: 'EuroLeague', slug: 'euroleague', country: 'Europe', countryCode: 'EU', tier: 1 },
  { id: 103, sportId: 2, name: 'NBL', slug: 'nbl', country: 'Australia', countryCode: 'AU', tier: 1 },
  { id: 104, sportId: 2, name: 'CBA', slug: 'cba', country: 'China', countryCode: 'CN', tier: 1 },
  { id: 105, sportId: 2, name: 'Liga ACB', slug: 'liga-acb', country: 'Spain', countryCode: 'ES', tier: 1 },
  { id: 106, sportId: 2, name: 'Basketball Bundesliga', slug: 'basketball-bundesliga', country: 'Germany', countryCode: 'DE', tier: 1 },
  
  // Tennis
  { id: 201, sportId: 3, name: 'ATP Tour', slug: 'atp-tour', country: 'World', countryCode: 'WO', tier: 1 },
  { id: 202, sportId: 3, name: 'WTA Tour', slug: 'wta-tour', country: 'World', countryCode: 'WO', tier: 1 },
  { id: 203, sportId: 3, name: 'Grand Slam', slug: 'grand-slam', country: 'World', countryCode: 'WO', tier: 1 },
  { id: 204, sportId: 3, name: 'Davis Cup', slug: 'davis-cup', country: 'World', countryCode: 'WO', tier: 1 },
  
  // Cricket
  { id: 301, sportId: 4, name: 'IPL', slug: 'ipl', country: 'India', countryCode: 'IN', tier: 1 },
  { id: 302, sportId: 4, name: 'BBL', slug: 'bbl', country: 'Australia', countryCode: 'AU', tier: 1 },
  { id: 303, sportId: 4, name: 'Test Cricket', slug: 'test-cricket', country: 'World', countryCode: 'WO', tier: 1 },
  { id: 304, sportId: 4, name: 'ODI', slug: 'odi', country: 'World', countryCode: 'WO', tier: 1 },
  { id: 305, sportId: 4, name: 'T20 World Cup', slug: 't20-world-cup', country: 'World', countryCode: 'WO', tier: 1 },
  { id: 306, sportId: 4, name: 'PSL', slug: 'psl', country: 'Pakistan', countryCode: 'PK', tier: 1 },
  { id: 307, sportId: 4, name: 'CPL', slug: 'cpl', country: 'Caribbean', countryCode: 'CB', tier: 1 },
  
  // American Football
  { id: 401, sportId: 5, name: 'NFL', slug: 'nfl', country: 'USA', countryCode: 'US', tier: 1 },
  { id: 402, sportId: 5, name: 'NCAAF', slug: 'ncaaf', country: 'USA', countryCode: 'US', tier: 1 },
  { id: 403, sportId: 5, name: 'CFL', slug: 'cfl', country: 'Canada', countryCode: 'CA', tier: 1 },
  { id: 404, sportId: 5, name: 'XFL', slug: 'xfl', country: 'USA', countryCode: 'US', tier: 2 },
  
  // Baseball
  { id: 501, sportId: 6, name: 'MLB', slug: 'mlb', country: 'USA', countryCode: 'US', tier: 1 },
  { id: 502, sportId: 6, name: 'NPB', slug: 'npb', country: 'Japan', countryCode: 'JP', tier: 1 },
  { id: 503, sportId: 6, name: 'KBO', slug: 'kbo', country: 'South Korea', countryCode: 'KR', tier: 1 },
  
  // Ice Hockey
  { id: 601, sportId: 7, name: 'NHL', slug: 'nhl', country: 'USA/Canada', countryCode: 'US', tier: 1 },
  { id: 602, sportId: 7, name: 'KHL', slug: 'khl', country: 'Russia', countryCode: 'RU', tier: 1 },
  { id: 603, sportId: 7, name: 'SHL', slug: 'shl', country: 'Sweden', countryCode: 'SE', tier: 1 },
  { id: 604, sportId: 7, name: 'Liiga', slug: 'liiga', country: 'Finland', countryCode: 'FI', tier: 1 },
  
  // Rugby
  { id: 701, sportId: 8, name: 'Six Nations', slug: 'six-nations', country: 'Europe', countryCode: 'EU', tier: 1 },
  { id: 702, sportId: 8, name: 'Rugby World Cup', slug: 'rugby-world-cup', country: 'World', countryCode: 'WO', tier: 1 },
  { id: 703, sportId: 8, name: 'Super Rugby', slug: 'super-rugby', country: 'Southern Hemisphere', countryCode: 'SH', tier: 1 },
  { id: 704, sportId: 8, name: 'Premiership Rugby', slug: 'premiership-rugby', country: 'England', countryCode: 'GB-ENG', tier: 1 },
  
  // MMA
  { id: 2701, sportId: 27, name: 'UFC', slug: 'ufc', country: 'World', countryCode: 'WO', tier: 1 },
  { id: 2702, sportId: 27, name: 'Bellator', slug: 'bellator', country: 'USA', countryCode: 'US', tier: 1 },
  { id: 2703, sportId: 27, name: 'ONE Championship', slug: 'one-championship', country: 'Asia', countryCode: 'AS', tier: 1 },
  
  // Boxing
  { id: 2601, sportId: 26, name: 'WBC', slug: 'wbc', country: 'World', countryCode: 'WO', tier: 1 },
  { id: 2602, sportId: 26, name: 'WBA', slug: 'wba', country: 'World', countryCode: 'WO', tier: 1 },
  { id: 2603, sportId: 26, name: 'IBF', slug: 'ibf', country: 'World', countryCode: 'WO', tier: 1 },
  
  // Formula 1
  { id: 2901, sportId: 29, name: 'F1 World Championship', slug: 'f1-world-championship', country: 'World', countryCode: 'WO', tier: 1 },
  { id: 2902, sportId: 29, name: 'F2', slug: 'f2', country: 'World', countryCode: 'WO', tier: 2 },
  
  // Golf
  { id: 1701, sportId: 17, name: 'PGA Tour', slug: 'pga-tour', country: 'USA', countryCode: 'US', tier: 1 },
  { id: 1702, sportId: 17, name: 'European Tour', slug: 'european-tour', country: 'Europe', countryCode: 'EU', tier: 1 },
  { id: 1703, sportId: 17, name: 'LIV Golf', slug: 'liv-golf', country: 'World', countryCode: 'WO', tier: 1 },
  
  // Esports
  { id: 3301, sportId: 33, name: 'CS2', slug: 'cs2', country: 'World', countryCode: 'WO', tier: 1 },
  { id: 3302, sportId: 33, name: 'League of Legends', slug: 'league-of-legends', country: 'World', countryCode: 'WO', tier: 1 },
  { id: 3303, sportId: 33, name: 'Dota 2', slug: 'dota-2', country: 'World', countryCode: 'WO', tier: 1 },
  { id: 3304, sportId: 33, name: 'Valorant', slug: 'valorant', country: 'World', countryCode: 'WO', tier: 1 },
  { id: 3305, sportId: 33, name: 'EA FC', slug: 'ea-fc', country: 'World', countryCode: 'WO', tier: 1 },
];

// Teams database
export interface TeamConfig {
  id: number;
  sportId: number;
  leagueId: number;
  name: string;
  shortName: string;
  country: string;
  logo?: string;
}

// Sample teams for major leagues
export const TEAMS_DATABASE: TeamConfig[] = [
  // Premier League
  { id: 1, sportId: 1, leagueId: 1, name: 'Arsenal', shortName: 'ARS', country: 'England' },
  { id: 2, sportId: 1, leagueId: 1, name: 'Manchester City', shortName: 'MCI', country: 'England' },
  { id: 3, sportId: 1, leagueId: 1, name: 'Liverpool', shortName: 'LIV', country: 'England' },
  { id: 4, sportId: 1, leagueId: 1, name: 'Manchester United', shortName: 'MUN', country: 'England' },
  { id: 5, sportId: 1, leagueId: 1, name: 'Chelsea', shortName: 'CHE', country: 'England' },
  { id: 6, sportId: 1, leagueId: 1, name: 'Tottenham Hotspur', shortName: 'TOT', country: 'England' },
  { id: 7, sportId: 1, leagueId: 1, name: 'Newcastle United', shortName: 'NEW', country: 'England' },
  { id: 8, sportId: 1, leagueId: 1, name: 'Brighton', shortName: 'BHA', country: 'England' },
  { id: 9, sportId: 1, leagueId: 1, name: 'Aston Villa', shortName: 'AVL', country: 'England' },
  { id: 10, sportId: 1, leagueId: 1, name: 'West Ham', shortName: 'WHU', country: 'England' },
  { id: 11, sportId: 1, leagueId: 1, name: 'Crystal Palace', shortName: 'CRY', country: 'England' },
  { id: 12, sportId: 1, leagueId: 1, name: 'Fulham', shortName: 'FUL', country: 'England' },
  { id: 13, sportId: 1, leagueId: 1, name: 'Everton', shortName: 'EVE', country: 'England' },
  { id: 14, sportId: 1, leagueId: 1, name: 'Brentford', shortName: 'BRE', country: 'England' },
  { id: 15, sportId: 1, leagueId: 1, name: 'Nottingham Forest', shortName: 'NFO', country: 'England' },
  { id: 16, sportId: 1, leagueId: 1, name: 'Wolves', shortName: 'WOL', country: 'England' },
  { id: 17, sportId: 1, leagueId: 1, name: 'Bournemouth', shortName: 'BOU', country: 'England' },
  { id: 18, sportId: 1, leagueId: 1, name: 'Leicester City', shortName: 'LEI', country: 'England' },
  { id: 19, sportId: 1, leagueId: 1, name: 'Southampton', shortName: 'SOU', country: 'England' },
  { id: 20, sportId: 1, leagueId: 1, name: 'Ipswich Town', shortName: 'IPS', country: 'England' },
  
  // La Liga
  { id: 101, sportId: 1, leagueId: 2, name: 'Real Madrid', shortName: 'RMA', country: 'Spain' },
  { id: 102, sportId: 1, leagueId: 2, name: 'Barcelona', shortName: 'BAR', country: 'Spain' },
  { id: 103, sportId: 1, leagueId: 2, name: 'Atletico Madrid', shortName: 'ATM', country: 'Spain' },
  { id: 104, sportId: 1, leagueId: 2, name: 'Sevilla', shortName: 'SEV', country: 'Spain' },
  { id: 105, sportId: 1, leagueId: 2, name: 'Real Sociedad', shortName: 'RSO', country: 'Spain' },
  { id: 106, sportId: 1, leagueId: 2, name: 'Real Betis', shortName: 'BET', country: 'Spain' },
  { id: 107, sportId: 1, leagueId: 2, name: 'Villarreal', shortName: 'VIL', country: 'Spain' },
  { id: 108, sportId: 1, leagueId: 2, name: 'Athletic Bilbao', shortName: 'ATH', country: 'Spain' },
  { id: 109, sportId: 1, leagueId: 2, name: 'Valencia', shortName: 'VAL', country: 'Spain' },
  { id: 110, sportId: 1, leagueId: 2, name: 'Girona', shortName: 'GIR', country: 'Spain' },
  
  // Bundesliga
  { id: 201, sportId: 1, leagueId: 3, name: 'Bayern Munich', shortName: 'BAY', country: 'Germany' },
  { id: 202, sportId: 1, leagueId: 3, name: 'Borussia Dortmund', shortName: 'BVB', country: 'Germany' },
  { id: 203, sportId: 1, leagueId: 3, name: 'RB Leipzig', shortName: 'RBL', country: 'Germany' },
  { id: 204, sportId: 1, leagueId: 3, name: 'Bayer Leverkusen', shortName: 'B04', country: 'Germany' },
  { id: 205, sportId: 1, leagueId: 3, name: 'Eintracht Frankfurt', shortName: 'SGE', country: 'Germany' },
  { id: 206, sportId: 1, leagueId: 3, name: 'Union Berlin', shortName: 'UNB', country: 'Germany' },
  { id: 207, sportId: 1, leagueId: 3, name: 'SC Freiburg', shortName: 'SCF', country: 'Germany' },
  { id: 208, sportId: 1, leagueId: 3, name: 'VfB Stuttgart', shortName: 'VFB', country: 'Germany' },
  
  // Serie A
  { id: 301, sportId: 1, leagueId: 4, name: 'Inter Milan', shortName: 'INT', country: 'Italy' },
  { id: 302, sportId: 1, leagueId: 4, name: 'AC Milan', shortName: 'MIL', country: 'Italy' },
  { id: 303, sportId: 1, leagueId: 4, name: 'Juventus', shortName: 'JUV', country: 'Italy' },
  { id: 304, sportId: 1, leagueId: 4, name: 'Napoli', shortName: 'NAP', country: 'Italy' },
  { id: 305, sportId: 1, leagueId: 4, name: 'AS Roma', shortName: 'ROM', country: 'Italy' },
  { id: 306, sportId: 1, leagueId: 4, name: 'Lazio', shortName: 'LAZ', country: 'Italy' },
  { id: 307, sportId: 1, leagueId: 4, name: 'Atalanta', shortName: 'ATA', country: 'Italy' },
  { id: 308, sportId: 1, leagueId: 4, name: 'Fiorentina', shortName: 'FIO', country: 'Italy' },
  
  // NBA
  { id: 1001, sportId: 2, leagueId: 101, name: 'Los Angeles Lakers', shortName: 'LAL', country: 'USA' },
  { id: 1002, sportId: 2, leagueId: 101, name: 'Golden State Warriors', shortName: 'GSW', country: 'USA' },
  { id: 1003, sportId: 2, leagueId: 101, name: 'Boston Celtics', shortName: 'BOS', country: 'USA' },
  { id: 1004, sportId: 2, leagueId: 101, name: 'Miami Heat', shortName: 'MIA', country: 'USA' },
  { id: 1005, sportId: 2, leagueId: 101, name: 'Denver Nuggets', shortName: 'DEN', country: 'USA' },
  { id: 1006, sportId: 2, leagueId: 101, name: 'Milwaukee Bucks', shortName: 'MIL', country: 'USA' },
  { id: 1007, sportId: 2, leagueId: 101, name: 'Phoenix Suns', shortName: 'PHX', country: 'USA' },
  { id: 1008, sportId: 2, leagueId: 101, name: 'Dallas Mavericks', shortName: 'DAL', country: 'USA' },
  
  // NFL
  { id: 2001, sportId: 5, leagueId: 401, name: 'Kansas City Chiefs', shortName: 'KC', country: 'USA' },
  { id: 2002, sportId: 5, leagueId: 401, name: 'Philadelphia Eagles', shortName: 'PHI', country: 'USA' },
  { id: 2003, sportId: 5, leagueId: 401, name: 'San Francisco 49ers', shortName: 'SF', country: 'USA' },
  { id: 2004, sportId: 5, leagueId: 401, name: 'Dallas Cowboys', shortName: 'DAL', country: 'USA' },
  { id: 2005, sportId: 5, leagueId: 401, name: 'Buffalo Bills', shortName: 'BUF', country: 'USA' },
  { id: 2006, sportId: 5, leagueId: 401, name: 'Miami Dolphins', shortName: 'MIA', country: 'USA' },
  { id: 2007, sportId: 5, leagueId: 401, name: 'Detroit Lions', shortName: 'DET', country: 'USA' },
  { id: 2008, sportId: 5, leagueId: 401, name: 'Baltimore Ravens', shortName: 'BAL', country: 'USA' },
  
  // UFC
  { id: 3001, sportId: 27, leagueId: 2701, name: 'Jon Jones', shortName: 'JON', country: 'USA' },
  { id: 3002, sportId: 27, leagueId: 2701, name: 'Islam Makhachev', shortName: 'ISL', country: 'Russia' },
  { id: 3003, sportId: 27, leagueId: 2701, name: 'Alex Pereira', shortName: 'PER', country: 'Brazil' },
  { id: 3004, sportId: 27, leagueId: 2701, name: 'Israel Adesanya', shortName: 'ISR', country: 'Nigeria' },
];

// Bookmakers
export interface BookmakerConfig {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  affiliateUrl: string;
  regions: string[];
  featured: boolean;
}

export const BOOKMAKERS: BookmakerConfig[] = [
  { id: 1, name: 'Bet365', slug: 'bet365', affiliateUrl: 'https://bet365.com', regions: ['UK', 'EU', 'AU'], featured: true },
  { id: 2, name: 'Betway', slug: 'betway', affiliateUrl: 'https://betway.com', regions: ['UK', 'KE', 'NG', 'GH'], featured: true },
  { id: 3, name: '1xBet', slug: '1xbet', affiliateUrl: 'https://1xbet.com', regions: ['KE', 'NG', 'GH', 'EU'], featured: true },
  { id: 4, name: 'Sportybet', slug: 'sportybet', affiliateUrl: 'https://sportybet.com', regions: ['KE', 'NG', 'GH'], featured: true },
  { id: 5, name: 'Betika', slug: 'betika', affiliateUrl: 'https://betika.com', regions: ['KE'], featured: true },
  { id: 6, name: 'William Hill', slug: 'william-hill', affiliateUrl: 'https://williamhill.com', regions: ['UK', 'EU'], featured: true },
  { id: 7, name: 'Unibet', slug: 'unibet', affiliateUrl: 'https://unibet.com', regions: ['UK', 'EU', 'AU'], featured: true },
  { id: 8, name: 'DraftKings', slug: 'draftkings', affiliateUrl: 'https://draftkings.com', regions: ['US'], featured: true },
  { id: 9, name: 'FanDuel', slug: 'fanduel', affiliateUrl: 'https://fanduel.com', regions: ['US'], featured: true },
  { id: 10, name: 'BetMGM', slug: 'betmgm', affiliateUrl: 'https://betmgm.com', regions: ['US'], featured: true },
  { id: 11, name: 'Pinnacle', slug: 'pinnacle', affiliateUrl: 'https://pinnacle.com', regions: ['EU', 'AS'], featured: false },
  { id: 12, name: 'Paddy Power', slug: 'paddy-power', affiliateUrl: 'https://paddypower.com', regions: ['UK', 'IE'], featured: true },
  { id: 13, name: 'Ladbrokes', slug: 'ladbrokes', affiliateUrl: 'https://ladbrokes.com', regions: ['UK', 'AU'], featured: true },
  { id: 14, name: 'Coral', slug: 'coral', affiliateUrl: 'https://coral.co.uk', regions: ['UK'], featured: false },
  { id: 15, name: 'BetVictor', slug: 'betvictor', affiliateUrl: 'https://betvictor.com', regions: ['UK', 'EU'], featured: false },
  { id: 16, name: 'Betfair', slug: 'betfair', affiliateUrl: 'https://betfair.com', regions: ['UK', 'EU', 'AU'], featured: true },
  { id: 17, name: '22Bet', slug: '22bet', affiliateUrl: 'https://22bet.com', regions: ['KE', 'NG', 'GH'], featured: true },
  { id: 18, name: 'Melbet', slug: 'melbet', affiliateUrl: 'https://melbet.com', regions: ['KE', 'NG'], featured: false },
];

// Market types
export interface MarketConfig {
  id: number;
  name: string;
  slug: string;
  description: string;
  sportIds: number[]; // which sports support this market
}

export const MARKETS: MarketConfig[] = [
  { id: 1, name: '1X2', slug: '1x2', description: 'Match winner', sportIds: [1, 7, 8, 9, 10] },
  { id: 2, name: 'Moneyline', slug: 'moneyline', description: 'Match winner (2-way)', sportIds: [2, 3, 4, 5, 6, 7, 26, 27] },
  { id: 3, name: 'Over/Under', slug: 'over-under', description: 'Total goals/points', sportIds: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  { id: 4, name: 'BTTS', slug: 'btts', description: 'Both teams to score', sportIds: [1, 7, 8] },
  { id: 5, name: 'Asian Handicap', slug: 'asian-handicap', description: 'Handicap betting', sportIds: [1, 2, 5, 6, 7] },
  { id: 6, name: 'Double Chance', slug: 'double-chance', description: 'Two outcomes', sportIds: [1, 7, 8] },
  { id: 7, name: 'Correct Score', slug: 'correct-score', description: 'Exact score', sportIds: [1, 3, 9] },
  { id: 8, name: 'Spread', slug: 'spread', description: 'Point spread', sportIds: [2, 5, 6] },
  { id: 9, name: 'Outright Winner', slug: 'outright', description: 'Tournament winner', sportIds: [1, 2, 3, 4, 17, 29] },
  { id: 10, name: 'Method of Victory', slug: 'method-of-victory', description: 'How the fight ends', sportIds: [26, 27] },
  { id: 11, name: 'Round Betting', slug: 'round-betting', description: 'Round the fight ends', sportIds: [26, 27] },
];

// Country flags utility
// Re-export the canonical flag resolver so old call sites get the same
// England/Scotland/Wales/EU/continental special-cases as <LeagueFlag />.
export { countryCodeToFlag as getCountryFlag } from './country-flags';

// Get sport icon by slug or id
export function getSportIcon(sportSlugOrId: string | number): string {
  const iconMap: Record<string, string> = {
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
  };
  
  // If it's a number, find the sport by ID
  if (typeof sportSlugOrId === 'number') {
    const sport = ALL_SPORTS.find(s => s.id === sportSlugOrId);
    return sport ? iconMap[sport.slug] || '🏆' : '🏆';
  }
  
  return iconMap[sportSlugOrId] || '🏆';
}

// Get sport by ID
export function getSportById(id: number): SportConfig | undefined {
  return ALL_SPORTS.find(s => s.id === id);
}

// Get league by ID
export function getLeagueById(id: number): LeagueConfig | undefined {
  return ALL_LEAGUES.find(l => l.id === id);
}
