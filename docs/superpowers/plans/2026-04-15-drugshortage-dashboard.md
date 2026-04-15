# Drug Shortage Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modern Next.js dashboard that scrapes drugshortage.ch daily, stores shortages in a local JSON DB, and displays them with KPI cards, search, filters, and a detail drawer.

**Architecture:** A Next.js 14 App Router project with Server Components for data fetching and Client Components for interactivity. A file-based JSON data layer (swappable to Supabase later) is accessed only through `src/lib/db.ts`. A cheerio scraper in `src/lib/scraper.ts` fetches and parses the ASP.NET HTML table from drugshortage.ch.

**Tech Stack:** Next.js 14 · TypeScript · shadcn/ui · Tailwind CSS · cheerio · Jest · tsx (for scripts)

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `components.json` (shadcn config)
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `vercel.json`
- Create: `.env.local`
- Create: `.gitignore`

- [ ] **Step 1: Scaffold Next.js project**

```bash
cd "/Users/henrik/Documents/VS Code/Drugshortage"
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git
```

Expected: Project files created, `npm run dev` works.

- [ ] **Step 2: Install dependencies**

```bash
npm install cheerio
npm install -D tsx @types/cheerio jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom ts-jest
```

- [ ] **Step 3: Init shadcn/ui**

```bash
npx shadcn@latest init -d
```

Choose: Default style, slate base color, CSS variables yes.

- [ ] **Step 4: Add required shadcn components**

```bash
npx shadcn@latest add button badge card input select sheet table
```

- [ ] **Step 5: Add scrape script to package.json**

In `package.json`, add to `"scripts"`:
```json
"scrape": "tsx src/scripts/scrape.ts"
```

- [ ] **Step 6: Configure Jest**

Create `jest.config.ts`:
```typescript
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathPattern: 'tests/',
}

export default config
```

Add to `package.json` scripts:
```json
"test": "jest"
```

- [ ] **Step 7: Create vercel.json**

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

- [ ] **Step 8: Create .env.local**

```bash
CRON_SECRET=local-dev-secret
```

- [ ] **Step 9: Create data directory and empty shortages.json**

```bash
mkdir -p data
echo '[]' > data/shortages.json
```

Add to `.gitignore`:
```
data/shortages.json
.env.local
```

- [ ] **Step 10: Verify dev server starts**

```bash
npm run dev
```

Expected: Server running at http://localhost:3000

- [ ] **Step 11: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold Next.js project with shadcn and dependencies"
```

---

### Task 2: Types

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: Write the types**

Create `src/lib/types.ts`:
```typescript
export interface Shortage {
  id?: number
  gtin: string
  pharmacode: string
  bezeichnung: string
  firma: string
  atcCode: string
  gengrp: string
  statusCode: number          // 1–5
  statusText: string
  datumLieferfahigkeit: string // free text: "unbestimmt", "KW 17", or date string
  datumLetzteMutation: string  // "DD.MM.YYYY"
  tageSeitMeldung: number
  detailUrl: string
  firstSeenAt: string          // ISO timestamp
  lastSeenAt: string           // ISO timestamp
  isActive: boolean
}

export interface ScrapeRun {
  id?: number
  scrapedAt: string
  totalCount: number
  newEntries: number
  removedEntries: number
  status: 'success' | 'error'
  errorMessage?: string
}

export interface ShortagesResponse {
  data: Shortage[]
  total: number
  page: number
  perPage: number
}

export interface ShortagesQuery {
  search?: string
  status?: string       // comma-separated codes e.g. "1,4"
  firma?: string
  atc?: string
  page?: number
  sort?: string         // e.g. "tageSeitMeldung:desc"
  perPage?: number
}

export interface KPIStats {
  totalActive: number
  topFirma: string
  topFirmaCount: number
  uniqueAtcGroups: number
  avgDaysSinceMeldung: number
  lastScrapedAt: string | null
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add TypeScript interfaces"
```

---

### Task 3: Local JSON Data Layer

**Files:**
- Create: `src/lib/db.ts`
- Create: `tests/lib/db.test.ts`
- Modify: `data/shortages.json`

- [ ] **Step 1: Write failing tests**

Create `tests/lib/db.test.ts`:
```typescript
import { getAllShortages, upsertShortages, queryShortages, getKPIStats } from '@/lib/db'
import type { Shortage } from '@/lib/types'
import fs from 'fs'
import path from 'path'

const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test-shortages.json')

// Override the data path for tests
process.env.DB_PATH = TEST_DB_PATH

const mockShortage: Shortage = {
  gtin: '7680494930101',
  pharmacode: '1379591',
  bezeichnung: 'ACETALGIN Supp 125 mg 10 Stk',
  firma: 'Streuli Pharma AG',
  atcCode: 'N02BE01',
  gengrp: 'N02BE01SRSN000000125SUPP',
  statusCode: 1,
  statusText: '1 aktuell keine Lieferungen',
  datumLieferfahigkeit: 'unbestimmt',
  datumLetzteMutation: '11.12.2025',
  tageSeitMeldung: 293,
  detailUrl: 'https://www.drugshortage.ch/detail_lieferengpass.aspx?ID=25975',
  firstSeenAt: new Date().toISOString(),
  lastSeenAt: new Date().toISOString(),
  isActive: true,
}

beforeEach(() => {
  fs.writeFileSync(TEST_DB_PATH, JSON.stringify([]))
})

afterAll(() => {
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH)
})

test('getAllShortages returns empty array on fresh db', async () => {
  const result = await getAllShortages()
  expect(result).toEqual([])
})

test('upsertShortages inserts new shortage', async () => {
  await upsertShortages([mockShortage])
  const result = await getAllShortages()
  expect(result).toHaveLength(1)
  expect(result[0].gtin).toBe('7680494930101')
  expect(result[0].isActive).toBe(true)
})

test('upsertShortages updates existing shortage by gtin', async () => {
  await upsertShortages([mockShortage])
  const updated = { ...mockShortage, tageSeitMeldung: 300 }
  await upsertShortages([updated])
  const result = await getAllShortages()
  expect(result).toHaveLength(1)
  expect(result[0].tageSeitMeldung).toBe(300)
})

test('upsertShortages marks missing gtins as inactive', async () => {
  await upsertShortages([mockShortage])
  await upsertShortages([]) // empty scrape
  const result = await getAllShortages()
  expect(result[0].isActive).toBe(false)
})

test('queryShortages filters by search term', async () => {
  await upsertShortages([mockShortage])
  const result = await queryShortages({ search: 'acetalgin' })
  expect(result.data).toHaveLength(1)
  const miss = await queryShortages({ search: 'ibuprofen' })
  expect(miss.data).toHaveLength(0)
})

test('queryShortages filters by statusCode', async () => {
  await upsertShortages([mockShortage])
  const result = await queryShortages({ status: '1' })
  expect(result.data).toHaveLength(1)
  const miss = await queryShortages({ status: '4' })
  expect(miss.data).toHaveLength(0)
})

test('getKPIStats returns correct totals', async () => {
  await upsertShortages([mockShortage])
  const stats = await getKPIStats()
  expect(stats.totalActive).toBe(1)
  expect(stats.topFirma).toBe('Streuli Pharma AG')
  expect(stats.uniqueAtcGroups).toBe(1)
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test tests/lib/db.test.ts
```

Expected: FAIL — `@/lib/db` not found.

- [ ] **Step 3: Implement db.ts**

Create `src/lib/db.ts`:
```typescript
import fs from 'fs'
import path from 'path'
import type { Shortage, ShortagesQuery, ShortagesResponse, KPIStats } from './types'

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), 'data', 'shortages.json')

function readDB(): Shortage[] {
  if (!fs.existsSync(DB_PATH)) return []
  const raw = fs.readFileSync(DB_PATH, 'utf-8')
  try { return JSON.parse(raw) } catch { return [] }
}

function writeDB(data: Shortage[]): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

export async function getAllShortages(): Promise<Shortage[]> {
  return readDB()
}

export async function upsertShortages(incoming: Shortage[]): Promise<{ newEntries: number; removedEntries: number }> {
  const existing = readDB()
  const existingMap = new Map(existing.map(s => [s.gtin, s]))
  const incomingGtins = new Set(incoming.map(s => s.gtin))
  const now = new Date().toISOString()

  let newEntries = 0
  let removedEntries = 0

  // Upsert incoming
  for (const shortage of incoming) {
    if (existingMap.has(shortage.gtin)) {
      const old = existingMap.get(shortage.gtin)!
      existingMap.set(shortage.gtin, {
        ...old,
        ...shortage,
        firstSeenAt: old.firstSeenAt,
        lastSeenAt: now,
        isActive: true,
      })
    } else {
      newEntries++
      existingMap.set(shortage.gtin, {
        ...shortage,
        firstSeenAt: now,
        lastSeenAt: now,
        isActive: true,
      })
    }
  }

  // Mark missing as inactive
  for (const [gtin, shortage] of existingMap) {
    if (!incomingGtins.has(gtin) && shortage.isActive) {
      removedEntries++
      existingMap.set(gtin, { ...shortage, isActive: false, lastSeenAt: now })
    }
  }

  writeDB(Array.from(existingMap.values()))
  return { newEntries, removedEntries }
}

export async function queryShortages(query: ShortagesQuery): Promise<ShortagesResponse> {
  const perPage = query.perPage ?? 50
  const page = query.page ?? 1
  let data = readDB().filter(s => s.isActive)

  if (query.search) {
    const term = query.search.toLowerCase()
    data = data.filter(s =>
      s.bezeichnung.toLowerCase().includes(term) ||
      s.firma.toLowerCase().includes(term) ||
      s.atcCode.toLowerCase().includes(term)
    )
  }

  if (query.status) {
    const codes = query.status.split(',').map(Number)
    data = data.filter(s => codes.includes(s.statusCode))
  }

  if (query.firma) {
    data = data.filter(s => s.firma === query.firma)
  }

  if (query.atc) {
    data = data.filter(s => s.atcCode.startsWith(query.atc!))
  }

  if (query.sort) {
    const [field, dir] = query.sort.split(':') as [keyof Shortage, string]
    data.sort((a, b) => {
      const av = a[field] ?? 0
      const bv = b[field] ?? 0
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return dir === 'desc' ? -cmp : cmp
    })
  }

  const total = data.length
  const paged = data.slice((page - 1) * perPage, page * perPage)

  return { data: paged, total, page, perPage }
}

export async function getKPIStats(): Promise<KPIStats> {
  const active = readDB().filter(s => s.isActive)

  const firmaCounts = active.reduce<Record<string, number>>((acc, s) => {
    acc[s.firma] = (acc[s.firma] ?? 0) + 1
    return acc
  }, {})

  const topFirma = Object.entries(firmaCounts).sort((a, b) => b[1] - a[1])[0]
  const uniqueAtcGroups = new Set(active.map(s => s.atcCode)).size
  const avgDays = active.length > 0
    ? Math.round(active.reduce((sum, s) => sum + (s.tageSeitMeldung ?? 0), 0) / active.length)
    : 0

  return {
    totalActive: active.length,
    topFirma: topFirma?.[0] ?? '-',
    topFirmaCount: topFirma?.[1] ?? 0,
    uniqueAtcGroups,
    avgDaysSinceMeldung: avgDays,
    lastScrapedAt: null,
  }
}

export async function getFirmaList(): Promise<string[]> {
  const active = readDB().filter(s => s.isActive)
  return [...new Set(active.map(s => s.firma))].sort()
}

export async function getAtcList(): Promise<string[]> {
  const active = readDB().filter(s => s.isActive)
  return [...new Set(active.map(s => s.atcCode))].sort()
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test tests/lib/db.test.ts
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db.ts src/lib/types.ts tests/lib/db.test.ts
git commit -m "feat: add JSON data layer with upsert and query logic"
```

---

### Task 4: Scraper

**Files:**
- Create: `src/lib/scraper.ts`
- Create: `tests/lib/scraper.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/lib/scraper.test.ts`:
```typescript
import { parseShortagesFromHtml } from '@/lib/scraper'

const SAMPLE_HTML = `
<table id="GridView1">
  <tr bgcolor="#FF5050">
    <th>Bezeichnung</th><th>Datum Lieferfähigkeit</th>
    <th>mögliche Alternativen</th><th>Status</th>
    <th>Datum letzte Mutation</th><th>Firma</th>
    <th>GTIN</th><th>Pharmacode</th>
    <th>Tage seit erster Meldung</th><th>ATC</th><th>GENGRP</th>
  </tr>
  <tr>
    <td><a href="detail_lieferengpass.aspx?ID=25975">ACETALGIN Supp 125 mg 10 Stk</a></td>
    <td>unbestimmt</td>
    <td><a href="alternativen.aspx?GTIN=7680494930101">Alternativen?</a></td>
    <td>1 aktuell keine Lieferungen</td>
    <td>11.12.2025</td>
    <td>Streuli Pharma AG</td>
    <td>7680494930101</td>
    <td>1379591</td>
    <td>293</td>
    <td>N02BE01</td>
    <td>N02BE01SRSN000000125SUPP</td>
  </tr>
</table>
`

test('parseShortagesFromHtml extracts one shortage from sample HTML', () => {
  const result = parseShortagesFromHtml(SAMPLE_HTML)
  expect(result).toHaveLength(1)
  const s = result[0]
  expect(s.gtin).toBe('7680494930101')
  expect(s.bezeichnung).toBe('ACETALGIN Supp 125 mg 10 Stk')
  expect(s.firma).toBe('Streuli Pharma AG')
  expect(s.statusCode).toBe(1)
  expect(s.statusText).toBe('1 aktuell keine Lieferungen')
  expect(s.tageSeitMeldung).toBe(293)
  expect(s.atcCode).toBe('N02BE01')
  expect(s.datumLieferfahigkeit).toBe('unbestimmt')
  expect(s.detailUrl).toBe('https://www.drugshortage.ch/detail_lieferengpass.aspx?ID=25975')
  expect(s.isActive).toBe(true)
})

test('parseShortagesFromHtml returns empty array for missing table', () => {
  const result = parseShortagesFromHtml('<html><body>no table</body></html>')
  expect(result).toHaveLength(0)
})

test('parseShortagesFromHtml skips rows with missing GTIN', () => {
  const html = `
    <table id="GridView1">
      <tr><th>h1</th><th>h2</th></tr>
      <tr><td>Name</td><td></td><td></td><td>1</td><td></td><td>Firma</td><td></td><td></td><td>0</td><td>A01</td><td>grp</td></tr>
    </table>
  `
  const result = parseShortagesFromHtml(html)
  expect(result).toHaveLength(0)
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test tests/lib/scraper.test.ts
```

Expected: FAIL — `@/lib/scraper` not found.

- [ ] **Step 3: Implement scraper.ts**

Create `src/lib/scraper.ts`:
```typescript
import * as cheerio from 'cheerio'
import type { Shortage } from './types'

const BASE_URL = 'https://www.drugshortage.ch'
const SOURCE_URL = `${BASE_URL}/UebersichtaktuelleLieferengpaesse2.aspx`

export function parseShortagesFromHtml(html: string): Shortage[] {
  const $ = cheerio.load(html)
  const rows = $('#GridView1 tr').toArray()
  const shortages: Shortage[] = []

  // Skip header row (first tr with th elements)
  for (const row of rows.slice(1)) {
    const cells = $(row).find('td')
    if (cells.length < 11) continue

    const getText = (i: number) => $(cells[i]).text().trim()
    const getHref = (i: number) => $(cells[i]).find('a').attr('href') ?? ''

    const gtin = getText(6)
    if (!gtin) continue

    const statusText = getText(3)
    const statusCode = parseInt(statusText.charAt(0), 10)
    if (isNaN(statusCode) || statusCode < 1 || statusCode > 5) continue

    const detailHref = getHref(0)
    const detailUrl = detailHref
      ? detailHref.startsWith('http')
        ? detailHref
        : `${BASE_URL}/${detailHref}`
      : ''

    shortages.push({
      gtin,
      pharmacode: getText(7),
      bezeichnung: getText(0),
      firma: getText(5),
      atcCode: getText(9),
      gengrp: getText(10),
      statusCode,
      statusText,
      datumLieferfahigkeit: getText(1),
      datumLetzteMutation: getText(4),
      tageSeitMeldung: parseInt(getText(8), 10) || 0,
      detailUrl,
      firstSeenAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      isActive: true,
    })
  }

  return shortages
}

export async function fetchAndParse(): Promise<Shortage[]> {
  const response = await fetch(SOURCE_URL, {
    headers: { 'User-Agent': 'drugshortage-dashboard/1.0' },
    next: { revalidate: 0 },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch source: ${response.status} ${response.statusText}`)
  }

  const html = await response.text()
  return parseShortagesFromHtml(html)
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test tests/lib/scraper.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scraper.ts tests/lib/scraper.test.ts
git commit -m "feat: add cheerio scraper for drugshortage.ch"
```

---

### Task 5: Scrape Script & API Routes

**Files:**
- Create: `src/scripts/scrape.ts`
- Create: `src/app/api/scrape/route.ts`
- Create: `src/app/api/shortages/route.ts`
- Create: `tests/api/shortages.test.ts`

- [ ] **Step 1: Create scrape script**

Create `src/scripts/scrape.ts`:
```typescript
import { fetchAndParse } from '../lib/scraper'
import { upsertShortages } from '../lib/db'

async function main() {
  console.log('[scrape] Starting...')
  const shortages = await fetchAndParse()
  console.log(`[scrape] Fetched ${shortages.length} shortages`)
  const { newEntries, removedEntries } = await upsertShortages(shortages)
  console.log(`[scrape] Done. New: ${newEntries}, Removed: ${removedEntries}`)
}

main().catch(err => {
  console.error('[scrape] Error:', err)
  process.exit(1)
})
```

- [ ] **Step 2: Create POST /api/scrape route**

Create `src/app/api/scrape/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { fetchAndParse } from '@/lib/scraper'
import { upsertShortages } from '@/lib/db'

export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`

  if (auth !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const shortages = await fetchAndParse()
    const { newEntries, removedEntries } = await upsertShortages(shortages)
    return NextResponse.json({
      success: true,
      total: shortages.length,
      newEntries,
      removedEntries,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 3: Write failing test for GET /api/shortages**

Create `tests/api/shortages.test.ts`:
```typescript
import { GET } from '@/app/api/shortages/route'
import { upsertShortages } from '@/lib/db'
import type { Shortage } from '@/lib/types'
import fs from 'fs'
import path from 'path'

const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test-api-shortages.json')
process.env.DB_PATH = TEST_DB_PATH

const mockShortage: Shortage = {
  gtin: '7680494930101',
  pharmacode: '1379591',
  bezeichnung: 'ACETALGIN Supp 125 mg',
  firma: 'Streuli Pharma AG',
  atcCode: 'N02BE01',
  gengrp: 'N02BE01SRSN000000125SUPP',
  statusCode: 1,
  statusText: '1 aktuell keine Lieferungen',
  datumLieferfahigkeit: 'unbestimmt',
  datumLetzteMutation: '11.12.2025',
  tageSeitMeldung: 293,
  detailUrl: 'https://www.drugshortage.ch/detail_lieferengpass.aspx?ID=25975',
  firstSeenAt: new Date().toISOString(),
  lastSeenAt: new Date().toISOString(),
  isActive: true,
}

beforeEach(async () => {
  fs.writeFileSync(TEST_DB_PATH, JSON.stringify([]))
  await upsertShortages([mockShortage])
})

afterAll(() => {
  if (fs.existsSync(TEST_DB_PATH)) fs.unlinkSync(TEST_DB_PATH)
})

test('GET /api/shortages returns data array', async () => {
  const req = new Request('http://localhost/api/shortages')
  const res = await GET(req)
  const json = await res.json()
  expect(json.data).toHaveLength(1)
  expect(json.total).toBe(1)
  expect(json.page).toBe(1)
})

test('GET /api/shortages filters by search param', async () => {
  const req = new Request('http://localhost/api/shortages?search=acetalgin')
  const res = await GET(req)
  const json = await res.json()
  expect(json.data).toHaveLength(1)
})

test('GET /api/shortages returns empty for no match', async () => {
  const req = new Request('http://localhost/api/shortages?search=ibuprofen')
  const res = await GET(req)
  const json = await res.json()
  expect(json.data).toHaveLength(0)
  expect(json.total).toBe(0)
})
```

- [ ] **Step 4: Run test to verify it fails**

```bash
npm test tests/api/shortages.test.ts
```

Expected: FAIL — route not found.

- [ ] **Step 5: Create GET /api/shortages route**

Create `src/app/api/shortages/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { queryShortages, getKPIStats, getFirmaList, getAtcList } from '@/lib/db'
import type { ShortagesQuery } from '@/lib/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const query: ShortagesQuery = {
    search: searchParams.get('search') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    firma: searchParams.get('firma') ?? undefined,
    atc: searchParams.get('atc') ?? undefined,
    page: parseInt(searchParams.get('page') ?? '1', 10),
    sort: searchParams.get('sort') ?? 'tageSeitMeldung:desc',
    perPage: parseInt(searchParams.get('perPage') ?? '50', 10),
  }

  const [response, kpi, firmaList, atcList] = await Promise.all([
    queryShortages(query),
    getKPIStats(),
    getFirmaList(),
    getAtcList(),
  ])

  return NextResponse.json({ ...response, kpi, firmaList, atcList })
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm test tests/api/shortages.test.ts
```

Expected: All 3 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/scripts/scrape.ts src/app/api/scrape/route.ts src/app/api/shortages/route.ts tests/api/shortages.test.ts
git commit -m "feat: add scrape script and API routes"
```

---

### Task 6: StatusBadge Component

**Files:**
- Create: `src/components/status-badge.tsx`

- [ ] **Step 1: Create StatusBadge**

Create `src/components/status-badge.tsx`:
```typescript
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  code: number
  text?: string
  showText?: boolean
}

const STATUS_CONFIG: Record<number, { label: string; className: string }> = {
  1: { label: '1 — Direkt gemeldet', className: 'bg-green-100 text-green-800 border-green-200' },
  2: { label: '2 — Gemeldet', className: 'bg-lime-100 text-lime-800 border-lime-200' },
  3: { label: '3 — Sporadisch', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  4: { label: '4 — Nicht informiert', className: 'bg-red-100 text-red-800 border-red-200' },
  5: { label: '5 — Verhandlung', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
}

export function StatusBadge({ code, showText = false }: StatusBadgeProps) {
  const config = STATUS_CONFIG[code] ?? { label: String(code), className: 'bg-gray-100 text-gray-800' }
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', config.className)}
    >
      {showText ? config.label : code}
    </Badge>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/status-badge.tsx
git commit -m "feat: add StatusBadge component"
```

---

### Task 7: KPI Cards Component

**Files:**
- Create: `src/components/kpi-cards.tsx`

- [ ] **Step 1: Create KPICards**

Create `src/components/kpi-cards.tsx`:
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { KPIStats } from '@/lib/types'

interface KPICardsProps {
  stats: KPIStats
}

export function KPICards({ stats }: KPICardsProps) {
  const cards = [
    {
      title: 'Aktive Engpässe',
      value: stats.totalActive.toLocaleString('de-CH'),
      sub: 'aktuell gemeldet',
    },
    {
      title: 'Top Firma',
      value: stats.topFirma,
      sub: `${stats.topFirmaCount} Engpässe`,
    },
    {
      title: 'Betroffene ATC-Gruppen',
      value: stats.uniqueAtcGroups.toLocaleString('de-CH'),
      sub: 'verschiedene Wirkstoffe',
    },
    {
      title: 'Ø Dauer',
      value: `${stats.avgDaysSinceMeldung} Tage`,
      sub: 'seit erster Meldung',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map(card => (
        <Card key={card.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold truncate">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/kpi-cards.tsx
git commit -m "feat: add KPICards component"
```

---

### Task 8: SearchBar & FilterBar

**Files:**
- Create: `src/components/search-bar.tsx`
- Create: `src/components/filter-bar.tsx`

- [ ] **Step 1: Create SearchBar**

Create `src/components/search-bar.tsx`:
```typescript
'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function SearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const params = new URLSearchParams(searchParams.toString())
      const value = e.target.value
      if (value) {
        params.set('search', value)
      } else {
        params.delete('search')
      }
      params.delete('page')
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Medikament, Firma oder ATC-Code suchen…"
        defaultValue={searchParams.get('search') ?? ''}
        onChange={handleChange}
        className="pl-9"
      />
    </div>
  )
}
```

- [ ] **Step 2: Create FilterBar**

Create `src/components/filter-bar.tsx`:
```typescript
'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface FilterBarProps {
  firmaList: string[]
}

const STATUS_OPTIONS = [
  { value: '1', label: '1 — Direkt gemeldet (Grün)' },
  { value: '2', label: '2 — Gemeldet (Gelbgrün)' },
  { value: '3', label: '3 — Sporadisch (Orange)' },
  { value: '4', label: '4 — Nicht informiert (Rot)' },
  { value: '5', label: '5 — Verhandlung (Gelb)' },
]

export function FilterBar({ firmaList }: FilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page')
      router.replace(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="flex flex-wrap gap-2">
      <Select
        value={searchParams.get('status') ?? 'all'}
        onValueChange={v => updateParam('status', v)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Status</SelectItem>
          {STATUS_OPTIONS.map(o => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get('firma') ?? 'all'}
        onValueChange={v => updateParam('firma', v)}
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Firma" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Firmen</SelectItem>
          {firmaList.map(f => (
            <SelectItem key={f} value={f}>{f}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/search-bar.tsx src/components/filter-bar.tsx
git commit -m "feat: add SearchBar and FilterBar with URL param sync"
```

---

### Task 9: ShortageDrawer Component

**Files:**
- Create: `src/components/shortage-drawer.tsx`

- [ ] **Step 1: Create ShortageDrawer**

Create `src/components/shortage-drawer.tsx`:
```typescript
'use client'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from './status-badge'
import type { Shortage } from '@/lib/types'
import { ExternalLink } from 'lucide-react'

interface ShortageDrawerProps {
  shortage: Shortage | null
  onClose: () => void
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 border-b last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value ?? '—'}</span>
    </div>
  )
}

export function ShortageDrawer({ shortage, onClose }: ShortageDrawerProps) {
  return (
    <Sheet open={!!shortage} onOpenChange={open => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        {shortage && (
          <>
            <SheetHeader className="mb-4">
              <SheetTitle className="text-base leading-tight">{shortage.bezeichnung}</SheetTitle>
              <SheetDescription>{shortage.firma}</SheetDescription>
            </SheetHeader>

            <div className="flex gap-2 mb-4 flex-wrap">
              <StatusBadge code={shortage.statusCode} showText />
              <Badge variant="outline">{shortage.atcCode}</Badge>
            </div>

            <div className="divide-y">
              <DetailRow label="GTIN" value={shortage.gtin} />
              <DetailRow label="Pharmacode" value={shortage.pharmacode} />
              <DetailRow label="Voraussichtlich lieferbar" value={shortage.datumLieferfahigkeit} />
              <DetailRow label="Letzte Mutation" value={shortage.datumLetzteMutation} />
              <DetailRow label="Tage seit erster Meldung" value={shortage.tageSeitMeldung} />
              <DetailRow label="Generic Group" value={shortage.gengrp} />
              <DetailRow
                label="Erste Erfassung (unser System)"
                value={new Date(shortage.firstSeenAt).toLocaleDateString('de-CH')}
              />
              <DetailRow
                label="Quelle"
                value={
                  <a
                    href={shortage.detailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    drugshortage.ch <ExternalLink className="h-3 w-3" />
                  </a>
                }
              />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/shortage-drawer.tsx
git commit -m "feat: add ShortageDrawer slide-out component"
```

---

### Task 10: ShortagesTable Component

**Files:**
- Create: `src/components/shortages-table.tsx`

- [ ] **Step 1: Create ShortagesTable**

Create `src/components/shortages-table.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { StatusBadge } from './status-badge'
import { ShortageDrawer } from './shortage-drawer'
import type { Shortage } from '@/lib/types'
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'

interface ShortagesTableProps {
  shortages: Shortage[]
  total: number
  page: number
  perPage: number
}

const COLUMNS: { key: keyof Shortage; label: string; sortable?: boolean }[] = [
  { key: 'bezeichnung', label: 'Bezeichnung', sortable: true },
  { key: 'firma', label: 'Firma', sortable: true },
  { key: 'statusCode', label: 'Status', sortable: true },
  { key: 'datumLieferfahigkeit', label: 'Lieferbar ab' },
  { key: 'tageSeitMeldung', label: 'Tage', sortable: true },
  { key: 'atcCode', label: 'ATC' },
]

export function ShortagesTable({ shortages, total, page, perPage }: ShortagesTableProps) {
  const [selected, setSelected] = useState<Shortage | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const totalPages = Math.ceil(total / perPage)

  const navigate = (params: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(params)) {
      if (v) p.set(k, v)
      else p.delete(k)
    }
    router.replace(`${pathname}?${p.toString()}`)
  }

  const handleSort = (key: string) => {
    const current = searchParams.get('sort') ?? ''
    const [currentKey, currentDir] = current.split(':')
    const newDir = currentKey === key && currentDir === 'asc' ? 'desc' : 'asc'
    navigate({ sort: `${key}:${newDir}` })
  }

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {COLUMNS.map(col => (
                <TableHead key={col.key} className="whitespace-nowrap">
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      {col.label}
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  ) : col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {shortages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} className="text-center text-muted-foreground py-12">
                  Keine Engpässe gefunden
                </TableCell>
              </TableRow>
            ) : (
              shortages.map(s => (
                <TableRow
                  key={s.gtin}
                  onClick={() => setSelected(s)}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium max-w-[280px] truncate" title={s.bezeichnung}>
                    {s.bezeichnung}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {s.firma}
                  </TableCell>
                  <TableCell>
                    <StatusBadge code={s.statusCode} />
                  </TableCell>
                  <TableCell className="text-sm">{s.datumLieferfahigkeit}</TableCell>
                  <TableCell className="text-sm text-right tabular-nums">{s.tageSeitMeldung}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{s.atcCode}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <p className="text-sm text-muted-foreground">
            {total} Einträge · Seite {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => navigate({ page: String(page - 1) })}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => navigate({ page: String(page + 1) })}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <ShortageDrawer shortage={selected} onClose={() => setSelected(null)} />
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/shortages-table.tsx
git commit -m "feat: add ShortagesTable with sorting, pagination and row drawer"
```

---

### Task 11: Dashboard Page

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update layout.tsx**

Replace `src/app/layout.tsx`:
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Swiss Drug Shortage Tracker',
  description: 'Aktuelle Lieferengpässe bei Medikamenten in der Schweiz — täglich aktualisiert.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Build main dashboard page**

Replace `src/app/page.tsx`:
```typescript
import { Suspense } from 'react'
import { queryShortages, getKPIStats, getFirmaList } from '@/lib/db'
import { KPICards } from '@/components/kpi-cards'
import { SearchBar } from '@/components/search-bar'
import { FilterBar } from '@/components/filter-bar'
import { ShortagesTable } from '@/components/shortages-table'
import type { ShortagesQuery } from '@/lib/types'
import { Pill } from 'lucide-react'

interface PageProps {
  searchParams: Promise<Record<string, string>>
}

export const revalidate = 3600 // ISR: revalidate every hour

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams
  const query: ShortagesQuery = {
    search: params.search,
    status: params.status,
    firma: params.firma,
    atc: params.atc,
    page: params.page ? parseInt(params.page, 10) : 1,
    sort: params.sort ?? 'tageSeitMeldung:desc',
    perPage: 50,
  }

  const [response, kpi, firmaList] = await Promise.all([
    queryShortages(query),
    getKPIStats(),
    getFirmaList(),
  ])

  const lastUpdated = kpi.lastScrapedAt
    ? new Date(kpi.lastScrapedAt).toLocaleDateString('de-CH', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : 'noch nicht aktualisiert'

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Pill className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Swiss Drug Shortage Tracker
              </h1>
              <p className="text-sm text-muted-foreground">
                Aktuelle Lieferengpässe bei Medikamenten in der Schweiz
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            Stand: {lastUpdated}
          </p>
        </div>

        {/* KPI Cards */}
        <KPICards stats={kpi} />

        {/* Search + Filters */}
        <Suspense>
          <div className="flex flex-col sm:flex-row gap-2">
            <SearchBar />
            <FilterBar firmaList={firmaList} />
          </div>
        </Suspense>

        {/* Table */}
        <Suspense>
          <ShortagesTable
            shortages={response.data}
            total={response.total}
            page={response.page}
            perPage={response.perPage}
          />
        </Suspense>

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center pt-4 border-t">
          Daten von{' '}
          <a href="https://www.drugshortage.ch" target="_blank" rel="noopener noreferrer"
            className="underline hover:text-foreground">
            drugshortage.ch
          </a>
          {' '}· täglich aktualisiert · keine Gewähr auf Vollständigkeit
        </p>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 4: Run first scrape locally**

```bash
npm run scrape
```

Expected: Output like `[scrape] Fetched 721 shortages · New: 721, Removed: 0`

- [ ] **Step 5: Start dev server and verify dashboard**

```bash
npm run dev
```

Open http://localhost:3000 — should show KPI cards, search, filter, and table with real data.

- [ ] **Step 6: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx
git commit -m "feat: assemble dashboard page with all components"
```

---

### Task 12: Build Verification

**Files:** none (verification only)

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 3: Production build**

```bash
npm run build
```

Expected: Build succeeds with no errors. 

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: verified build and tests pass"
```
