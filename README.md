# engpass.radar — Swiss Drug Shortage Tracker

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A modern dashboard that tracks current drug shortages in Switzerland. Data is scraped daily from [drugshortage.ch](https://www.drugshortage.ch) and displayed with KPI cards, full-text search, status/company filters, sortable table, and a detail drawer.

---

## Features

- **Daily scrape** — cheerio-based parser pulls the full ASP.NET table from drugshortage.ch
- **KPI cards** — active shortage count, top manufacturer, ATC group coverage, average days since report
- **Search** — real-time full-text search across drug name, company, and ATC code
- **Filters** — filter by status level (1–5) and manufacturer
- **Sortable table** — sort by any column; URL-driven so links are shareable
- **Detail drawer** — click any row to see GTIN, pharmacode, delivery date, mutation history, and source link
- **Cron endpoint** — `POST /api/scrape` secured with a Bearer token, wired to Vercel Cron

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, Server Components) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS + shadcn/ui |
| Scraping | cheerio |
| Data | File-based JSON (swappable to Supabase) |
| Testing | Jest + ts-jest |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
git clone https://github.com/brainbytes-dev/drugshortage.git
cd drugshortage
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
CRON_SECRET=your-secret-here
```

> `CRON_SECRET` protects the `POST /api/scrape` endpoint. Use a long random string in production.

### Run Locally

```bash
# Fetch current shortage data
npm run scrape

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run Jest test suite |
| `npm run scrape` | Fetch and store current shortages |

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── scrape/route.ts      # POST — cron trigger (Bearer auth)
│   │   └── shortages/route.ts   # GET  — search, filter, paginate
│   ├── layout.tsx
│   └── page.tsx                 # Dashboard (Server Component)
├── components/
│   ├── filter-bar.tsx           # Status + company dropdowns
│   ├── kpi-cards.tsx            # 4-card KPI grid
│   ├── search-bar.tsx           # Full-text search input
│   ├── shortage-drawer.tsx      # Detail slide-out
│   ├── shortages-table.tsx      # Sortable, paginated table
│   └── status-badge.tsx         # Color-coded status badge
├── lib/
│   ├── db.ts                    # JSON data layer
│   ├── scraper.ts               # cheerio HTML parser
│   └── types.ts                 # TypeScript interfaces
└── scripts/
    └── scrape.ts                # CLI scrape script
data/
└── shortages.json               # Local DB (gitignored)
tests/
├── api/shortages.test.ts
└── lib/
    ├── db.test.ts
    └── scraper.test.ts
```

---

## Data Layer

All shortage data is stored in `data/shortages.json` (gitignored). The file is managed exclusively through `src/lib/db.ts`:

- **`upsertShortages(incoming)`** — inserts new records, updates existing ones by GTIN, soft-deletes missing entries (`isActive: false`)
- **`queryShortages(query)`** — filters, sorts, and paginates active records
- **`getKPIStats()`** — aggregates KPI metrics
- **`getFirmaList()`** — unique sorted manufacturer list for the filter dropdown

The data layer is designed to be swapped for Supabase with minimal changes to the API routes.

---

## Cron Job (Vercel)

`vercel.json` configures a daily scrape at 03:00 UTC:

```json
{
  "crons": [
    {
      "path": "/api/scrape",
      "schedule": "0 3 * * *"
    }
  ]
}
```

Set `CRON_SECRET` in your Vercel environment variables to match your `.env.local` value.

---

## Deployment

1. Push to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add `CRON_SECRET` as an environment variable
4. Deploy — Vercel runs the daily cron automatically

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

[MIT](LICENSE) — © 2026 BrainBytes
