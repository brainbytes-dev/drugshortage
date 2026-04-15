import fs from 'fs'
import path from 'path'
import type { Shortage, ShortagesQuery, ShortagesResponse, KPIStats } from './types'

function getDbPath(): string {
  return process.env.DB_PATH ?? path.join(process.cwd(), 'data', 'shortages.json')
}

function readDB(): Shortage[] {
  const DB_PATH = getDbPath()
  if (!fs.existsSync(DB_PATH)) return []
  const raw = fs.readFileSync(DB_PATH, 'utf-8')
  try { return JSON.parse(raw) } catch { return [] }
}

function writeDB(data: Shortage[]): void {
  const DB_PATH = getDbPath()
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
