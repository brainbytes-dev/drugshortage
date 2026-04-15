# Drug Shortage Dashboard — Design Spec
**Date:** 2026-04-15  
**Stack:** Next.js 14 (App Router) · shadcn/ui · Tailwind CSS · Vercel · Supabase Postgres

---

## Goal

A modern, public dashboard that tracks all current drug shortages in Switzerland. Replaces the ugly legacy ASP.NET iFrame on drugshortage.ch with a fast, searchable, visually rich interface. Revenue model: ads (later). No login required.

---

## Data Source

**Primary source:** `https://www.drugshortage.ch/UebersichtaktuelleLieferengpaesse2.aspx`  
This is an ASP.NET page serving ~721 current shortages in an HTML table (GridView1). It's the de-facto standard for Swiss drug shortage data — no official government API exists.

**Scraping strategy:**
- `cheerio` parses GridView1 HTML rows
- Upsert per GTIN: new → INSERT with `first_seen_at`, existing → UPDATE `last_seen_at` + changed fields
- Entries no longer present → `is_active = false`
- Daily cron at 03:00 (Vercel Cron in production, `npm run scrape` locally)

---

## Data Model

### `shortages` table
| Field | Type | Notes |
|-------|------|-------|
| id | serial PK | |
| gtin | varchar(14) UNIQUE | Global Trade Item Number — natural key |
| pharmacode | varchar(20) | Swiss pharmacy code |
| bezeichnung | text | Product name |
| firma | text | Manufacturer |
| atc_code | varchar(20) | ATC drug classification code |
| gengrp | varchar(100) | Generic group code |
| status_code | smallint | 1–5 (1=transparent, 4=silent, 5=negotiating) |
| status_text | text | Full status description |
| datum_lieferfahigkeit | text | Expected delivery date (free text: "unbestimmt", "KW 17", date) |
| datum_letzte_mutation | date | Last update by source |
| tage_seit_meldung | integer | Days since first report (from source) |
| detail_url | text | Link to detail page on drugshortage.ch |
| first_seen_at | timestamptz | When we first scraped this entry |
| last_seen_at | timestamptz | Last time we saw this entry active |
| is_active | boolean | false = no longer in current shortage list |

### `scrape_runs` table
| Field | Type | Notes |
|-------|------|-------|
| id | serial PK | |
| scraped_at | timestamptz | When the run happened |
| total_count | integer | Total shortages found |
| new_entries | integer | Newly discovered shortages |
| removed_entries | integer | Entries marked inactive |
| status | text | 'success' / 'error' |
| error_message | text | nullable |

---

## Local-First Data Layer

`/src/lib/db.ts` — data access layer that abstracts storage.

**Phase 1 (local):** Reads/writes to `/data/shortages.json`  
**Phase 2 (Supabase):** Swap `/src/lib/db.ts` to use `@supabase/supabase-js` — no other files change.

---

## Application Structure

```
/src
  /app
    page.tsx                    ← Main dashboard page (Server Component)
    layout.tsx
    /api
      /shortages/route.ts       ← GET ?search=&status=&firma=&page=&sort=
      /scrape/route.ts          ← POST (authenticated via CRON_SECRET header)
  /components
    kpi-cards.tsx               ← 4 stat cards: total, top firm, ATC groups, avg days
    search-bar.tsx              ← Debounced search input
    filter-bar.tsx              ← Status dropdown, Firma select, ATC filter
    shortages-table.tsx         ← shadcn DataTable, sortable columns, pagination
    shortage-drawer.tsx         ← Slide-out Sheet with full detail on row click
    status-badge.tsx            ← Color-coded badge (green/yellow/orange/red) per status 1-5
  /lib
    db.ts                       ← Data access layer (local JSON → swap to Supabase)
    scraper.ts                  ← cheerio scraper logic
    types.ts                    ← TypeScript interfaces
  /scripts
    scrape.ts                   ← CLI entry: `npm run scrape`
/data
  shortages.json                ← Local dev "database"
/docs
  superpowers/specs/            ← This file
```

---

## UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  💊 Swiss Drug Shortage Tracker          [Last updated]  │
├─────────┬──────────┬──────────────────┬─────────────────┤
│ 721     │ Sandoz   │ 303 ATC Groups   │ Ø 89 Days       │
│ Aktive  │ Top Firm │ Betroffen        │ Dauer           │
├─────────┴──────────┴──────────────────┴─────────────────┤
│ 🔍 Medikament suchen...     [Status ▾] [Firma ▾] [ATC ▾]│
├─────────────────────────────────────────────────────────┤
│ Bezeichnung ↕ │ Firma ↕ │ Status │ Lieferbar ↕ │ Tage ↕│
│ ─────────────────────────────────────────────────────── │
│ ACETALGIN ... │ Streuli │  🔴 1  │ unbestimmt  │  293  │
│ ACETALGIN ... │ Streuli │  🔴 1  │ KW 17       │   21  │
│ ...           │         │        │             │       │
└─────────────────────────────────────────────────────────┘
```

Row click → `<Sheet>` Drawer slides in with full detail (all fields + link to original).

---

## Status Color System

| Code | Color | Meaning |
|------|-------|---------|
| 1 | 🟢 Green | Company reports directly (Exclusive Access) |
| 2 | 🟡 Yellow-Green | Company reports, no exclusive access |
| 3 | 🟠 Orange | Company reports sporadically |
| 4 | 🔴 Red | Company does NOT inform — network-reported |
| 5 | 🟡 Yellow | Negotiations ongoing |

---

## API Route: GET /api/shortages

Query params:
- `search` — fuzzy match on `bezeichnung`, `firma`, `atc_code`
- `status` — filter by status_code (1-5)
- `firma` — exact match
- `atc` — prefix match on atc_code
- `page` — pagination (default 1, 50 per page)
- `sort` — field name + direction e.g. `tage_seit_meldung:desc`

Returns: `{ data: Shortage[], total: number, page: number }`

---

## Scraper: POST /api/scrape

Protected by `Authorization: Bearer ${CRON_SECRET}` header.  
Vercel Cron config in `vercel.json`:
```json
{ "crons": [{ "path": "/api/scrape", "schedule": "0 3 * * *" }] }
```

---

## Out of Scope (v1)

- User accounts / saved searches
- Email alerts for new shortages
- Swissmedic cross-reference enrichment
- Charts/trends over time (added once we have 30+ days of history)
- French/Italian language support
- Ad integration (placeholder `<AdSlot>` component added, not wired)
