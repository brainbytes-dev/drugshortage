# engpass.radar

**Swiss Drug Shortage Intelligence Platform**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)
[![License: Elastic-2.0](https://img.shields.io/badge/License-Elastic%202.0-blue.svg)](LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/brainbytes-dev/engpassradar)](https://github.com/brainbytes-dev/engpassradar/commits/main)
[![Issues](https://img.shields.io/github/issues/brainbytes-dev/engpassradar)](https://github.com/brainbytes-dev/engpassradar/issues)

---

Real-time tracking of drug shortages across Switzerland. Data is automatically collected daily from multiple official sources — processed, enriched, and made searchable for healthcare professionals, pharmacists, and the public.

> Built by Henrik Rühe · Not affiliated with or endorsed by drugshortage.ch or any official authority.

---

## What it does

| Feature | Details |
|---|---|
| **Multi-source ingestion** | drugshortage.ch (HTML), BWL/admin.ch (XML/XLSX), USB Basel Spitalpharmazie (PDF) |
| **128k medication index** | Full ODDB product database: ingredient, Swissmedic-Nr, composition, GTIN |
| **Off-market tracking** | `AUSSER_HANDEL` (permanently withdrawn) and `VERTRIEBSEINSTELLUNG` (sales discontinued) |
| **Alternatives** | Per-shortage alternative suggestions cached by GTIN |
| **Watchlist** | Save and monitor specific drugs; email alerts on status change |
| **CSV export** | Full dataset export for downstream analysis |
| **Public REST API** | Programmatic access via `/api/v1/` |
| **RSS feed** | Subscribe to shortage updates via `/rss.xml` |
| **Blog / Newsletter** | Curated shortage reports and analysis |
| **Daily cron** | Fully automated scrape at 03:00 UTC via Vercel Cron |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Server Components, ISR) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS + shadcn/ui |
| Scraping | cheerio (HTML) · SheetJS (XLSX) · fast-xml-parser (XML) · pdf-parse (PDF) |
| ORM | Prisma 7 with PrismaPg Driver Adapter |
| Database | Supabase PostgreSQL |
| Testing | Jest + ts-jest |
| Deployment | Vercel (Fluid Compute, Cron) |

---

## Data Sources

| Source | Format | Content |
|---|---|---|
| [drugshortage.ch](https://www.drugshortage.ch) | HTML | Active shortages with status 1–5 |
| [bwl.admin.ch](https://www.bwl.admin.ch) | XLSX / XML | Federal supply disruptions |
| [USB Basel Spitalpharmazie](https://www.unispital-basel.ch) | PDF | Hospital pharmacy shortage list |
| [ODDB / Swissmedic](https://www.oddb.org) | CSV | 128k Swiss medication index |

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── alternatives/        # Per-drug alternative suggestions
│   │   ├── export/              # CSV export
│   │   ├── health/              # Health check
│   │   ├── newsletter/          # Newsletter subscription
│   │   ├── scrape/              # Cron trigger (Bearer auth)
│   │   ├── scrape-oddb/         # ODDB medication index sync
│   │   ├── scrape-usb/          # USB Basel PDF scraper
│   │   ├── shortages/           # Search, filter, paginate
│   │   ├── timeline/            # Historical shortage timeline
│   │   ├── v1/                  # Public REST API
│   │   └── watchlist/           # Watchlist management
│   ├── blog/                    # Shortage analysis articles
│   ├── firma/[slug]/            # Manufacturer profiles (ISR)
│   ├── gtin/[gtin]/             # GTIN lookup
│   ├── medikament/[slug]/       # Drug detail pages (ISR)
│   ├── methodik/                # Methodology & data sources
│   ├── wirkstoff/[slug]/        # Active ingredient pages
│   ├── watchlist/               # User watchlist UI
│   ├── layout.tsx
│   └── page.tsx                 # Dashboard (Server Component)
├── components/                  # UI components (shadcn/ui based)
├── lib/
│   ├── db.ts                    # Single data access layer (Prisma)
│   ├── scraper.ts               # drugshortage.ch HTML parser
│   ├── scraper-usb.ts           # USB Basel PDF parser
│   ├── slug.ts                  # URL slug helper
│   └── types.ts                 # TypeScript interfaces
└── scripts/
    └── scrape.ts                # CLI scrape entry point
prisma/
└── schema.prisma                # DB schema — all 7 models, all indexes
tests/
├── api/                         # API route tests
└── lib/                         # Unit tests
```

---

## Database Schema

| Table | Content |
|---|---|
| `shortages` | Active & historical shortages with `isActive` flag and `slug` |
| `overview_stats` | Aggregated KPI stats per scrape run |
| `scrape_runs` | Scrape execution log with duration and record counts |
| `alternatives_cache` | Cached alternatives keyed by GTIN |
| `bwl_shortages` | Federal supply disruptions joined by GTIN |
| `oddb_products` | 128k Swiss medications: ingredient, Swissmedic-Nr, composition |
| `off_market_drugs` | Off-market drugs: withdrawn and discontinued products |

All indexes are defined in `prisma/schema.prisma` — never in loose SQL files.

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Supabase project (PostgreSQL)

### Installation

```bash
git clone https://github.com/brainbytes-dev/engpassradar.git
cd engpassradar
pnpm install
```

### Environment Variables

Copy `.env.example` to `.env.local`:

```env
DATABASE_URL=postgresql://...      # Pooled connection (Supavisor port 6543)
DIRECT_URL=postgresql://...        # Direct connection (port 5432) — for migrations
CRON_SECRET=your-secret-here       # Protects /api/scrape — use a long random string
```

### Database Setup

```bash
pnpm prisma migrate deploy
pnpm prisma generate
```

### Run Locally

```bash
pnpm run scrape   # Pull current shortage data into the DB
pnpm dev          # Start dev server at http://localhost:3000
```

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start Next.js development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run Jest test suite |
| `pnpm run scrape` | Fetch and store current shortages |

---

## API

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/shortages` | GET | List shortages with search, filter, pagination |
| `/api/v1/shortages/[slug]` | GET | Single shortage detail |
| `/api/alternatives` | GET | Alternative drug suggestions by GTIN |
| `/api/export` | GET | Full CSV export |
| `/api/health` | GET | Health check |
| `/api/scrape` | GET | Cron trigger (requires `Authorization: Bearer <CRON_SECRET>`) |
| `/rss.xml` | GET | RSS feed of latest shortages |

---

## Deployment

1. Push to GitHub
2. Import at [vercel.com/new](https://vercel.com/new)
3. Set environment variables: `DATABASE_URL`, `DIRECT_URL`, `CRON_SECRET`
4. Deploy — Vercel runs the daily cron automatically

The cron is configured in `vercel.json` (daily at 03:00 UTC):

```json
{ "crons": [{ "path": "/api/scrape", "schedule": "0 3 * * *" }] }
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

Found a vulnerability? See [SECURITY.md](SECURITY.md) for responsible disclosure.

## License

[Elastic License 2.0](LICENSE) — © 2026 Henrik Rühe
