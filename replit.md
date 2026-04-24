# BetTips Pro (Betcheza)

Sports betting tipster app. Live matches, odds, expert tips, leaderboards.

## Stack
- Next.js 16 (App Router) + React 19 + Turbopack
- Tailwind CSS v4, shadcn/ui, Radix
- SWR for data fetching, jose + bcryptjs for auth
- mysql2 (optional — degrades gracefully when no DATABASE_URL)
- Runs on port 5000 via `npm run dev`

## Data Sources
1. **ESPN Hidden API** — primary source for matches, scores, fixtures (free, no key)
2. **The Odds API** — real bookmaker odds when key is available
   - Env var: `THE_ODDS_API_KEY`
   - Auto-falls-back to computed odds when quota exhausted (1 hour back-off)
3. SportsDataIO + OddsApi.io — optional (env vars: `SPORTSDATA_IO_KEY`, `ODDS_API_IO_KEY`)

Wired in `lib/api/unified-sports-api.ts`:
- `getAllMatches()` parallel-fetches ESPN matches + The Odds API odds, then merges real odds onto matching games (team-pair + date index).
- Bookmaker odds aggregated via average across all available bookmakers ("Market Average").

## Sport & League Priority
- **Football is always first** — pinned in `SPORT_PRIORITY` in `app/api/matches/route.ts`.
- League priority is **geo-aware**. The `useMatches` hook detects browser timezone → country code → passes `countryCode` query param to `/api/matches`.
- `COUNTRY_LEAGUES` map in `app/api/matches/route.ts` defines each country's league preference. Examples:
  - `KE` (Kenya) → AFCON, UCL, UEL, Top 5 European leagues
  - `GB` → Premier League, Scottish, UCL, UEL, Top 5
  - `BR` → Brasileirão, Copa Libertadores, UCL, Top 5
- Sort order: sport priority → league priority → status (live > scheduled > finished) → kickoff time.

## Timezone Handling
- All times rendered using browser's local timezone via `lib/utils/timezone.ts`.
- Helpers: `formatTime`, `formatDate`, `formatDateTime`, `getDayLabel`, `getBrowserTimezone`.
- Used on match list cards, match detail page header/body, tip timestamps, H2H meeting dates.

## Key Files
- `app/api/matches/route.ts` — main matches endpoint with sort + geo logic
- `lib/api/unified-sports-api.ts` — ESPN + The Odds API integration
- `lib/hooks/use-matches.ts` — client hook with timezone-based country detection
- `app/(main)/matches/page.tsx` — list page with sport filter tabs
- `app/(main)/matches/[id]/page.tsx` — Oddspedia-style detail page
- `components/matches/match-card-new.tsx` — card UI
- `components/ui/team-logo.tsx` — team logos, sport icons, country flags

## Known Issues
- Several pre-existing TypeScript strict-mode warnings in TeamLogo prop usage and a stale `match-tips.tsx` file referencing fields that no longer exist on the Tip type. They don't block runtime.
- No DATABASE_URL set; database calls in `lib/db.ts` no-op gracefully.
