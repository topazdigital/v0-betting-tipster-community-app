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
- **Real flag icons everywhere** (`components/ui/flag-icon.tsx`): replaced unicode emoji output (which displayed inconsistently for ES, TR, IN, GB-ENG…) with PNG flags from flagcdn.com, with subdivision support for England/Scotland/Wales/N.Ireland and EU/world fallbacks. `LeagueFlag`, sidebar, leagues, competitions, matches list, single match, live and best-bets panels all updated.
- **Follow Team & personalised dashboard** (`app/(main)/dashboard/page.tsx`, `components/teams/follow-team-button.tsx`, `lib/follows-store.ts`): one-tap follow on team page; `/dashboard` aggregates fixtures, results and AI tips for followed teams (DB-backed with in-memory fallback).
- **Web push + email notifications** (`public/sw.js`, `lib/push-client.ts`, `lib/notification-store.ts`): browser push subscriptions work for logged-out users (anonymous device subs), email opt-in with topic preferences, in-app notifications feed at `/notifications`, admin broadcast at `/admin/notifications` and subscriber CRM at `/admin/subscribers`.
- **League routing fix** (`lib/api/unified-sports-api.ts` line ~1815, `app/(main)/leagues/[slug]/page.tsx`): league page derives slug from `ALL_LEAGUES` (not synthetic `eng-1`), with ESPN alias map fallback so `/leagues/eng-1` and friends resolve correctly.
- **Standings logo enrichment** (`app/api/matches/[id]/details/route.ts`): standings rows pass `logos[]` and ESPN CDN logo fallback so the Table tab shows real club crests instead of colored circles.
- **DB schema additions** (`scripts/setup-database-consolidated.sql`): added `team_follows`, `notification_preferences`, `push_subscriptions`, `email_subscribers`, plus `channel` column on `notifications`.
- **8-feature batch update (Apr 2026)**:
  - **15 new leagues** in `lib/sports-data.ts` (Ghana, Nigeria, Tanzania, Uganda, S.Africa PSL, Morocco, Tunisia, Algeria, CAF Confed, UEFA Conference, FA Cup, EFL Championship, Copa del Rey, Coppa Italia, DFB-Pokal — ids 26–40) plus matching aliases in `lib/league-aliases.ts` (`gha-1`, `nga-1`, `tza-1`, `uga-1`, `psl`, `mar-1`, `tun-1`, `alg-1`, `eg-1`, cup aliases).
  - **No more "League not found"** (`app/(main)/leagues/[slug]/page.tsx`): when a slug isn't in `ALL_LEAGUES` we fetch all matches, filter client-side by slugified league name, build a synthetic header from the first match, and show a friendly empty state if there are still no matches.
  - **Per-sport match counts (Oddspedia-style)** (`app/(main)/page.tsx`, `app/(main)/matches/page.tsx`): added an unfiltered `useMatches()` call so the count badges next to each sport tab stay accurate when a sport tab is selected.
  - **Today's Matches improvements** (`app/(main)/page.tsx`): excludes live matches (no overlap with the dedicated Live section) and sorts by kickoff ascending — latest-on-deck first, all sports interleaved.
  - **Compact Results page** (`app/(main)/results/page.tsx`): full rewrite — one-row league headers, compact match rows via `MatchCardNew variant="compact"`, sport pills, date-range selector (1/3/7/14/30 days), `useFinishedMatches` polls every 60s and freshly finished matches bubble to the top automatically.
  - **Auth modal** (`contexts/auth-modal-context.tsx`, `components/auth/auth-modal.tsx`, mounted in `app/layout.tsx`): Login/Signup now open as a Dialog with Login + Register panels; closing the dialog keeps the user on the current page; after successful login/signup the modal closes and stays put (no redirect). Header buttons (`components/layout/header.tsx`) trigger `openAuthModal('login'|'register')`. The legacy `/login` and `/register` routes still work for bookmarks.
  - **Smart AI mode** (`components/ai/ai-multi-market.tsx`): added an "Odds-based / Smart AI" toggle. The Smart AI engine (`buildSmartPicks`) ignores bookmaker prices for the SELECTION (uses recent form, head-to-head record, home advantage and goal-rate priors) but still displays the price on the chosen pick — so a 5.0 underdog in great form can be backed over a 1.x favourite in poor form, with a "Smart pick: value bet" reason.
- **9-feature batch update (Apr 26, 2026)**:
  - **OAuth (8 providers)** — `lib/oauth-config-store.ts` (admin_settings-backed config + env fallback), `lib/oauth-providers.ts`, `app/api/auth/oauth/[provider]/start|callback`. Admin UI at `/admin/social-login` with copyable callback URLs, secret reveal, Apple Team/Key/.p8 fields. Linked from admin sidebar.
  - **Forgot/Reset password** — `lib/password-reset-store.ts` (in-memory hashed tokens, 60min TTL) + `app/api/auth/forgot-password|reset-password` routes; emails via `lib/mailer.ts`, dev mode returns the link in JSON.
  - **No mock tipsters** — `app/api/tipsters/route.ts` rewritten DB-backed (returns `[]` when no DB). Homepage uses SWR + empty fallback panel.
  - **Live Now never disappears** — `components/sections/live-matches.tsx` + `app/(main)/page.tsx` always render the Live section with friendly fallback (next 6 kickoffs) when nothing live.
  - **Hero CTA opens auth modal** — "Get Started Free" wired to `openAuthModal` instead of `/register`.
  - **Feed in main nav** — added to `components/layout/header.tsx` desktop + mobile drawer (bottom-nav already had it).
  - **Results — calendar date picker** — `app/(main)/results/page.tsx` adds "Pick a date…" option + `<input type="date">`; filters by local toDateString comparison. Empty-state hint when no results.
  - **Score accuracy** — fixed `lib/api/unified-sports-api.ts` parsing bug that turned ESPN string `"0"` into `null` (thus 3-0 → 3-null). Strict null/''/undefined check now preserves real zeros. `lib/hooks/use-matches.ts` `getFinishedMatches` also drops finished games with missing scores so no bogus 0-0 appears.
  - **Smarter AI chat** — `components/ai/ai-chat-button.tsx` now sends per-page context (path, match/tipster id from URL, document title, top H1) to `/api/ai/chat` so replies are grounded in what the user is looking at.
  - **SMS without Twilio** — `lib/sms-gateway.ts` exposes `sendSms()` (email-to-SMS via 13 carrier gateways), `whatsappLink()` and `smsLink()` UI helpers — honest fallback when carrier unknown.
- **Auth modal everywhere + admin gate (Apr 26, 2026 — late)**:
  - **Legacy /login & /register routes** (`app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`) now redirect to `/` with `?auth=login|register`. The auth-modal context (`contexts/auth-modal-context.tsx`) reads that query on mount and opens the dialog so the page background stays visible (no more full-screen white).
  - **Header Google quick-button** (`components/layout/header.tsx`): one-click Google sign-in chip for unauthenticated visitors at sm+, sits next to Login/Sign Up.
  - **Admin route is auth-gated** (`app/admin/layout.tsx` is now a server component that calls `getCurrentUser()`). Existing client UI moved to `components/admin/admin-shell.tsx`. Anyone hitting `/admin` without an admin cookie sees `components/admin/admin-login-gate.tsx` (a focused login screen). Non-admin authenticated users see a "forbidden" screen with a sign-out button. Header/profile shows the real admin name + a sign-out button.
  - **Custom admin URL** — admins can rewrite `/admin` to any path via Admin → Settings → URL Rewrites (the existing rewrite engine in `middleware.ts`).
  - **Consensus picks no longer show stale games** (`components/home/best-bets-panel.tsx`): tightened `buildBestBets` to drop matches whose kickoff was more than 4h ago AND any match whose kickoff is already in the past — protects against ESPN fixtures that linger as `scheduled` for days after they were actually played.
  - **Results — finished match cards now show date + time** (`components/matches/match-card-new.tsx` compact + default variants): instead of just an "FT" badge users can see exactly when each match was played.
- **Branding + per-page SEO + URL rewrites + login 2FA (Apr 26, 2026)**:
  - **Site-wide branding** — `lib/site-settings.ts` (cached server-side reader of `site_settings`/in-memory store) + new public `app/api/site-settings/route.ts` endpoint. `app/layout.tsx` now uses `generateMetadata` to apply the admin-managed title/description/favicon dynamically; `components/layout/header.tsx` and `app/(main)/layout.tsx` swap their hard-coded logo for the admin URL when one is set (light + optional dark variant supported).
  - **Per-page SEO editor** — Admin → Settings → SEO has a JSON-backed list of `{ path, title, description, keywords, ogImage, noIndex }` entries. Path supports exact (`/matches`) and prefix glob (`/leagues/*`). The root `generateMetadata` reads the `x-pathname` request header (set by middleware) and applies the most specific match.
  - **URL rewrites** — Admin → Settings → URL Rewrites stores `{ source, destination, permanent }` rules. Edge middleware (`middleware.ts`) fetches them via `app/api/site-settings/rewrites` (kept Node-free for the edge runtime) and issues 307/308 redirects.
  - **Two-factor auth (no paid SMS provider)** — `lib/two-factor-store.ts` issues 6-digit codes (10-min TTL, 5 attempts). Delivery uses the existing `lib/sms-gateway.ts` (free email-to-SMS carrier gateways) when the user opts in for SMS, otherwise a transactional email via `lib/mailer.ts`. Login flow: `app/api/auth/login/route.ts` returns `requiresTwoFactor: true` + `challengeId` instead of a cookie when 2FA is enabled (per-user via `app/api/account/2fa/route.ts` or site-wide via Admin → Settings → 2FA). The auth modal (`components/auth/auth-modal.tsx`) gained a code-entry step with resend support, fed by `completeTwoFactor`/`resendTwoFactor` in `contexts/auth-context.tsx`. New endpoint: `app/api/auth/login/verify-2fa/route.ts`.
  - **Live matches bug fix** — `app/api/matches/route.ts` now drops "stale-live" fixtures (still tagged live but kicked off well past the sport's max duration — soccer >3.5h, basketball >3.5h, etc.) so ESPN/SportsDB zombies never appear. `app/(main)/matches/page.tsx` skips its date-tab filter when `statusFilter === 'live'`, fixing the count-vs-cards mismatch.
- **Pre-deployment polish batch (Apr 26, 2026 — late)**:
  - **Cross-browser follow sync** (`lib/follows-store.ts`): the store no longer falls back to in-memory results when DB queries return zero rows — only when the DB throws. Following a team in browser A now appears in browser B's dashboard immediately.
  - **Maintenance mode actually applied** — new `app/api/site-settings/maintenance/route.ts` (edge-safe, public), updated `middleware.ts` to rewrite non-admin/non-api/non-login routes to `/maintenance` when `maintenance_mode=true`, new `app/maintenance/page.tsx` with the admin-controlled `maintenance_message`. Defaults added in `lib/site-settings.ts`.
  - **Team page follower count** — `app/api/teams/[id]/route.ts` returns `followersCount` via `listFollowersOfTeam`; `app/(main)/teams/[id]/page.tsx` shows "X followers" (Users icon) under the FollowTeamButton.
  - **Tipster real follow counts** — `app/api/tipsters/[id]/route.ts` augments mock baseline with real `listFollowersOfTipster` / `listFollowedTipsters` counts and exposes `realFollowers` / `realFollowing`.
  - **Best Bets sidebar — only future today's matches** (`components/home/best-bets-panel.tsx`): existing 4-hour stale + past-kickoff filters verified to drop already-kicked-off games.
  - **Match details → standalone league page** (`app/(main)/matches/[id]/page.tsx` Standings tab): added "View full table →" link to `/leagues/[slug]`.
  - **Match details Stats tab** — `app/api/matches/[id]/details/route.ts` now exposes `teamStats` + `hasTeamStats` derived from ESPN summary `boxscore.teams[].statistics`. New "Stats" tab in `app/(main)/matches/[id]/page.tsx` renders side-by-side bars (possession, shots…) for live + finished matches via `<TeamStatsTab>` and `<StatComparisonRow>` helpers.
  - **Featured tips when Live ≤ 3 + admin control** — `lib/featured-store.ts` (DB-backed via `featured_config` table, in-memory fallback). Public `app/api/featured/route.ts` resolves admin-pinned `pinnedMatchIds` first then auto-fills today's upcoming matches that pass criteria (`minConfidence`, `minOdds`/`maxOdds`, `topTipsterOnly`, `sport`, `limit`). Admin `app/api/admin/featured/route.ts` GET/POST. Admin page `app/admin/featured/page.tsx` (linked from sidebar) lets admins toggle enabled, tune criteria, pin specific match IDs, and preview live count. Homepage shows new `<FavoritedTipsPanel>` (`components/home/favorited-tips-panel.tsx`) under Live Now whenever `liveMatches.length <= 3`.
