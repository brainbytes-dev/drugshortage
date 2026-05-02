/**
 * engpass.radar MCP endpoint — Streamable HTTP transport (stateless)
 * Spec: https://ts.sdk.modelcontextprotocol.io/documents/server.html
 * URL: https://engpassradar.ch/api/mcp  |  https://mcp.engpassradar.ch
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { z } from 'zod/v3'

export const dynamic = 'force-dynamic'

const BASE = 'https://engpassradar.ch'

function extractApiKey(req: Request): string | undefined {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim()
  const xKey = req.headers.get('x-api-key')
  if (xKey) return xKey.trim()
  const url = new URL(req.url)
  return url.searchParams.get('ENGPASS_API_KEY') ?? undefined
}

async function apiGet(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
  apiKey?: string,
): Promise<unknown> {
  const url = new URL(`${BASE}${path}`)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, String(v))
  }
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'User-Agent': 'engpassradar-mcp/0.1',
  }
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
  const res = await fetch(url.toString(), { headers })
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json()
}

// Reusable output schema shapes
const shortageShape = {
  gtin: z.string(),
  bezeichnung: z.string(),
  firma: z.string(),
  atcCode: z.string(),
  statusCode: z.number(),
  statusText: z.string().optional(),
  tageSeitMeldung: z.number(),
  isActive: z.boolean(),
}

const paginatedOutput = {
  data: z.array(z.object(shortageShape)),
  total: z.number(),
  page: z.number(),
  perPage: z.number(),
}

function createMcpServer(apiKey?: string): McpServer {
  const server = new McpServer({ name: 'engpassradar', version: '0.1.0' })
  const get = (path: string, params?: Record<string, string | number | boolean | undefined>) => apiGet(path, params, apiKey)

  server.registerTool(
    'shortage.search',
    {
      title: 'Search Shortages',
      description: 'Full-text search of current Swiss medication shortages. Searches product name, active ingredient (Wirkstoff), and company. Use for: "Ibuprofen Engpass", "was ist N02BE01 betroffen", "Novartis aktuelle Probleme".',
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        query: z.string().describe('Search term — product name, Wirkstoff, or company'),
        atc: z.string().optional().describe('ATC code prefix, e.g. "C09" or "C09AA"'),
        firma: z.string().optional().describe('Manufacturer name (partial match)'),
        limit: z.number().optional().default(20).describe('Max results (default 20, max 100)'),
      },
      outputSchema: { data: z.array(z.object(shortageShape)), total: z.number() },
    },
    async ({ query, atc, firma, limit }) => {
      const data = await get('/api/v1/shortages', { search: query, atc, firma, perPage: Math.min(100, limit ?? 20) })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    }
  )

  server.registerTool(
    'shortage.get',
    {
      title: 'Get Shortage Details',
      description: 'Fetch full details for a single shortage by GTIN. Returns product name, company, ATC, status, expected return date, severity score (0–100), and BWL mandatory stock flag.',
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        gtin: z.string().describe('GTIN (7–14 digits), e.g. "7680555710014"'),
      },
      outputSchema: {
        data: z.object({
          ...shortageShape,
          isBwl: z.boolean(),
          score: z.object({ total: z.number(), label: z.string() }),
        }),
      },
    },
    async ({ gtin }) => {
      const data = await get(`/api/v1/shortages/${encodeURIComponent(gtin)}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    }
  )

  server.registerTool(
    'shortage.alternatives',
    {
      title: 'Find Alternatives',
      description: 'Find alternative products for a medication in shortage. Returns same-substance and same-class alternatives, each with their own current shortage status. THIS IS THE HIGHEST-VALUE TOOL — use it whenever asked "Was kann ich statt X verwenden?", "Welche Alternativen gibt es für Y?", "substitute for [product]".',
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        gtin: z.string().describe('GTIN of the product in shortage'),
      },
      outputSchema: {
        gleicheFirma: z.array(z.object({ bezeichnung: z.string(), firma: z.string(), gtin: z.string() })),
        alleAlternativen: z.array(z.object({ bezeichnung: z.string(), firma: z.string(), gtin: z.string(), typ: z.string().optional() })),
      },
    },
    async ({ gtin }) => {
      const data = await get('/api/alternatives', { gtin })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    }
  )

  server.registerTool(
    'atc.check',
    {
      title: 'Check ATC Group',
      description: 'Check how many products in a given ATC therapeutic class are currently in shortage. Accepts any ATC depth (C09, C09AA, C09AA08). Use for: "Wie viele ACE-Hemmer sind betroffen?", "is anything in C09 affected?".',
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        atc: z.string().describe('ATC code or prefix, e.g. "C09", "C09AA"'),
        limit: z.number().optional().default(50).describe('Max products to return (default 50)'),
      },
      outputSchema: {
        atc: z.string(),
        affectedCount: z.number(),
        shown: z.number(),
        shortages: z.array(z.object(shortageShape)),
      },
    },
    async ({ atc, limit }) => {
      const data = await get('/api/v1/shortages', { atc, perPage: Math.min(200, limit ?? 50) }) as { data: unknown[]; total: number }
      const result = { atc, affectedCount: data.total, shown: data.data.length, shortages: data.data, meta: { source: 'engpassradar.ch' } }
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.registerTool(
    'shortage.list',
    {
      title: 'List Active Shortages',
      description: 'List currently active medication shortages with optional filters. Use for dashboards, "was ist gerade betroffen", bulk monitoring.',
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        atc: z.string().optional().describe('Filter by ATC prefix'),
        firma: z.string().optional().describe('Filter by manufacturer'),
        limit: z.number().optional().default(50).describe('Max results (default 50, max 200)'),
        page: z.number().optional().default(1).describe('Page number (default 1)'),
      },
      outputSchema: paginatedOutput,
    },
    async ({ atc, firma, limit, page }) => {
      const data = await get('/api/v1/shortages', { atc, firma, perPage: Math.min(200, limit ?? 50), page: page ?? 1, sort: 'tageSeitMeldung:desc' })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    }
  )

  server.registerTool(
    'company.status',
    {
      title: 'Get Company Status',
      description: 'All current shortages for a manufacturer, plus communication transparency metrics. Use for: "Wie transparent kommuniziert Novartis?", "aktuelle Probleme bei Sandoz", procurement decisions.',
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        firma: z.string().describe('Manufacturer name (partial match)'),
      },
      outputSchema: {
        firma: z.string(),
        activeShortages: z.number(),
        avgDaysActive: z.number(),
        noInfoPercent: z.number(),
        communicationNote: z.string(),
        statusBreakdown: z.record(z.string(), z.number()),
        currentShortages: z.array(z.object(shortageShape)),
      },
    },
    async ({ firma }) => {
      const data = await get('/api/v1/shortages', { firma, perPage: 200 }) as {
        data: Array<{ statusCode: number; tageSeitMeldung: number; bezeichnung: string; gtin: string }>
        total: number
      }
      const shortages = data.data
      const statusBreakdown = shortages.reduce<Record<number, number>>((acc, s) => { acc[s.statusCode] = (acc[s.statusCode] ?? 0) + 1; return acc }, {})
      const avgDays = shortages.length > 0 ? Math.round(shortages.reduce((sum, s) => sum + s.tageSeitMeldung, 0) / shortages.length) : 0
      const noInfoPct = shortages.length > 0 ? Math.round(((statusBreakdown[4] ?? 0) / shortages.length) * 100) : 0
      const result = {
        firma, activeShortages: data.total, avgDaysActive: avgDays, noInfoPercent: noInfoPct,
        communicationNote: noInfoPct >= 50 ? 'Schlechte Transparenz' : noInfoPct >= 25 ? 'Mittlere Transparenz' : 'Gute Transparenz',
        statusBreakdown, currentShortages: shortages.slice(0, 20),
      }
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.registerTool(
    'shortage.timeline',
    {
      title: 'Get Shortage Timeline',
      description: 'Week-by-week history of total active shortages in Switzerland. Use for: "wird es besser oder schlechter?", trend questions.',
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        weeks: z.number().optional().default(12).describe('Number of past weeks (default 12, max 52)'),
      },
      outputSchema: {
        data: z.array(z.object({ week: z.string(), active: z.number() })),
        meta: z.object({ weeks: z.number(), source: z.string() }),
      },
    },
    async ({ weeks }) => {
      const n = Math.min(52, weeks ?? 12)
      const data = await get('/api/v1/timeline', { weeks: n }) as { data: unknown[] }
      const result = { data: data.data.slice(-n), meta: { weeks: n, source: 'engpassradar.ch' } }
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.registerTool(
    'stats.weekly',
    {
      title: 'Get Weekly Summary',
      description: 'Summary statistics: total active shortages, critical count, BWL affected. Quick situational overview — same data as the engpassradar.ch dashboard KPIs.',
      annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: false },
      inputSchema: {},
      outputSchema: {
        activeShortages: z.number(),
        criticalShortages: z.number().optional(),
        bwlAffected: z.number().optional(),
      },
    },
    async () => {
      const data = await get('/api/v1/stats')
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    }
  )

  return server
}

async function handleMcp(req: Request): Promise<Response> {
  const apiKey = extractApiKey(req)
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  const server = createMcpServer(apiKey)
  await server.connect(transport)
  const parsedBody = req.method === 'POST' ? await req.json().catch(() => undefined) : undefined
  return transport.handleRequest(req, { parsedBody })
}

export async function GET(req: Request): Promise<Response> {
  const accept = req.headers.get('accept') ?? ''
  if (!accept.includes('text/event-stream')) {
    return new Response(JSON.stringify({
      name: 'engpassradar',
      version: '0.1.0',
      description: 'Swiss medication shortage MCP server — 8 tools for drug shortage data from engpassradar.ch',
      transport: 'streamable-http',
      endpoint: 'https://engpassradar.ch/api/mcp',
      smithery: 'https://smithery.ai/server/engpassradar',
    }), { headers: { 'Content-Type': 'application/json' } })
  }
  return handleMcp(req)
}

export async function POST(req: Request): Promise<Response> {
  return handleMcp(req)
}

export async function DELETE(req: Request): Promise<Response> {
  return handleMcp(req)
}
