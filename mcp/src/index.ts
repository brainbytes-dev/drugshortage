#!/usr/bin/env node
/**
 * engpass.radar MCP server
 *
 * Exposes Swiss medication shortage data as agent tools.
 * Calls the public engpassradar.ch REST API — no separate backend needed.
 *
 * Usage (stdio, Claude Desktop / Cursor / any MCP client):
 *   node dist/index.js
 *
 * Optional env vars:
 *   ENGPASS_API_KEY   — Bearer token for Pro/Klinik tier (higher rate limits)
 *   ENGPASS_BASE_URL  — Override API base (default: https://engpassradar.ch)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

const BASE = (process.env.ENGPASS_BASE_URL ?? 'https://engpassradar.ch').replace(/\/$/, '')
const API_KEY = process.env.ENGPASS_API_KEY

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function get(path: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<unknown> {
  const url = new URL(`${BASE}${path}`)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
  }

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'User-Agent': 'engpassradar-mcp/0.1',
  }
  if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`

  const res = await fetch(url.toString(), { headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API error ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'search_shortages',
    description: `Full-text search of current Swiss medication shortages on engpassradar.ch.

Searches product name, active ingredient (Wirkstoff), and company name.
Returns ranked matches with status, severity score, and ATC code.

Use this for: "Ibuprofen Engpass", "Novartis aktuelle Probleme", "was ist N02BE01 betroffen"`,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term — product name, Wirkstoff, or company' },
        atc: { type: 'string', description: 'Filter by ATC code prefix, e.g. "C09" or "C09AA"' },
        firma: { type: 'string', description: 'Filter by manufacturer name (partial match)' },
        limit: { type: 'number', description: 'Max results (default 20, max 100)', default: 20 },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_shortage',
    description: `Fetch full details for a single shortage by GTIN (barcode).

Returns: product name, company, ATC code, shortage status, expected return date,
Wirkstoff, Swissmedic number, prices (PPUB/PEXF), severity score with breakdown,
and whether the product is on the BWL mandatory stock list.

Use this when you have a specific GTIN and need all information about that shortage.`,
    inputSchema: {
      type: 'object',
      properties: {
        gtin: { type: 'string', description: 'GTIN (7–14 digits), e.g. "7680555710014"' },
      },
      required: ['gtin'],
    },
  },
  {
    name: 'find_alternatives',
    description: `Find alternative products for a medication that is in shortage.

Given a GTIN or Wirkstoff (ATC code), returns same-substance alternatives (different brand,
same active ingredient) and same-ATC-class alternatives, each with their OWN current shortage
status so you can identify which substitutes are actually available.

THIS IS THE HIGHEST-VALUE TOOL — use it whenever a pharmacist or clinician asks:
"Was kann ich statt X verwenden?", "Welche Alternativen gibt es für Y?",
"Inhibace nicht lieferbar — was gibt es für C09AA?", "substitute for [product]"`,
    inputSchema: {
      type: 'object',
      properties: {
        gtin: { type: 'string', description: 'GTIN of the product in shortage' },
      },
      required: ['gtin'],
    },
  },
  {
    name: 'check_atc_group',
    description: `Check how many products in a given ATC therapeutic class are currently in shortage.

Accepts any ATC depth: "C09" (ACE inhibitors class), "C09AA" (ACE inhibitors plain),
or "C09AA08" (single substance). Returns affected count, total in class, and a list
of affected products with severity scores.

Use for: "Wie viele ACE-Hemmer sind betroffen?", "ist die ganze C09-Gruppe problematisch?",
"therapeutic class impact assessment"`,
    inputSchema: {
      type: 'object',
      properties: {
        atc: { type: 'string', description: 'ATC code or prefix, e.g. "C09", "C09AA", "N02BE01"' },
        limit: { type: 'number', description: 'Max products to return (default 50)', default: 50 },
      },
      required: ['atc'],
    },
  },
  {
    name: 'list_active_shortages',
    description: `List currently active medication shortages with optional filters.

Returns paginated results sorted by severity (most critical first).
Use for: dashboards, "was ist gerade alles betroffen", bulk monitoring.
For free-text search use search_shortages instead.`,
    inputSchema: {
      type: 'object',
      properties: {
        atc: { type: 'string', description: 'Filter by ATC prefix' },
        firma: { type: 'string', description: 'Filter by manufacturer' },
        limit: { type: 'number', description: 'Max results (default 50, max 200)', default: 50 },
        page: { type: 'number', description: 'Page number (default 1)', default: 1 },
      },
    },
  },
  {
    name: 'get_company_status',
    description: `All current shortages for a specific manufacturer, plus aggregate reliability metrics.

Returns active shortages, average severity score, and breakdown by communication
status (1 = proactive communication, 4 = no information provided).

Use for: "Wie transparent kommuniziert Novartis?", "aktuelle Probleme bei Sandoz",
"Lieferantencheck vor Beschaffungsentscheidung"`,
    inputSchema: {
      type: 'object',
      properties: {
        firma: { type: 'string', description: 'Manufacturer name (partial match supported)' },
      },
      required: ['firma'],
    },
  },
  {
    name: 'get_shortage_timeline',
    description: `Week-by-week history of total active shortages in Switzerland.

Returns a time series of how many shortages were active each week.
Use for trend questions: "wird es besser oder schlechter?",
"Engpass-Situation im Vergleich zum letzten Quartal"`,
    inputSchema: {
      type: 'object',
      properties: {
        weeks: { type: 'number', description: 'Number of past weeks to return (default 12, max 52)', default: 12 },
      },
    },
  },
  {
    name: 'get_weekly_summary',
    description: `Summary statistics for the current shortage situation in Switzerland.

Returns: total active shortages, count of critical (high-severity) ones,
BWL mandatory stock items affected. Same data as the engpass.radar dashboard KPIs.
Use for: quick situational overview, newsletter-style summaries.`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
] as const

// ── Tool implementations ──────────────────────────────────────────────────────

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {

    case 'search_shortages':
      return get('/api/v1/shortages', {
        search: args.query as string,
        atc: args.atc as string | undefined,
        firma: args.firma as string | undefined,
        perPage: Math.min(100, (args.limit as number | undefined) ?? 20),
      })

    case 'get_shortage':
      return get(`/api/v1/shortages/${encodeURIComponent(args.gtin as string)}`)

    case 'find_alternatives': {
      // alternatives endpoint takes ?gtin=
      const result = await get('/api/alternatives', { gtin: args.gtin as string })
      return result
    }

    case 'check_atc_group': {
      const atc = args.atc as string
      const data = await get('/api/v1/shortages', {
        atc,
        perPage: Math.min(200, (args.limit as number | undefined) ?? 50),
      }) as { data: unknown[]; total: number }

      const shortages = data.data as Array<{
        bezeichnung: string
        firma: string
        gtin: string
        atcCode: string
        tageSeitMeldung: number
        isActive: boolean
      }>

      return {
        atc,
        affectedCount: data.total,
        shown: shortages.length,
        shortages: shortages.map(s => ({
          bezeichnung: s.bezeichnung,
          firma: s.firma,
          gtin: s.gtin,
          atcCode: s.atcCode,
          tageSeitMeldung: s.tageSeitMeldung,
        })),
        meta: { source: 'engpassradar.ch', docsUrl: 'https://engpassradar.ch/api-docs' },
      }
    }

    case 'list_active_shortages':
      return get('/api/v1/shortages', {
        atc: args.atc as string | undefined,
        firma: args.firma as string | undefined,
        perPage: Math.min(200, (args.limit as number | undefined) ?? 50),
        page: (args.page as number | undefined) ?? 1,
        sort: 'tageSeitMeldung:desc',
      })

    case 'get_company_status': {
      const firma = args.firma as string
      const data = await get('/api/v1/shortages', { firma, perPage: 200 }) as {
        data: Array<{ statusCode: number; tageSeitMeldung: number; bezeichnung: string; gtin: string }>
        total: number
      }

      const shortages = data.data
      const statusBreakdown = shortages.reduce<Record<number, number>>((acc, s) => {
        acc[s.statusCode] = (acc[s.statusCode] ?? 0) + 1
        return acc
      }, {})
      const avgDays = shortages.length > 0
        ? Math.round(shortages.reduce((sum, s) => sum + s.tageSeitMeldung, 0) / shortages.length)
        : 0
      const noInfoPct = shortages.length > 0
        ? Math.round(((statusBreakdown[4] ?? 0) / shortages.length) * 100)
        : 0

      const STATUS_LABELS: Record<number, string> = {
        1: 'Direkt gemeldet', 2: 'Gemeldet', 3: 'Sporadisch', 4: 'Keine Info', 5: 'Verhandlung',
      }

      return {
        firma,
        activeShortages: data.total,
        avgDaysActive: avgDays,
        noInfoPercent: noInfoPct,
        communicationNote: noInfoPct >= 50
          ? 'Schlechte Transparenz — Mehrheit der Meldungen ohne Informationen'
          : noInfoPct >= 25
            ? 'Mittlere Transparenz'
            : 'Gute Transparenz — Firma kommuniziert proaktiv',
        statusBreakdown: Object.entries(statusBreakdown).map(([code, count]) => ({
          statusCode: Number(code),
          label: STATUS_LABELS[Number(code)] ?? 'Unbekannt',
          count,
          percent: Math.round((count / shortages.length) * 100),
        })).sort((a, b) => a.statusCode - b.statusCode),
        currentShortages: shortages.slice(0, 20).map(s => ({
          bezeichnung: s.bezeichnung,
          gtin: s.gtin,
          tageSeitMeldung: s.tageSeitMeldung,
          statusCode: s.statusCode,
        })),
        meta: {
          firmaPage: `https://engpassradar.ch/firma/${firma.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
          source: 'engpassradar.ch',
        },
      }
    }

    case 'get_shortage_timeline': {
      const weeks = Math.min(52, (args.weeks as number | undefined) ?? 12)
      const data = await get('/api/v1/timeline', { weeks }) as { data: unknown[] }
      return { data: data.data.slice(-weeks), meta: { weeks, source: 'engpassradar.ch' } }
    }

    case 'get_weekly_summary':
      return get('/api/v1/stats')

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

// ── Server setup ──────────────────────────────────────────────────────────────

const server = new Server(
  { name: 'engpassradar', version: '0.1.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map(t => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params
  try {
    const result = await callTool(name, args as Record<string, unknown>)
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    }
  } catch (err) {
    return {
      content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
      isError: true,
    }
  }
})

const transport = new StdioServerTransport()
await server.connect(transport)
