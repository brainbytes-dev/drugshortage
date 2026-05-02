/**
 * engpass.radar MCP endpoint — Streamable HTTP transport (stateless)
 * Spec: https://ts.sdk.modelcontextprotocol.io/documents/server.html
 * URL: https://engpassradar.ch/api/mcp  |  https://mcp.engpassradar.ch
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const BASE = 'https://engpassradar.ch'

async function apiGet(path: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<unknown> {
  const url = new URL(`${BASE}${path}`)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, String(v))
  }
  const res = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json', 'User-Agent': 'engpassradar-mcp/0.1' },
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json()
}

function createMcpServer(): McpServer {
  const server = new McpServer({ name: 'engpassradar', version: '0.1.0' })

  server.tool(
    'search_shortages',
    'Full-text search of current Swiss medication shortages. Searches product name, active ingredient (Wirkstoff), and company. Use for: "Ibuprofen Engpass", "was ist N02BE01 betroffen", "Novartis aktuelle Probleme".',
    {
      query: z.string().describe('Search term'),
      atc: z.string().optional().describe('ATC code prefix, e.g. "C09" or "C09AA"'),
      firma: z.string().optional().describe('Manufacturer name (partial match)'),
      limit: z.number().optional().default(20).describe('Max results (default 20)'),
    },
    async ({ query, atc, firma, limit }) => {
      const data = await apiGet('/api/v1/shortages', { search: query, atc, firma, perPage: Math.min(100, limit ?? 20) })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    }
  )

  server.tool(
    'get_shortage',
    'Fetch full details for a single shortage by GTIN. Returns product name, company, ATC, status, expected return date, severity score, and BWL flag.',
    { gtin: z.string().describe('GTIN (7–14 digits), e.g. "7680555710014"') },
    async ({ gtin }) => {
      const data = await apiGet(`/api/v1/shortages/${encodeURIComponent(gtin)}`)
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    }
  )

  server.tool(
    'find_alternatives',
    'Find alternative products for a medication in shortage. Returns same-substance and same-class alternatives, each with their own current shortage status. THIS IS THE HIGHEST-VALUE TOOL — use it whenever asked "Was kann ich statt X verwenden?", "Welche Alternativen gibt es für Y?", "substitute for [product]".',
    { gtin: z.string().describe('GTIN of the product in shortage') },
    async ({ gtin }) => {
      const data = await apiGet('/api/alternatives', { gtin })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    }
  )

  server.tool(
    'check_atc_group',
    'Check how many products in a given ATC therapeutic class are currently in shortage. Accepts any ATC depth (C09, C09AA, C09AA08). Use for: "Wie viele ACE-Hemmer sind betroffen?", "is anything in C09 affected?".',
    {
      atc: z.string().describe('ATC code or prefix, e.g. "C09", "C09AA"'),
      limit: z.number().optional().default(50).describe('Max products (default 50)'),
    },
    async ({ atc, limit }) => {
      const data = await apiGet('/api/v1/shortages', { atc, perPage: Math.min(200, limit ?? 50) }) as { data: unknown[]; total: number }
      const result = { atc, affectedCount: data.total, shown: data.data.length, shortages: data.data, meta: { source: 'engpassradar.ch' } }
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'list_active_shortages',
    'List currently active medication shortages with optional filters. Use for dashboards, "was ist gerade betroffen", bulk monitoring.',
    {
      atc: z.string().optional().describe('Filter by ATC prefix'),
      firma: z.string().optional().describe('Filter by manufacturer'),
      limit: z.number().optional().default(50).describe('Max results (default 50)'),
      page: z.number().optional().default(1).describe('Page number'),
    },
    async ({ atc, firma, limit, page }) => {
      const data = await apiGet('/api/v1/shortages', { atc, firma, perPage: Math.min(200, limit ?? 50), page: page ?? 1, sort: 'tageSeitMeldung:desc' })
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    }
  )

  server.tool(
    'get_company_status',
    'All current shortages for a manufacturer, plus communication transparency metrics. Use for: "Wie transparent kommuniziert Novartis?", "aktuelle Probleme bei Sandoz".',
    { firma: z.string().describe('Manufacturer name (partial match)') },
    async ({ firma }) => {
      const data = await apiGet('/api/v1/shortages', { firma, perPage: 200 }) as {
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
        statusBreakdown, currentShortages: shortages.slice(0, 20), meta: { source: 'engpassradar.ch' },
      }
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'get_shortage_timeline',
    'Week-by-week history of total active shortages in Switzerland. Use for: "wird es besser oder schlechter?", trend questions.',
    { weeks: z.number().optional().default(12).describe('Number of past weeks (default 12, max 52)') },
    async ({ weeks }) => {
      const n = Math.min(52, weeks ?? 12)
      const data = await apiGet('/api/v1/timeline', { weeks: n }) as { data: unknown[] }
      const result = { data: data.data.slice(-n), meta: { weeks: n, source: 'engpassradar.ch' } }
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
    }
  )

  server.tool(
    'get_weekly_summary',
    'Summary statistics: total active shortages, critical count, BWL affected. Quick situational overview.',
    {},
    async () => {
      const data = await apiGet('/api/v1/stats')
      return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] }
    }
  )

  return server
}

async function handleMcp(req: Request): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — required for serverless/Vercel
    enableJsonResponse: true,      // allow plain JSON for clients without SSE
  })
  const server = createMcpServer()
  await server.connect(transport)
  // Pass parsedBody for POST to avoid reading the stream twice
  const parsedBody = req.method === 'POST' ? await req.json().catch(() => undefined) : undefined
  return transport.handleRequest(req, { parsedBody })
}

export async function GET(req: Request): Promise<Response> {
  // SSE GET requires Accept: text/event-stream — return info JSON for other clients (e.g. Smithery probe)
  const accept = req.headers.get('accept') ?? ''
  if (!accept.includes('text/event-stream')) {
    return new Response(JSON.stringify({
      name: 'engpassradar',
      version: '0.1.0',
      description: 'Swiss medication shortage MCP server — 8 tools for drug shortage data',
      transport: 'streamable-http',
      endpoint: 'https://engpassradar.ch/api/mcp',
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
