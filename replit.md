# BetTips Pro (Betcheza)

## Overview

BetTips Pro is a comprehensive sports betting tipster community platform designed to provide users with real-time sports data, AI-powered predictions, and a social environment for sharing and tracking betting tips. It aims to empower users with tools for informed betting decisions, foster a competitive community through leaderboards, and offer a robust platform for sports enthusiasts. The project leverages cutting-edge web technologies to deliver a fast, responsive, and data-rich user experience, with a focus on market potential in the online sports betting and tipster community sectors.

## User Preferences

- I want iterative development.
- I prefer detailed explanations.
- Ask before making major changes.
- I prefer simple language.
- I like functional programming.

## System Architecture

The BetTips Pro platform is built with Next.js 16 (App Router) and React 19, utilizing TypeScript for robust development. Styling is managed with Tailwind CSS v4, complemented by shadcn/ui and Radix UI for a modern and consistent user interface. The UI/UX focuses on intuitive navigation and data presentation, including responsive layouts for various devices, dynamic flag icons, and clear visual hierarchies for match details, odds, and tipster performance.

State management and data fetching are handled by SWR, ensuring efficient and up-to-date information. Authentication uses a custom JWT implementation with `jose` and `bcryptjs`, securing user sessions via HTTP-only cookies.

The backend infrastructure primarily uses MySQL via `mysql2`, with a graceful fallback to mock data for development or disconnected environments. This fallback strategy extends to AI services and external sports APIs, ensuring core functionality even when external dependencies are unavailable.

Key architectural decisions include:
- **Modular Project Structure**: Organized into `app/`, `components/`, `lib/`, and `scripts/` for maintainability and scalability.
- **Data Fallback Strategy**: Ensures app stability and usability even when external services (database, AI, sports APIs) are unreachable.
- **AI Integration**: Features an AI copilot for match predictions and chat, powered by OpenAI, with a local rules-based fallback for resilience.
- **Dynamic Content**: Extensive use of server-side rendering and API routes to deliver real-time sports data, odds, and community-generated content.
- **Admin Dashboard**: A dedicated interface for comprehensive management of users, matches, news, and platform settings, including social login configurations, SEO, URL rewrites, and footer **Social Links** (per-platform toggle + URL stored as `social_links` JSON in `site_settings`, exposed publicly via `/api/site-settings.socialLinks` and rendered in the footer).
- **Sidebar League Grouping**: The left sidebar surfaces three distinct sections — (1) the visitor's home country (only when leagues from that country have matches today), (2) International / continental competitions like AFCON, CAF Champions/Confederation Cup, UEFA Champions/Europa/Conference League, Copa Libertadores, FIFA CWC (only when matches today), and (3) Europe's Top 5 (Premier League, La Liga, Bundesliga, Serie A, Ligue 1) which are always shown.
- **League ID Reconciliation**: `ALL_LEAGUES` (UI) IDs are aligned with `ESPN_LEAGUES` (data layer) so that league pages always pull the correct standings/scorers (e.g. CAF Confederation Cup is now ID 103, not 34, which previously collided with Thai League 1). Leagues without ESPN coverage use IDs in the 9000+ range to avoid future collisions.
- **AI Variety**: `/api/ai/chat` injects a per-request angle directive plus a current timestamp into the system prompt and uses `temperature: 0.85` with `frequency_penalty` and `presence_penalty` so identical questions on the same match still yield genuinely different replies.
- **Notification System**: Implements web push and email notifications for user engagement, with administrative broadcast capabilities.
- **Two-Factor Authentication (2FA)**: Supports 2FA for enhanced security, leveraging existing messaging channels (email-to-SMS, transactional email).
- **Login Security & Captcha**: `/api/auth/login` and `/api/auth/register` are gated by `lib/rate-limit.ts` (in-process per-IP + per-(email,IP) buckets — 20 logins / 5min, 5 signups / 1h, hard lock after 10 failures) and `lib/captcha.ts`, which auto-selects Cloudflare Turnstile (`TURNSTILE_SECRET_KEY`) → Google reCAPTCHA (`RECAPTCHA_SECRET_KEY`) → server-issued math fallback. The auth modal renders `<CaptchaChallenge>` (always-on for signup, after 3 failed login attempts otherwise). Math challenges live in-memory and are issued/consumed via `/api/captcha/challenge`. Database tables `login_attempts`, `account_lockouts`, `captcha_challenges`, `user_bookmarks` are added to `scripts/setup-database-consolidated.sql`.
- **Branding and SEO**: Dynamic site-wide branding and per-page SEO management through an admin interface, with middleware for URL rewrites.
- **Team and Tipster Following**: Allows users to follow teams and tipsters, personalizing their dashboard experience.

## Recent Changes

### Batch 3 — Player Profiles & Dashboard Buildout (April 28, 2026)
- **Player profile page** (`app/(main)/players/[id]/page.tsx`) — now sports a top-bar with a "Compare with another player" CTA that deep-links into the new compare flow with the current player pre-selected.
- **Player compare page** (`app/(main)/players/compare/page.tsx`) — fully client-side compare view that fetches two players via `/api/players/:id`, flattens their stats into a unified label map, groups rows by stat category, and highlights which side wins each numeric stat. Supports picking players via the unified search typeahead or pasting a numeric ESPN athlete id. Vital-stats card covers position, team, age, height, weight, nationality, and experience.
- **Clickable players in top-scorers**: League page top-scorers list (`app/(main)/leagues/[slug]/page.tsx`) and the standalone Stats page (`app/(main)/stats/page.tsx`) now wrap rows with `Link` to `/players/{id}` whenever an athlete id is available, with hover styling. Falls back to a non-clickable row when ESPN doesn't surface an id.
- **Dashboard API expansion** (`app/api/dashboard/route.ts`) — fetches followed-tipster details + recent tips from `/api/tipsters/:id?includeStats=false` in parallel with team data, returns a flattened `recentTips` feed sorted by recency, a `tipsters` summary array, and a `stats` block (teams/tipsters followed, win rate across followed tipsters, average ROI, recent W/L/pending counts).
- **Dashboard UI buildout** (`app/(main)/dashboard/page.tsx`) — added a 4-card stats summary banner, a new "Following tipsters" grid (TipsterCard with avatar, win-rate / ROI / total-tips trio plus a flame badge for ≥3-tip streaks), and a "Latest tips from your tipsters" feed (FeedTipCard showing tipster, market, selection, odds, confidence, status pill, plus a deep-link to the match). Empty state now welcomes both team-only and tipster-only users with two CTAs.

### Batch 2 — Search, Brackets & Logo Fallbacks (April 28, 2026)
- **Header search typeahead** — `/api/search` returns leagues, matches, teams, and tipsters scored against the query; `components/layout/header-search.tsx` adds a debounced (200 ms) dropdown with arrow-key + Enter + Esc keyboard navigation, grouped sections, TeamLogo / LeagueLogo / avatar previews, and gracefully falls back if the DB is unreachable for the tipsters lookup.
- **Knockout bracket UI** — `app/api/leagues/[id]/bracket/route.ts` parses ESPN scoreboard `notes[0].headline` into R64 → Final, pairs two-legged ties by sorted team-id key, computes aggregate scores respecting the leg-1 home convention, and fetches a ±9/+6 month window in parallel via `Promise.allSettled`. `components/leagues/knockout-bracket.tsx` renders a horizontal column-per-round layout with TieCard showing aggregate + per-leg scores; silently renders nothing for non-cup leagues.
- **TeamLogo small-league fallback** — `components/ui/team-logo.tsx` accepts an optional `countryCode` prop and overlays a small `FlagIcon` chip in the bottom-right of the initials avatar so users still get a visual cue when ESPN has no crest for an obscure team.

### Locality, Smart AI & Match-Lookup Fixes (April 26, 2026 — later)
- **"Match not found" eliminated**: Two fixes in `lib/api/unified-sports-api.ts`:
  1. `getEspnLeagueConfigForId` / `getEspnEventIdFromMatchId` regexes now allow dots in the league key (`[a-z0-9.]+`) so IDs like `espn_ita.1_737118`, `espn_uefa.champions_xxx`, and `espn_conmebol.libertadores_xxx` parse correctly.
  2. `getMatchById` falls back to `fetchESPNSummary(...)` and reconstructs a `UnifiedMatch` from the summary header when the match isn't in the current rolling scoreboard window — covering older fixtures, distant-future games, and H2H links. Fast-path errors no longer skip the fallback.
- **Sidebar respects user country**: `components/layout/sidebar-new.tsx` reads `useUserCountry()` and re-orders the top-leagues list using a `COUNTRY_REGION` map (e.g. KE/UG/TZ users see KPL, Uganda Premier, NPFL before EPL/La Liga). Falls back to default tier ranking when country is unknown.
- **Smarter AI multi-market**: `components/ai/ai-multi-market.tsx` now defaults `mode` to `'smart'` (was `'odds'`) and accepts a `lineups` prop. The smart engine adds a lineup signal `(starters * 0.3) - (injuries * 1.2)` to each side's raw score so confirmed starters / late absences shift confidence — not just odds. The match-detail page passes lineups from `data.lineups`.
- **AI chat aware of the open match**: `app/api/ai/chat/route.ts` parses the page-context `Viewing match id: …`, calls `getMatchById`, and injects a structured `CURRENT MATCH` block (teams, league, status, kickoff, odds, both forms, both records, venue) into the system prompt. The system prompt also gained explicit "be SMART, not generic" rules: cite real numbers, give concrete reasons, name confidence and market, never tell the user to "check the match page".

### Coverage Expansion (April 28, 2026)
- **ESPN /all/scoreboard catch-all** (`lib/api/unified-sports-api.ts`): Added `fetchESPNGlobalSport`/`fetchESPNGlobalAll` that pulls the global per-sport scoreboard (soccer, basketball, tennis, baseball, hockey, rugby, mma) for a 3-day window. Surfaces leagues NOT in our explicit `ESPN_LEAGUES` config — e.g. Saudi Pro League, KNVB Beker, US Open Cup, Copa Libertadores, AFC Champions League Two, EFL League One/Two, Scottish Championship, Argentine Primera B, Indonesian/Malaysian/Ugandan Super Leagues, Indian Super League. Uses a curated `KNOWN_GLOBAL_LEAGUES` map plus `season.slug` parsing (e.g. "2025-26-saudi-pro-league" → "Saudi Pro League") to derive friendly competition names without expensive per-event lookups. Match IDs use the `espn_global<leagueId>_<eventId>` shape.
- **Search filters out finished matches** (`app/api/search/route.ts`): Match hits in the header typeahead now skip `finished`, `cancelled`, and `postponed` games so users searching for a fixture only see upcoming or live ones.
- **Women's teams in search** (`app/api/search/route.ts`): Removed the women's regex from `TEAM_NOISE_PATTERNS` so "Arsenal Women", "Chelsea Women" etc. surface alongside the men's senior side. Also added a query normaliser that strips trailing `women|wfc|fem(eni)?|ladies|lfc|ddl` so typing "arsenal women" still finds the Arsenal team page (which already pulls women's matches across all competitions).
- **Bookmark + Share buttons wired** (`app/(main)/matches/[id]/page.tsx`): The bookmark icon now persists state to `localStorage` (key `betcheza:bookmarks`, capped at 200 entries) and, when the user is signed in, syncs to a new `bookmarks` MySQL table via `POST/DELETE /api/bookmarks`. The share icon uses the Web Share API on mobile/PWA and falls back to copying the page URL to the clipboard on desktop, with a transient "Link copied" toast.
- **`/api/bookmarks` endpoint** (`app/api/bookmarks/route.ts`): GET/POST/DELETE backed by an auto-created `bookmarks(user_id, match_id, created_at)` table. Returns 401 when unauthenticated; gracefully no-ops on the persisted side when no DB is configured (localStorage stays the source of truth in that case).
- **Admin → API Keys tab** (`app/admin/settings/page.tsx`): New tab in `/admin/settings` for rotating `THE_ODDS_API_KEY`, `SPORTSGAMEODDS_API_KEY`, `OPENAI_API_KEY`, and the VAPID push key trio without redeploy. Inputs are password-masked with a Show/Hide toggle. New helper `lib/api-keys.ts` (`getApiKey(key)`) reads admin DB overrides first then falls back to env vars. `fetchTheOddsAPI` and `buildRealOddsIndex` in `lib/api/unified-sports-api.ts` now use this helper.
- **SportsGameOdds adapter** (`lib/api/sportsgameodds.ts`): Wraps `https://api.sportsgameodds.com/v2` with `getSgoBookmakerLines(home, away, isoDate, hasDraw)` and `getSgoOutrights(leagueId)`. Auto-discovers per-bookmaker decimal odds AND deeplinks (FanDuel, DraftKings, ESPN BET, Bovada, BetMGM, Caesars, William Hill, bet365, Betway, 888sport, Paddy Power, LiveScore Bet, Sportsbet, Polymarket, ...). 5-minute in-process cache; 30-minute back-off on 401/403/429.
- **Bookmaker comparison enriched** (`app/api/matches/[id]/details/route.ts`): After ESPN's `pickcenter`/`odds` provide the ESPN-side bookmaker rows, we now also probe SGO and append any books ESPN didn't already cover. The match-detail UI gained a `links?` field on `BookmakerOdd` and renders a green "Bet now →" button per row when a deeplink is available (`app/(main)/matches/[id]/page.tsx`). Links are `rel="nofollow noopener sponsored"`.
- **Outright winners enriched** (`lib/api/unified-sports-api.ts` → `getLeagueOutrights`): Now combines The Odds API outrights with SGO outrights (de-duped by `(market name, top outcome)`). The outright outcome type gained a `link?` field and the league sidebar (`app/(main)/leagues/[slug]/page.tsx`) renders a small "Bet" pill next to each price when SGO supplies a deeplink.

### Known TODO (next iteration)
- **Web push notifications**: Admin UI is in place (`/admin/settings → API Keys → VAPID`) but the service worker, `/api/push/subscribe`, and the publisher endpoint that calls `web-push` are not yet wired. Generate a VAPID pair via `npx web-push generate-vapid-keys` and paste it in the API Keys tab to enable.
- **FlashScore / LiveScore scrapers**: Intentionally NOT implemented — both sites have explicit ToS prohibitions and Cloudflare bot protection. Coverage is expanded via ESPN catch-all + SGO instead.

### Match-Detail & Live Section Fixes (April 26, 2026)
- **Live row no longer flickers**: Added `keepPreviousData: true` to `useLiveMatches` and `useMatches` SWR configs so the home page's "Live Now" section keeps showing the live marquee during the 10-second background refresh instead of flashing to the "no live games right now" empty panel (`lib/hooks/use-matches.ts`).
- **Sport-specific lineups**: The football pitch graphic in the match detail Lineups tab is now rendered only for soccer/football/rugby. Other sports (basketball, baseball, NFL, NHL, etc.) display roster cards only — the misleading pitch is hidden (`app/(main)/matches/[id]/page.tsx`).
- **News opens on our own site**: News rows in the match detail page link to a new internal article reader at `/news/article` (with metadata passed via URL params) instead of jumping straight to ESPN. The reader still offers a "Read on ESPN" button for the full piece (`app/(main)/news/article/page.tsx`, NewsRow in match detail).
- **H2H meetings clickable**: Past head-to-head fixtures expose a `matchId` from the API and the expanded H2H row now offers a "View this match's full details" link that opens the previous meeting's match detail page (`app/api/matches/[id]/details/route.ts` buildH2HFallback, H2HRow in match detail).
- **Standings logos by sport**: The standings table fallback CDN URL is now sport-aware (soccer → soccer, basketball → nba, baseball → mlb, football → nfl, hockey → nhl) so non-soccer leagues stop falling back to placeholder circles.
- **More matches**: Priority leagues now pull a 14-day window (was 7) and smaller leagues a 28-day window (was 21), so weekly/biweekly fixtures are no longer dropped from the matches list (`lib/api/unified-sports-api.ts`).

### Pre-launch Fixes (April 2026)
- **AI Chat**: Fixed model name from non-existent `gpt-5` to `gpt-4o-mini`. Chat now calls OpenAI API via Replit integration.
- **Lineup Component** (`components/matches/lineups.tsx`): Rebuilt to accept real ESPN data via props instead of hardcoded mock data.
- **Clean Match URLs**: Match IDs (`espn_ita.1_737421`) are now encoded as clean slugs (`ita1-737421`) in all URLs. Utility: `lib/utils/match-url.ts`. All match cards, home page, dashboard, and embedded links updated.
- **Match URL API resolution**: The `/api/matches/[id]/details` and `/api/matches/[id]/tips` routes both resolve clean slugs back to full ESPN IDs before fetching.
- **Payment Gateway Admin Page** (`/admin/payment-gateways`): Full admin UI for configuring 9 payment methods (Stripe, PayPal, Mpesa, MTN Mobile Money, Orange Money, Flutterwave, Paystack, Bank Transfer, Crypto) with per-country settings and API credential management. API route: `/api/admin/payment-gateways`.
- **Admin Navigation**: Added "Payment Gateways" link to the admin sidebar.
- **Tipster Payout Settings** (`/dashboard/payment-settings`): Full UI for tipsters to add and manage payout methods (PayPal, Bank, Mobile Money, Crypto, Stripe). Link shown in dashboard for tipster/admin users.
- **Database fix** (`lib/db.ts`): Removed hardcoded `isDevelopment` guard that prevented MySQL connections in dev mode. DB now connects whenever `DATABASE_URL` is set.
- **Timezone**: Match times already use `getBrowserTimezone()` throughout.

## External Dependencies

- **OpenAI**: For AI-powered match predictions and conversational AI features.
- **ESPN Public API**: Provides real-time sports scores and match data.
- **The Odds API**: Delivers multi-bookmaker odds comparisons.
- **TheSportsDB**: Used for pulling today's events, especially for smaller leagues.
- **flagcdn.com**: Provides PNG flag icons for improved visual consistency.
- **Various Email-to-SMS Carrier Gateways**: Utilized by `lib/sms-gateway.ts` for sending SMS notifications without direct Twilio integration.