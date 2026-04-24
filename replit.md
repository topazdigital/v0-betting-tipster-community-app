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
- `app/api/matches/route.ts` — main matches endpoint with sort + geo logic; always includes computed odds fallback
- `app/api/matches/[id]/details/route.ts` — match detail including events, lineups (with hasLineups flag), odds
- `app/api/matches/[id]/tips/route.ts` — per-match tipster tips API (seeded mock data, deterministic per matchId)
- `lib/api/unified-sports-api.ts` — ESPN + The Odds API integration; exports `generateRealisticOdds()`
- `lib/hooks/use-matches.ts` — client hook with timezone-based country detection
- `app/(main)/matches/page.tsx` — list page with sport filter tabs
- `app/(main)/matches/[id]/page.tsx` — Oddspedia-style detail page with 8 tabs including Tips
- `components/matches/match-card-new.tsx` — card UI with always-visible odds
- `components/ui/team-logo.tsx` — team logos, sport icons, country flags
- `scripts/setup-database.sql` — MySQL schema (includes lineup_type, tip confidence, is_premium, etc.)

## AI Chat (`app/api/ai/chat/route.ts`)
- OpenAI client is **lazy-init** in `getOpenAI()` so a missing key never throws.
- Reads, in order: `AI_INTEGRATIONS_OPENAI_API_KEY` → `OPENAI_API_KEY`.
- Base URL via `AI_INTEGRATIONS_OPENAI_BASE_URL` → `OPENAI_BASE_URL` (optional).
- Model overridable via `OPENAI_MODEL` (default `gpt-5`).
- When no provider is configured, the route returns a deterministic local
  rules-based reply via `localReply()` instead of failing — chat keeps working.

## Sport-Specific Score Breakdown
- API: `app/api/matches/[id]/details/route.ts` exposes `segmentBreakdown`
  built from ESPN competitor `linescores` (handles both `value` and
  `displayValue`).
- Variants: `quarters` (basketball, american-football), `periods` (hockey),
  `innings` (baseball, cricket), `sets` (tennis, volleyball), `rounds`
  (mma, boxing).
- UI: `<SegmentBreakdownGrid />` in `app/(main)/matches/[id]/page.tsx`
  renders one compact table for any sport. Skipped for soccer (no useful
  segments beyond HT/FT shown in the hero).

## Live Page
- `getLiveMatches()` includes `live`, `halftime`, `extra_time`, `penalties`.
- Empty state explains live-window timing and offers links to "all sports"
  / upcoming matches.

## Match Detail Page Features (app/(main)/matches/[id]/page.tsx)
8-tab layout:
1. **Overview** — tip preview cards, match events, top performers, form, H2H summary
2. **Tips** ⭐ — full TipCard components with tipster stats, prediction, odds, confidence, like buttons; stats header (total/avg confidence/avg odds); add-tip CTA
3. **Events** — chronological match timeline with goals, cards, subs
4. **Odds** — 1X2 cards + probability bar + bookmaker comparison table + spreads/totals
5. **Lineups** — "Confirmed Lineup" badge (when ESPN rosters available) or "Predicted Lineup"; formation pitch SVG; RosterCard with Confirmed/Predicted per team
6. **H2H** — summary win/draw/loss bar + full meeting list
7. **Table** — live league standings (current teams highlighted)
8. **News** — ESPN match articles

## Odds Fallback Strategy
- Real odds: ESPN bookmaker odds or The Odds API results
- If none available: `generateRealisticOdds()` generates sport-specific computed odds seeded by team names
- Applies to: match list cards AND match detail hero
- All matches always display 1 / X / 2 odds

## Lineup Status Labels
- `hasLineups: true` in details API → "Confirmed Lineup" (green badge)
- `hasLineups: false` → "Predicted Lineup" (amber badge with warning)
- Also shown per-team in RosterCard header

## Known Issues
- Some team logo URLs are empty strings from ESPN — shows initials fallback correctly but triggers Next.js Image warnings in console.
- No DATABASE_URL set; database calls in `lib/db.ts` no-op gracefully.
