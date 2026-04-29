# BetTips Pro

## Overview

BetTips Pro is a sports betting tipster community platform providing real-time sports data, AI-powered predictions, and a social environment for tip sharing and tracking. It aims to empower users with tools for informed betting decisions, foster community competition through leaderboards, and offer a robust platform for sports enthusiasts. The project focuses on leveraging modern web technologies for a fast, responsive, and data-rich user experience, targeting the online sports betting and tipster community markets.

## User Preferences

- I want iterative development.
- I prefer detailed explanations.
- Ask before making major changes.
- I prefer simple language.
- I like functional programming.

## System Architecture

The BetTips Pro platform is built with Next.js 16 (App Router) and React 19, using TypeScript. Styling is managed with Tailwind CSS v4, shadcn/ui, and Radix UI for a modern, responsive UI/UX, including dynamic flag icons and clear visual hierarchies.

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

## External Dependencies

- **OpenAI**: AI-powered match predictions and conversational features.
- **ESPN Public API**: Real-time sports scores and match data.
- **The Odds API**: Multi-bookmaker odds comparisons.
- **TheSportsDB**: Supplemental data for events, especially smaller leagues.
- **flagcdn.com**: Provides flag icons.
- **SportsGameOdds**: Provides additional bookmaker lines and outrights.
- **Various Email-to-SMS Carrier Gateways**: For SMS notifications.