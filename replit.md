# BetTips Pro (Betcheza)

A comprehensive sports betting tipster community platform built with Next.js 16 and React 19.

## Overview

BetTips Pro allows users to follow live matches, analyze real-time odds, share expert betting tips, and compete on leaderboards. Features AI-powered match predictions via OpenAI, geo-aware league prioritization, and real-time sports data.

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with shadcn/ui and Radix UI
- **State/Data Fetching**: SWR
- **Authentication**: Custom JWT via `jose` + `bcryptjs`, stored in HTTP-only cookies (`betcheza_auth`)
- **Database**: MySQL via `mysql2` (gracefully falls back to mock data if `DATABASE_URL` is not set)
- **AI**: OpenAI via Replit AI Integrations (supports `AI_INTEGRATIONS_OPENAI_API_KEY` and `OPENAI_API_KEY`)

## Project Structure

```
app/
  (auth)/         # Login and registration pages
  (main)/         # Core user-facing app (matches, leagues, leaderboard, tipsters)
  admin/          # Admin dashboard
  api/            # Backend API routes
components/
  ui/             # shadcn/ui components
  matches/        # Match feature components
  tipsters/       # Tipster feature components
  ai/             # AI chat components
  layout/         # Header, footer, sidebar
lib/
  api/            # External API integrations (ESPN, Odds API)
  utils/          # Helpers (timezone, odds conversion, live status)
  auth.ts         # JWT auth helpers
  db.ts           # MySQL connection pool
scripts/          # SQL schema setup scripts
```

## Key Features

- **Live Sports Data**: Real-time scores from ESPN public API (no key needed)
- **Odds Comparison**: Multi-bookmaker odds via The Odds API
- **Tipster Community**: Posts, performance tracking, leaderboards
- **AI Chat**: Betcheza AI copilot powered by OpenAI (with local rules-based fallback)
- **Admin Dashboard**: Full management of matches, users, news, payments

## Environment Variables

| Variable | Purpose |
|---|---|
| `JWT_SECRET` | Signs authentication tokens (set in shared env) |
| `DATABASE_URL` | MySQL connection string (optional — falls back to mock data) |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI access via Replit AI Integrations (auto-provisioned) |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | OpenAI base URL for Replit AI Integrations (auto-provisioned) |
| `OPENAI_API_KEY` | Alternative OpenAI key if not using Replit AI Integrations |
| `OPENAI_MODEL` | Override the AI model (defaults to `gpt-5`) |

## Running the App

```bash
npm run dev    # Development server on port 5000
npm run build  # Production build
npm start      # Production server on port 5000
```

## Demo Credentials

- **Admin**: `admin@betcheza.co.ke` / `admin123`

## Data Fallback Strategy

The app degrades gracefully when external services are unavailable:
- No `DATABASE_URL` → uses mock data and in-memory state
- No OpenAI key → uses local rules-based AI replies
- ESPN API down → uses generated realistic mock match data

## Recent Additions

- **Outrights**: `LEAGUE_TO_ODDS_KEYS` (array) probes multiple Odds API winner/top-scorer keys per league in parallel.
- **TheSportsDB integration** (`lib/api/the-sports-db.ts`): pulls today's events for Kenya Premier League (4504) + small leagues; merged into `getAllMatches`.
- **Auth-aware Add Tip**: `app/(main)/matches/[id]/page.tsx` shows inline `AddTipForm` for logged-in users with REAL `markets[]` from `/api/matches/[id]/details`. POST handler at `app/api/matches/[id]/tips/route.ts`.
- **Multi-market AI** (`components/ai/ai-multi-market.tsx`): AI picks across 1X2, Double Chance, DNB, BTTS, O/U 1.5/2.5/3.5, HT result, Correct Score — pinned to real bookmaker prices when available.
- **Today's Best Bets sidebar** (`components/home/best-bets-panel.tsx`): right rail at lg+ on the homepage with featured pick, 2-fold accumulator, and consensus list — all built from real odds.
- **AI auto-grading** (`components/ai/ai-multi-market.tsx`): when a match's status becomes `finished` and `homeScore/awayScore` are numbers, every AI pick is auto-marked Won / Lost / Void with check/X badge + colored row.
- **Merged tip-form markets** (`components/matches/add-tip-form.tsx`): real bookmaker markets from the details API are listed first; generated markets (correct score, handicaps, first-to-score, etc.) backfill anything missing — user always sees a wide selection with real prices when available.
- **Horizontal lineup pitch** (`app/(main)/matches/[id]/page.tsx > FormationPitch`): landscape pitch with home XI on the left half and away XI on the right (rotated formation columns).
- **Expanded Odds tab**: every market in `match.markets` (BTTS, Double Chance, Totals, Half-time…) renders as its own card alongside the 1X2 + bookmaker comparison.
- **Upcoming matches in single match view** (`UpcomingMatchesPanel` in `app/(main)/matches/[id]/page.tsx`): overview tab now shows the next 5 fixtures in the same league.
- **About page** (`app/(main)/about/page.tsx`): full marketing page with hero, stats, story, features, values, responsible-gambling notice and CTA — `metadata` exported for SEO.
- **Today filter fix** (`app/(main)/matches/page.tsx`): replaced timezone-sensitive `isTodayTz` with `toLocalISODate` comparison so the Today tab matches the API's `tzOffsetMin` behavior.
- **Top scorers (real)** (`getLeagueTopScorers` in `lib/api/unified-sports-api.ts`): now uses ESPN core API `sports.core.api.espn.com/v2/sports/{sport}/leagues/{league}/seasons/{year}/types/1/leaders` and dereferences athlete + team `$ref` URLs in parallel. Sport-aware category picker (soccer→`goalsLeaders`, basketball→`pointsPerGame`, etc.).
- **Upcoming matches for teams** (`fetchTeamSchedule` in `app/api/teams/[id]/route.ts`): supplements the team `/schedule` endpoint (which is past-only for soccer) with 5×7-day league `/scoreboard?dates=…` windows, filtered to events involving the requested team.
- **About panel enrichment** (`app/api/teams/[id]/route.ts`): description, league, country, manager (via ESPN coaches `$ref`), website, record, standing all populated.
- **Outrights filter active keys** (`getActiveOutrightKeys` in `lib/api/unified-sports-api.ts`): caches the live `/sports?all=true` list every 6h and only calls Odds API sport keys with `active && has_outrights` — saves quota and avoids `INVALID_MARKET_COMBO` errors.
- **Clickable league header in matches list** (`app/(main)/matches/page.tsx`): each league section title is a `<Link>` to `/leagues/[slug]` with hover state and chevron.
- **All leagues fetch +21 days** (`unified-sports-api.ts`): non-priority leagues now fetch yesterday → +21 days (was 0). Smaller leagues surface many more matches.
