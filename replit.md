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
