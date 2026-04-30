# Betcheza

## Overview

Betcheza is a sports betting tipster community platform providing real-time sports data, AI-powered predictions, and a social environment for tip sharing and tracking. It aims to empower users with tools for informed betting decisions, foster community competition through leaderboards, and offer a robust platform for sports enthusiasts. The project focuses on leveraging modern web technologies for a fast, responsive, and data-rich user experience, targeting the online sports betting and tipster community markets.

## User Preferences

> # 🚨 NEVER USE POSTGRESQL — ALWAYS USE MYSQL 🚨
> **This rule has been broken three times. DO NOT do it again.**
> - The production target is a **MySQL 8+** server (`mysql://` URL).
> - Do **NOT** switch the project to PostgreSQL, Drizzle Postgres, Neon, Supabase Postgres, the Replit `postgresql-16` module driver, `pg`, or any other database.
> - Do **NOT** add the `postgresql-16` module to `.replit`, do not add `pg`/`drizzle-orm/postgres-js`/`@neondatabase/serverless`, do not generate Postgres migrations.
> - The only valid driver is `mysql2/promise` and the only valid placeholder style is `?`. SQL using `$1`/`$2` is wrong.
> - The in-memory fallback in `lib/db.ts` (when `DATABASE_URL` is not a `mysql://` URL) is **the correct dev behaviour** — do not "fix" it by switching engines.
> - If you ever feel tempted to add Postgres, **STOP** and ask the user first.

- I want iterative development.
- I prefer detailed explanations.
- Ask before making major changes.
- I prefer simple language.
- I like functional programming.
- **CRITICAL: Always use MySQL. NEVER switch to PostgreSQL or any other database without explicit user permission. The user will deploy to a live MySQL server.**
- Sport icons in `ALL_SPORTS` (lib/sports-data.ts) and `mockSports` (lib/mock-data.ts) must use emoji characters directly (e.g. '⚽', '🏀') — not text keys like 'soccer'.

## System Architecture

The Betcheza platform is built with Next.js 16 (App Router) and React 19, using TypeScript. Styling is managed with Tailwind CSS v4, shadcn/ui, and Radix UI for a modern, responsive UI/UX, including dynamic flag icons and clear visual hierarchies.

State management and data fetching are handled by SWR. Authentication uses a custom JWT implementation with `jose` and `bcryptjs`, securing user sessions via HTTP-only cookies.

The backend uses **MySQL** via the `mysql2/promise` driver, with a graceful fallback to in-memory mock data when no MySQL connection is available (e.g. Replit dev where `DATABASE_URL` is not a MySQL URL). All SQL uses `?` placeholders (MySQL style). The `lib/db.ts` module exports `query`, `queryOne`, `execute`, `getPool`, `withTransaction`, and `closePool`. `execute()` returns `mysql.ResultSetHeader` with `.insertId`. In production the app connects to a MySQL 8+ server using `DATABASE_URL`.

Key architectural decisions include:
- **Modular Project Structure**: Organized for maintainability and scalability.
- **Data Fallback Strategy**: Ensures stability when external services are unavailable.
- **AI Integration**: AI copilot for match predictions and chat, powered by OpenAI, with a local rules-based fallback.
- **Dynamic Content**: Uses server-side rendering and API routes for real-time sports data, odds, and community content.
- **Admin Dashboard**: Comprehensive management of users, matches, news, and platform settings, including social login, SEO, URL rewrites, and footer social links.
- **Sidebar League Grouping**: Organizes leagues by user's home country, international competitions, and top European leagues.
- **League ID Reconciliation**: Ensures consistent mapping between UI and data layer league IDs.
- **AI Variety**: AI chat generates genuinely different replies for similar queries using temperature, frequency, and presence penalties.
- **Notification System**: Web push and email notifications for user engagement. Admin broadcast sends in-app notifications to ALL registered users (queries `users` table) plus email to subscribers. Real-time notification bell in header (30-second polling).
- **My Bookmarks Page**: `/bookmarks` shows saved matches with filter tabs and search. Synced to DB for logged-in users, localStorage fallback for guests.
- **Season Selector in League Pages**: Dropdown lets users browse past seasons (up to 4 years back). SWR keys include `?season=` param so standings/scorers reload correctly.
- **Finished Matches Hidden**: Matches page excludes `status === 'finished'` so only live/upcoming matches appear. Results go to the Results page.
- **Expanded League Coverage**: `ALL_LEAGUES` now mirrors `ESPN_LEAGUES` with 180+ leagues across all sports including second divisions, cup competitions, women's leagues, international qualifiers, and more.
- **Two-Factor Authentication (2FA)**: Enhanced security via existing messaging channels.
- **Login Security & Captcha**: Implements rate limiting and captcha (Turnstile/reCAPTCHA or math fallback) for login and registration.
- **Branding and SEO**: Dynamic site-wide branding and per-page SEO management through an admin interface with URL rewrite middleware.
- **Team and Tipster Following**: Allows users to personalize their dashboard by following teams and tipsters.
- **Player Profiles**: Dedicated pages for player statistics and comparison features.
- **Search Functionality**: Unified search across leagues, matches, teams, and tipsters with advanced filtering.
- **Knockout Bracket UI**: Renders tournament brackets for cup competitions.
- **Locality-aware Features**: Sidebar re-orders leagues based on the user's country.
- **Smart AI Multi-market**: AI predictions incorporate lineup signals in addition to odds.
- **Match-aware AI Chat**: AI chat contextualizes responses based on the currently viewed match.
- **Wider Match Coverage**: Expanded ESPN API integration to include more leagues and women's sports.
- **Bookmark and Share**: User bookmarking via local storage and database sync, and Web Share API integration.
- **API Key Management**: Admin interface for managing external API keys (The Odds API, SportsGameOdds, OpenAI, VAPID).
- **Payment Gateway Integration**: Admin UI for configuring multiple payment methods and tipster payout settings.
- **Clean Match URLs**: Uses slugs for match IDs in URLs, resolved by API routes.
- **Dynamic Bookmaker Comparison**: Enriches bookmaker odds with data from SportsGameOdds and provides deep links.
- **Optimized Live Data**: `keepPreviousData` for SWR prevents flickering of live match data.
- **Sport-specific UI**: Lineup graphics adapt to the sport (e.g., football pitch for soccer, roster cards for others).
- **Internal News Reader**: News articles open within the platform, with an option to read on ESPN.
- **Clickable H2H Meetings**: Past head-to-head fixtures link to their respective match detail pages.
- **Tipster Catalogue & Compare**: 100 deterministic seeded tipsters (Africa-themed names, hidden `is_fake` flag) populate the public feed when the DB is empty. New `/tipsters/compare` page lets users pick up to 4 tipsters for a side-by-side stats comparison with per-metric "best" highlighting. Tipsters list redesigned with paging, search, sort, multi-select, and a floating compare bar.
- **Role & Permission System** (`lib/permissions.ts`): Five roles — `admin`, `moderator`, `editor`, `tipster`, `user` — each with a fine-grained permission map (`hasPermission`/`canAccessAdmin`). Admin layout gates entry on `admin.access`; admin Users page uses an inline role selector with colour-coded badges; `/api/admin/users PATCH` writes role overrides.
- **Auto-tip Cron**: `GET /api/cron/auto-tips` (with `?dry=1` for preview) picks fake tipsters per upcoming match weighted by league tier, posts plausible tips using only the real bookmaker odds attached to the match (never invented numbers). Reusable from the admin "Plan auto-tips" button.
- **Persistent Follows** (`lib/follows-store.ts`): Followed teams and tipsters are persisted to `.local/state/follows.json` so they survive server restarts. The store still falls back gracefully to MySQL when `DATABASE_URL` is a real `mysql://` URL. The user dashboard reads from the same store so followed entities always reappear.
- **Auto-tips Persistence** (`lib/auto-tips-store.ts`): A keyed (matchId+tipsterId), deterministic GeneratedTip store persisted to `.local/state/auto-tips.json`. Seeded lazily by both the match-detail Tips tab (`/api/matches/[id]/tips`) and the tipster profile (`/api/tipsters/[id]`), using each match's real markets/odds. Selections, stake and analysis are deterministic per (match, tipster) hash so refreshing never re-shuffles tips.
- **Tipster Profile** (`/tipsters/[id]`): Public profile page shows the fake-tipster catalogue entry with avatar, ROI badge, Follow CTA (wired to the persistent follows store), an inline ROI sparkline (14-pt deterministic series ending at the tipster's actual ROI) and a Recent Tips feed sourced from the auto-tips store on real matches.
- **Real-data Admin Dashboard** (`/api/admin/dashboard` + `/admin`): Admin home now reads live data — combined real users + fake tipsters in Recent Users (with FAKE badge), Recent Predictions from the auto-tips store, top tipsters ranked by ROI, and live activity from real comments/follows/auto-tips. SWR refreshes every 30s. Endpoint is gated by `admin.access`.
- **Tipster slug URLs** (`lib/utils/slug.ts` → `tipsterHref`): All in-app links to a tipster route now read like `/tipsters/aceaftipper` (username slug) instead of numeric ids. The `/api/tipsters/[id]` endpoint resolves id, username, and slug interchangeably.
- **Clean match URLs** (`lib/utils/match-url.ts` → `matchIdToSlug`): Every component links to matches via the league-prefixed slug (`/matches/eng-737421`), never the raw `espn_*` id. Adopted across the homepage, search, live-matches, teams, tipster profiles, knockout brackets, admin dashboard, and the match-reminder cron.
- **Real comments + likes per tip** (`lib/tip-engagement-store.ts`, `app/api/tips/[id]/like`, `app/api/tips/[id]/comments`): Likes and comments persist per tip; the match-detail TipCard renders them inline with collapsible threads.
- **Competitions with real participants** (`lib/competitions-store.ts`, `app/api/competitions`, `app/(main)/competitions/[slug]/page.tsx`, `app/admin/competitions/page.tsx`): Five seeded competitions with deterministic leaderboards drawn from the fake-tipster catalogue (composite ROI/win-rate score). Per-competition detail page with `generateMetadata` for SEO; admin list view in compact table.
- **Joinable competitions + admin CRUD** (`lib/competitions-store.ts` mutations, `app/api/competitions/[slug]/join`, `app/api/admin/competitions`, `components/competitions/join-competition-button.tsx`): The "Join Competition" CTA on the public detail page is now a real client-side action that posts to `/api/competitions/[slug]/join`, opens the auth modal for guests, and shows "Joined" once successful. Admin Competitions page has a Create form (POST) and per-row Delete (DELETE) — built-in seeded competitions are protected. New competitions and join state are persisted to `.local/state/competitions.json` so they survive restarts and surface immediately on the public page.
- **Community feed seeded from real matches** (`lib/feed-store.ts → seedDemoPostsFromRealMatches`): The community feed is seeded asynchronously by pulling real upcoming matches from `getUpcomingMatches()` and authoring posts with the actual home/away/league names plus the real `matchId` set, so every seeded post deep-links to the correct `/matches/[slug]` page (no more mock teams).
- **Recommended Tipsters from real ranking** (`app/api/feed/recommended-tipsters`): Replaces the previously hardcoded "FEATURED" set — now ranks all fake tipsters by a composite ROI × win-rate × streak × followers score and returns the top six.
- **Real-data leaderboard** (`app/(main)/leaderboard/page.tsx`): Fetches `/api/tipsters` and ranks tipsters by deterministic per-period scaling (daily/weekly/monthly/all-time) with avatars, podium and full table.
- **Enriched /predictor**: AI Match Predictor page now has a 4-tile stat strip (accuracy, markets, AI calls, response time), a Recent Predictions sample grid and an FAQ accordion for SEO long-tail.
- **SEO metadata**: `generateMetadata` layouts cover `/predictor`, `/feed`, `/bookmarks`, `/leaderboard`, `/tipsters`, `/matches`, `/competitions`, and per-competition pages. Titles/descriptions pull from site_settings where available.
- **Expanded match coverage**: ESPN per-league + ESPN global + football-data.org + OpenLigaDB + TheSportsDB + FotMob (7-day window, 80 matches/league cap). Total ~2.6k matches/day. Note: Sofascore / livescore.com / scorebat all block server-to-server fetches with 403 from Replit IPs, so they cannot be added without a paid proxy or commercial feed; daily counts are bounded by what free unblocked sources actually publish.
- **Paid competition entry**: `JoinCompetitionButton` reads `useAuth()` (was using stale SWR `/api/auth/me`, which caused login-loop). For competitions with `entryFee > 0` it opens `CompetitionPaymentModal` (M-Pesa STK / Card / Wallet tabs); the modal posts to `POST /api/payments/competition-entry` (returns `{ success, reference }`) and on success calls the join API with `{ paymentRef }`. `POST /api/competitions/[slug]/join` now returns 402 if a paid competition is joined without a `paymentRef`.
- **Bug fixes (Apr 30 2026)**: Hardened all `h2h.slice(...)` calls against `null` from cold caches: `components/matches/match-facts.tsx` and `app/(main)/matches/[id]/page.tsx` now wrap with `Array.isArray(h2h) ? h2h : []` before slicing.
- **Wallet ledger** (`lib/wallet-store.ts`, `app/api/wallet/*`, `app/(main)/dashboard/wallet/page.tsx`): Persistent per-user wallet at `.local/state/wallets.json` with balances + transaction history. Endpoints: `GET /api/wallet` (balances+txns), `POST /api/wallet/deposit`, `POST /api/wallet/withdraw`. The competition entry endpoint (`/api/payments/competition-entry`) actually `debit()`s the wallet on `method='wallet'` and returns 402 with the latest balance on insufficient funds. The `/dashboard/wallet` page provides Deposit (M-Pesa / Card / Bank / Crypto), Withdraw (M-Pesa / Bank / PayPal / Crypto) and History tabs. The competition payment modal now fetches the live balance, disables the Pay button + shows a Top Up CTA when funds are insufficient — fixing the "wallet method joined paid competition with zero balance" bug.
- **Email templates store** (`lib/email-templates-store.ts`, `app/api/admin/email-templates`, `app/admin/email-templates/page.tsx`): JSON-persistent admin-editable templates for `subscriber_welcome`, `broadcast`, `password_reset`, `competition_join`, `prize_payout`, `tipster_application`. `{{var}}` substitution via `renderTemplate()`. The subscribe + broadcast routes now render through these templates with graceful fallback to legacy hardcoded HTML. Admin UI has subject/HTML/text editors + an iframe preview with sample variables.
- **Batched bulk email** (`lib/mailer.ts → sendBulkMailBatched`): Bulk send chunks recipients (default 25 per batch), spaces individual sends (80ms) and pauses between batches (1s) to stay under SMTP rate limits. The admin broadcast endpoint accepts `batchSize`, `perEmailDelayMs`, `perBatchDelayMs` overrides for very large lists.
- **Multi-provider M-Pesa** (`app/api/admin/payment-gateways/route.ts`): Added `mpesa-payhero`, `mpesa-pesapal`, `mpesa-intasend` alongside the existing Daraja entry, each with their own credential schema and fee profile. Admins can enable/configure them from `/admin/payment-gateways`.
- **Infinite scroll on matches** (`app/(main)/matches/page.tsx`): Renders the first 40 matches and grows the window via `IntersectionObserver` + a sentinel with a 400px rootMargin. Resets on filter change. Avoids the long-page jank when listing 200+ matches across leagues.
- **Tennis fetch cache fix** (`lib/api/unified-sports-api.ts`): ESPN tennis (ATP/WTA) and golf scoreboard responses regularly exceed Next.js's 2MB data-cache limit, causing "Failed to set fetch cache" warnings. The fetcher now uses `cache: 'no-store'` for those sports — our in-memory cache layer (`setCache`/`getCache`) still handles dedupe + TTL.
- **Sidebar matches count fix** (`lib/hooks/use-matches.ts`): `getTodayMatches` now uses `toLocalISODate` and excludes finished/cancelled/postponed matches, matching the matches-page filter so the sidebar count and the page count agree.

## External Dependencies

- **OpenAI**: AI-powered match predictions and conversational features.
- **ESPN Public API**: Real-time sports scores and match data.
- **The Odds API**: Multi-bookmaker odds comparisons.
- **TheSportsDB**: Supplemental data for events, especially smaller leagues.
- **flagcdn.com**: Provides flag icons.
- **SportsGameOdds**: Provides additional bookmaker lines and outrights.
- **Various Email-to-SMS Carrier Gateways**: For SMS notifications.