# 365 Football Bot ⚽

A modular football-news automation platform for Burmese-speaking audiences. It monitors configurable RSS-first news sources, records only unseen articles, and provides a Telegram admin entry point. This repository implements **Phase 1: Telegram Bot + RSS News Monitoring + PostgreSQL/Prisma** and scaffolds the remaining modules.

## What works now

- RSS-first monitoring from database-configured `news_sources`; the monitor persists headline, summary, URL, date, image, and original feed payload.
- Duplicate prevention at the application layer (URL/content hash) and database layer (unique constraints).
- Telegram admin bot with the requested navigation buttons and an admin allowlist controlled by environment variables.
- REST health endpoint, latest-news endpoint, and a small read-only dashboard at `/`.
- Cron-driven polling with structured logs, per-source error isolation, and source poll timestamps.
- PostgreSQL schema for all nine required data domains, ready for AI processing, publishing, manual posts, and live-score work.

## Planned phases

| Phase | Scope |
| --- | --- |
| 1 (implemented) | RSS monitoring, persistence/deduplication, Telegram admin shell, API/dashboard foundation |
| 2 | Burmese AI rewrite/category approval workflow, manual post composer/preview/scheduling, Telegram channel publisher |
| 3 | API-Football provider, big-match rules, live message updates, goal/half/full-time automation |
| 4 | Dashboard authentication, source settings UI, scraper fallback using Cheerio/Playwright after robots/terms review |

## Quick start

### Local development

1. Install Node.js 20+ and PostgreSQL 16+.
2. Copy the example environment file and fill in real values (never commit `.env`):
   ```bash
   cp .env.example .env
   ```
3. Install dependencies and generate Prisma Client:
   ```bash
   npm install
   npm run prisma:generate
   ```
4. Create the database schema and optional sample RSS source:
   ```bash
   npm run prisma:deploy
   npm run prisma:seed
   ```
5. Start the app:
   ```bash
   npm run dev
   ```
6. Open `http://localhost:3000` and use `/health` for a readiness check.

### Docker

```bash
cp .env.example .env
# Set DATABASE_URL to the compose service, e.g. postgresql://football:football@postgres:5432/football?schema=public
docker compose up --build
```

## Configuration

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL Prisma connection string |
| `TELEGRAM_BOT_TOKEN` | For bot | BotFather token; omit to run without Telegram |
| `TELEGRAM_CHANNEL_ID` | For publishing | Target channel ID, used in later publishing phase |
| `TELEGRAM_ADMIN_IDS` | For bot | Comma-separated numeric Telegram admin IDs |
| `NEWS_POLL_CRON` | No | Cron expression, default every 10 minutes |
| `NEWS_MAX_ARTICLES_PER_SOURCE` | No | Max feed entries checked per source |
| `API_FOOTBALL_KEY` | Later | Reserved for the live-score implementation |

## Operations and source policy

RSS is preferred because it is less invasive and provides source attribution. Add sources only where your use is allowed; review each publisher's terms and `robots.txt` before enabling the planned HTML-scraper fallback. The system stores source URLs and summaries, not full article text, and the future AI workflow must produce original Burmese summaries rather than copies. Keep API tokens exclusively in deployment secrets/environment variables.

## Architecture

```text
src/
├── api/                 REST API + dashboard
├── bot/                 Telegram admin bot
├── config/              environment validation
├── db/                  Prisma client
├── modules/
│   ├── news/            RSS ingestion, repositories, future processing
│   ├── publishing/      Telegram channel publishing
│   ├── scheduling/      cron jobs
│   ├── admin/           future manual-post flow
│   └── live-scores/     provider abstraction
└── index.ts             application composition
```

## Validation

```bash
npm run check
npm test
npm run build
```
