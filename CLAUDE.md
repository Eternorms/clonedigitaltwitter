# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Clone Digital Twitter is a content management tool for automated Twitter posting. It uses Gemini AI for content generation, Twitter OAuth 1.0a for publishing, and Telegram for notifications. Frontend dashboard is functional with Supabase integration; backend needs real credentials and deploy.

**Language:** Documentation and UI strings are in **Portuguese (pt-BR)**.

## Architecture

```
Cloudflare Pages              Supabase
+---------------------+      +-----------------------------+
| Next.js 14          |      | Auth (email/password)       |
| @supabase/ssr       |----->| PostgreSQL (5 tables + RLS) |
| Tailwind CSS v3     |      | Storage (post-images)       |
+---------------------+      | Edge Functions (Deno):      |
                              |   generate-post (Gemini)    |
                              |   publish-post (Twitter)    |
                              |   sync-rss                  |
                              |   telegram-webhook          |
                              | pg_cron (scheduling)        |
                              | Realtime                    |
                              +-----------------------------+
```

**Two directories:**
- **`dashboard/`** — Next.js 14 App Router, TypeScript, Tailwind CSS v3, `@supabase/ssr`
- **`supabase/`** — 11 SQL migrations, 5 Edge Functions (Deno/TypeScript), shared rate-limit + twitter-auth utils

The Python backend (`api/`) and Docker infra (`infra/`) were removed in the Supabase migration.

## Development Commands

### Dashboard
```bash
cd dashboard
npm run dev              # Dev server at localhost:3000
npm run build            # Production build
npm run lint             # ESLint
npm run pages:build      # Cloudflare Pages build
npm run pages:deploy     # Deploy to Cloudflare Pages
```

### Supabase
```bash
supabase login
supabase link --project-ref PROJECT_REF
supabase db push                            # Apply all migrations
supabase functions deploy generate-post     # Deploy single Edge Function
supabase functions logs generate-post       # View function logs
supabase secrets set KEY=value              # Set Edge Function secrets
```

## Frontend Structure

Route groups with middleware auth guard (redirects unauthenticated to `/login`, authenticated away from auth pages):

- **`(auth)/`** — `/login`, `/register`, `/auth/callback`
- **`(dashboard)/`** — `/dashboard`, `/queue`, `/sources`, `/analytics`, `/settings`, `/persona`

Components organized by domain: `ui/` (Button, Card, Modal, Badge, Toast, etc.), `layout/` (Sidebar, MainContent), `dashboard/`, `queue/`, `persona/`, `sources/`.

### Data Layer (`src/lib/`)
- **`supabase/client.ts`** — Browser Supabase client
- **`supabase/server.ts`** — Server-side Supabase client (cookies-based)
- **`supabase/queries.ts`** — Read operations (posts, personas, sources, analytics)
- **`supabase/mutations.ts`** — Write operations (approve, reject, schedule, publish, CRUD)
- **`supabase/realtime.ts`** — Realtime subscriptions
- **`supabase/database.types.ts`** — Generated Supabase types
- **`contexts/PersonaContext.tsx`** — Active persona state (React Context)
- **`contexts/ToastContext.tsx`** — Toast notifications

## Database Tables (Supabase)

- **profiles** — User data (linked to `auth.users` via trigger)
- **personas** — Digital identities per user (name, handle, emoji, description, tone, topics, last_tweet_fetch_at)
- **posts** — Posts with status enum (`pending`/`approved`/`rejected`/`scheduled`/`published`), source, metrics
- **activities** — Activity log
- **rss_sources** — Configured RSS feeds with sync status
- **cached_tweets** — Cached tweets from Twitter API v2 per persona (tweet_id, text, engagement metrics)

All tables have RLS policies scoped to `auth.uid()`. PostgreSQL enums: `post_status`, `post_source`, `source_status`, `activity_type`.

## Edge Functions

| Function | Purpose | Rate Limit |
|----------|---------|------------|
| `generate-post` | AI content generation via Gemini API (with optional tweet style injection) | 10 req/min |
| `fetch-tweets` | Fetch and cache tweets from Twitter API v2 (incremental via since_id) | 5 req/hour |
| `publish-post` | Publish to Twitter via OAuth 1.0a | 30 tweets/15min |
| `sync-rss` | Fetch and process RSS feeds | 20 syncs/min |
| `telegram-webhook` | Telegram bot notifications | — |

Rate limiting shared via `supabase/functions/_shared/rate-limit.ts`. Twitter OAuth 1.0a shared via `supabase/functions/_shared/twitter-auth.ts`.

## AI Models

Currently **Gemini only** (Google AI Studio). Available models defined in `src/types/index.ts`:
- `gemini-2.0-flash` (default, fast)
- `gemini-2.0-flash-lite` (ultra-fast, high volume)
- `gemini-1.5-pro` (highest quality)
- `gemini-1.5-flash` (balanced)

User can select preferred model in Settings.

## Design System: "Clean Studio"

Full spec in `dashboard/DESIGN_SYSTEM.md`. Key rules:

- **Font:** Manrope (400-800 weights) via Google Fonts
- **Never use `#000000`** — use `slate-900` (#0f172a) as black
- **Pop colors:** amber-400 (pending), sky-400 (info), green-400 (success), red-400 (error), purple-400 (decorative)
- **Corners:** Cards `rounded-2xl`, buttons/inputs `rounded-xl`
- **Shadows:** `shadow-soft` at rest, `shadow-hover` on hover — never aggressive
- **Icons:** lucide-react exclusively
- **Icon hover pattern:** light bg + colored icon → solid bg + white icon

Custom tokens in `dashboard/tailwind.config.ts` (colors.black, colors.pop, boxShadow.soft/hover).

## Environment Setup

### Dashboard (`dashboard/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Edge Function Secrets (set via Supabase Dashboard or CLI)
- `GEMINI_API_KEY` — Google AI Studio (required)
- `TWITTER_API_KEY` / `TWITTER_API_KEY_SECRET` — Twitter Consumer Keys (required)
- `TWITTER_ACCESS_TOKEN` / `TWITTER_ACCESS_TOKEN_SECRET` — Twitter Access Tokens (required)
- `TWITTER_BEARER_TOKEN` — For trending topics context (optional)
- `TELEGRAM_BOT_TOKEN` — Telegram notifications (optional)

## What's Left (from docs/CONTEXT.md)

- [ ] Create Supabase project and configure `.env.local` with real keys
- [ ] Run migrations: `supabase db push`
- [ ] Enable pg_cron and schedule `check_scheduled_posts()`
- [ ] Configure Edge Function secrets
- [ ] Deploy to Cloudflare Pages
- [ ] Connect Twitter Developer App
- [ ] Configure Telegram Bot webhook
- [ ] End-to-end testing
