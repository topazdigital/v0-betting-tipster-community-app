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
- **Admin Dashboard**: A dedicated interface for comprehensive management of users, matches, news, and platform settings, including social login configurations, SEO, and URL rewrites.
- **Notification System**: Implements web push and email notifications for user engagement, with administrative broadcast capabilities.
- **Two-Factor Authentication (2FA)**: Supports 2FA for enhanced security, leveraging existing messaging channels (email-to-SMS, transactional email).
- **Branding and SEO**: Dynamic site-wide branding and per-page SEO management through an admin interface, with middleware for URL rewrites.
- **Team and Tipster Following**: Allows users to follow teams and tipsters, personalizing their dashboard experience.

## Recent Changes

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