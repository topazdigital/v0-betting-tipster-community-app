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

The backend uses **PostgreSQL** via the `pg` driver (Replit's built-in PostgreSQL database), with a graceful fallback to mock data for development or disconnected environments. This fallback strategy extends to AI services and external sports APIs to ensure core functionality. The `DATABASE_URL` environment variable is automatically set by Replit. SQL queries use `?` placeholders (auto-converted to `$N` for PostgreSQL by the query helper).

Key architectural decisions include:
- **Modular Project Structure**: Organized for maintainability and scalability.
- **Data Fallback Strategy**: Ensures stability when external services are unavailable.
- **AI Integration**: AI copilot for match predictions and chat, powered by OpenAI, with a local rules-based fallback.
- **Dynamic Content**: Uses server-side rendering and API routes for real-time sports data, odds, and community content.
- **Admin Dashboard**: Comprehensive management of users, matches, news, and platform settings, including social login, SEO, URL rewrites, and footer social links.
- **Sidebar League Grouping**: Organizes leagues by user's home country, international competitions, and top European leagues.
- **League ID Reconciliation**: Ensures consistent mapping between UI and data layer league IDs.
- **AI Variety**: AI chat generates genuinely different replies for similar queries using temperature, frequency, and presence penalties.
- **Notification System**: Web push and email notifications for user engagement and administrative broadcasts.
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

## External Dependencies

- **OpenAI**: AI-powered match predictions and conversational features.
- **ESPN Public API**: Real-time sports scores and match data.
- **The Odds API**: Multi-bookmaker odds comparisons.
- **TheSportsDB**: Supplemental data for events, especially smaller leagues.
- **flagcdn.com**: Provides flag icons.
- **SportsGameOdds**: Provides additional bookmaker lines and outrights.
- **Various Email-to-SMS Carrier Gateways**: For SMS notifications.