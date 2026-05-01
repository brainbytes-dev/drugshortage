/**
 * engpass.radar MCP endpoint — Streamable HTTP transport (stateless)
 * Compatible with Claude.ai, Smithery, Cursor, and any MCP client.
 * URL: https://engpassradar.ch/api/mcp
 */
import { Server } from '@modelcontextprotocol/sdk/server'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

export const dynamic = 'force-dynamic'

const BASE = 'https://engpassradar.ch'

async function apiGet(path: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<unknown> {
  const url = new URL(`${BASE}${path}`)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, String(v))
  }
  const res = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json', 'User-Agent': 'engpassradar-mcp/0.1' },
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json()
}

const TOOLS = [
  {
    name: 'search_shortages',
    description: 'Full-text search of current Swiss medication shortages. Searches product name, active ingredient (Wirkstoff), and company. Use for: "Ibuprofen Engpass", "was ist N02BE01 betroffen", "Novartis aktuelle Probleme".',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search term' },
        atc: { type: 'string', description: 'ATC code prefix, e.g. "C09" or "C09AA"' },
        firma: { type: 'string', description: 'Manufacturer name (partial match)' },
        limit: { type: 'number', description: 'Max results (default 20)', default: 20 },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_shortage',
    description: 'Fetch full details for a single shortage by GTIN. Returns product name, company, ATC, status, expected return date, severity score, and BWL flag.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        gtin: { type: 'string', description: 'GTIN (7–14 digits), e.g. "7680555710014"' },
      },
      required: ['gtin'],
    },
  },
  {
    name: 'find_alternatives',
    description: 'Find alternative products for a medication in shortage. Returns same-substance and same-class alternatives, each with their own current shortage status. THIS IS THE HIGHEST-VALUE TOOL — use it whenever asked "Was kann ich statt X verwenden?", "Welche Alternativen gibt es für Y?", "substitute for [product]".',
    inputSchema: {
      type: 'object' as const,
      properties: {
        gtin: { type: 'string', description: 'GTIN of the product in shortage' },
      },
      required: ['gtin'],
    },
  },
  {
    name: 'check_atc_group',
    description: 'Check how many products in a given ATC therapeutic class are currently in shortage. Accepts any ATC depth (C09, C09AA, C09AA08). Use for: "Wie viele ACE-Hemmer sind betroffen?", "is anything in C09 affected?".',
    inputSchema: {
      type: 'object' as const,
      properties: {
        atc: { type: 'string', description: 'ATC code or prefix, e.g. "C09", "C09AA"' },
        limit: { type: 'number', description: 'Max products to return (default 50)', default: 50 },
      },
      required: ['atc'],
    },
  },
  {
    name: 'list_active_shortages',
    description: 'List currently active medication shortages with optional filters. Use for dashboards, "was ist gerade betroffen", bulk monitoring.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        atc: { type: 'string', description: 'Filter by ATC prefix' },
        firma: { type: 'string', description: 'Filter by manufacturer' },
        limit: { type: 'number', description: 'Max results (default 50)', default: 50 },
        page: { type: 'number', description: 'Page number (default 1)', default: 1 },
      },
    },
  },
  {
    name: 'get_company_status',
    description: 'All current shortages for a manufacturer, plus communication transparency metrics. Use for: "Wie transparent kommuniziert Novartis?", "aktuelle Probleme bei Sandoz".',
    inputSchema: {
      type: 'object' as const,
      properties: {
        firma: { type: 'string', description: 'Manufacturer name (partial match)' },
      },
      required: ['firma'],
    },
  },
  {
    name: 'get_shortage_timeline',
    description: 'Week-by-week history of total active shortages in Switzerland. Use for: "wird es besser oder schlechter?", trend questions.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        weeks: { type: 'number', description: 'Number of past weeks (default 12, max 52)', default: 12 },
      },
    },
  },
  {
    name: 'get_weekly_summary',
    description: 'Summary statistics: total active shortages, critical count, BWL affected. Quick situational overview.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
]

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search_shortages':
      return apiGet('/api/v1/shortages', {
        search: args.query as string,
        atc: args.atc as string | undefined,
        firma: args.firma as string | undefined,
        perPage: Math.min(100, (args.limit as number | undefined) ?? 20),
      })

    case 'get_shortage':
      return apiGet(`/api/v1/shortages/${encodeURIComponent(args.gtin as string)}`)

    case 'find_alternatives':
      return apiGet('/api/alternatives', { gtin: args.gtin as string })

    case 'check_atc_group': {
      const data = await apiGet('/api/v1/shortages', {
        atc: args.atc as string,
        perPage: Math.min(200, (args.limit as number | undefined) ?? 50),
      }) as { data: unknown[]; total: number }
      return {
        atc: args.atc,
        affectedCount: data.total,
        shown: data.data.length,
        shortages: data.data,
        meta: { source: 'engpassradar.ch' },
      }
    }

    case 'list_active_shortages':
      return apiGet('/api/v1/shortages', {
        atc: args.atc as string | undefined,
        firma: args.firma as string | undefined,
        perPage: Math.min(200, (args.limit as number | undefined) ?? 50),
        page: (args.page as number | undefined) ?? 1,
        sort: 'tageSeitMeldung:desc',
      })

    case 'get_company_status': {
      const firma = args.firma as string
      const data = await apiGet('/api/v1/shortages', { firma, perPage: 200 }) as {
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
      return {
        firma,
        activeShortages: data.total,
        avgDaysActive: avgDays,
        noInfoPercent: noInfoPct,
        communicationNote: noInfoPct >= 50 ? 'Schlechte Transparenz' : noInfoPct >= 25 ? 'Mittlere Transparenz' : 'Gute Transparenz',
        statusBreakdown,
        currentShortages: shortages.slice(0, 20),
        meta: { source: 'engpassradar.ch' },
      }
    }

    case 'get_shortage_timeline': {
      const weeks = Math.min(52, (args.weeks as number | undefined) ?? 12)
      const data = await apiGet('/api/v1/timeline', { weeks }) as { data: unknown[] }
      return { data: data.data.slice(-weeks), meta: { weeks, source: 'engpassradar.ch' } }
    }

    case 'get_weekly_summary':
      return apiGet('/api/v1/stats')

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

function createMcpServer(): Server {
  const server = new Server(
    { name: 'engpassradar', version: '0.1.0' },
    { capabilities: { tools: {} } }
  )

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
  }))

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params
    try {
      const result = await callTool(name, args as Record<string, unknown>)
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] }
    } catch (err) {
      return {
        content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      }
    }
  })

  return server
}

async function handleMcp(req: Request): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — required for serverless
    enableJsonResponse: true,      // allow plain JSON for clients without SSE support
  })
  const server = createMcpServer()
  await server.connect(transport)
  return transport.handleRequest(req)
}

export async function GET(req: Request): Promise<Response> {
  return handleMcp(req)
}

export async function POST(req: Request): Promise<Response> {
  return handleMcp(req)
}

export async function DELETE(req: Request): Promise<Response> {
  return handleMcp(req)
}
