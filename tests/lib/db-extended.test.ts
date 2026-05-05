import {
  getFirmaList,
  saveOverviewStats,
  saveScrapeRun,
  upsertCompletedShortages,
} from '@/lib/db'
import { prisma } from '@/lib/prisma'
import type { Shortage, OverviewStats, ScrapeRun } from '@/lib/types'

// TODO: integration tests — require running Postgres + seeded test data (PrismaClientKnownRequestError on connection)
describe.skip('Database Extended Functions', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.shortage.deleteMany()
    await prisma.overviewStats.deleteMany()
    await prisma.scrapeRun.deleteMany()
  })

  describe('getFirmaList', () => {
    test('returns empty array when no active shortages exist', async () => {
      const result = await getFirmaList()
      expect(result).toEqual([])
    })

    test('returns distinct firma names from active shortages', async () => {
      await prisma.shortage.createMany({
        data: [
          {
            gtin: '111',
            pharmacode: '1',
            bezeichnung: 'Med A',
            firma: 'Firma A',
            atcCode: 'A01',
            gengrp: 'grp1',
            statusCode: 1,
            statusText: '1',
            datumLieferfahigkeit: '',
            datumLetzteMutation: '',
            tageSeitMeldung: 10,
            detailUrl: '',
            isActive: true,
          },
          {
            gtin: '222',
            pharmacode: '2',
            bezeichnung: 'Med B',
            firma: 'Firma B',
            atcCode: 'A02',
            gengrp: 'grp2',
            statusCode: 1,
            statusText: '1',
            datumLieferfahigkeit: '',
            datumLetzteMutation: '',
            tageSeitMeldung: 20,
            detailUrl: '',
            isActive: true,
          },
          {
            gtin: '333',
            pharmacode: '3',
            bezeichnung: 'Med C',
            firma: 'Firma A',
            atcCode: 'A03',
            gengrp: 'grp3',
            statusCode: 1,
            statusText: '1',
            datumLieferfahigkeit: '',
            datumLetzteMutation: '',
            tageSeitMeldung: 30,
            detailUrl: '',
            isActive: true,
          },
        ],
      })

      const result = await getFirmaList()
      expect(result).toHaveLength(2)
      expect(result).toContain('Firma A')
      expect(result).toContain('Firma B')
    })

    test('excludes inactive shortages', async () => {
      await prisma.shortage.createMany({
        data: [
          {
            gtin: '111',
            pharmacode: '1',
            bezeichnung: 'Med A',
            firma: 'Active Firma',
            atcCode: 'A01',
            gengrp: 'grp1',
            statusCode: 1,
            statusText: '1',
            datumLieferfahigkeit: '',
            datumLetzteMutation: '',
            tageSeitMeldung: 10,
            detailUrl: '',
            isActive: true,
          },
          {
            gtin: '222',
            pharmacode: '2',
            bezeichnung: 'Med B',
            firma: 'Inactive Firma',
            atcCode: 'A02',
            gengrp: 'grp2',
            statusCode: 1,
            statusText: '1',
            datumLieferfahigkeit: '',
            datumLetzteMutation: '',
            tageSeitMeldung: 20,
            detailUrl: '',
            isActive: false,
          },
        ],
      })

      const result = await getFirmaList()
      expect(result).toHaveLength(1)
      expect(result).toContain('Active Firma')
      expect(result).not.toContain('Inactive Firma')
    })

    test('returns sorted list alphabetically', async () => {
      await prisma.shortage.createMany({
        data: [
          {
            gtin: '111',
            pharmacode: '1',
            bezeichnung: 'Med',
            firma: 'Zebra Pharma',
            atcCode: 'A01',
            gengrp: 'grp1',
            statusCode: 1,
            statusText: '1',
            datumLieferfahigkeit: '',
            datumLetzteMutation: '',
            tageSeitMeldung: 10,
            detailUrl: '',
            isActive: true,
          },
          {
            gtin: '222',
            pharmacode: '2',
            bezeichnung: 'Med',
            firma: 'Alpha Pharma',
            atcCode: 'A02',
            gengrp: 'grp2',
            statusCode: 1,
            statusText: '1',
            datumLieferfahigkeit: '',
            datumLetzteMutation: '',
            tageSeitMeldung: 20,
            detailUrl: '',
            isActive: true,
          },
        ],
      })

      const result = await getFirmaList()
      expect(result[0]).toBe('Alpha Pharma')
      expect(result[1]).toBe('Zebra Pharma')
    })
  })

  describe('saveOverviewStats', () => {
    test('creates new overview stats record', async () => {
      const stats: OverviewStats = {
        scrapedAt: new Date().toISOString(),
        totalPackungen: 100,
        totalProdukte: 50,
        betroffeneAtcGruppen: 10,
        pflichtlager: 5,
        bwl: 3,
        bwlWho: 2,
        who: 1,
        kassenpflichtigSL: 20,
        kassenpflichtigSLTotal: 100,
        prozentSLNichtLieferbar: 20,
        dauerUnter2Wochen: 5,
        dauer2bis6Wochen: 10,
        dauerUeber6WochenBis6Monate: 8,
        dauerUeber6MonateBis1Jahr: 4,
        dauerUeber1Bis2Jahre: 2,
        dauerUeber2Jahre: 1,
        swissmedicListeA: 10,
        swissmedicListeATotal: 50,
        swissmedicListeB: 15,
        swissmedicListeBTotal: 60,
        swissmedicListeC: 8,
        swissmedicListeCTotal: 30,
        swissmedicUebrige: 5,
        swissmedicUebrigeTotal: 20,
        firmenRanking: [],
        atcGruppen: [],
      }

      await saveOverviewStats(stats)

      const saved = await prisma.overviewStats.findFirst()
      expect(saved).toBeDefined()
      expect(saved?.totalPackungen).toBe(100)
      expect(saved?.totalProdukte).toBe(50)
    })

    test('stores firmenRanking as JSON', async () => {
      const stats: OverviewStats = {
        scrapedAt: new Date().toISOString(),
        totalPackungen: 0,
        totalProdukte: 0,
        betroffeneAtcGruppen: 0,
        pflichtlager: 0,
        bwl: 0,
        bwlWho: 0,
        who: 0,
        kassenpflichtigSL: 0,
        kassenpflichtigSLTotal: 0,
        prozentSLNichtLieferbar: 0,
        dauerUnter2Wochen: 0,
        dauer2bis6Wochen: 0,
        dauerUeber6WochenBis6Monate: 0,
        dauerUeber6MonateBis1Jahr: 0,
        dauerUeber1Bis2Jahre: 0,
        dauerUeber2Jahre: 0,
        swissmedicListeA: 0,
        swissmedicListeATotal: 0,
        swissmedicListeB: 0,
        swissmedicListeBTotal: 0,
        swissmedicListeC: 0,
        swissmedicListeCTotal: 0,
        swissmedicUebrige: 0,
        swissmedicUebrigeTotal: 0,
        firmenRanking: [
          { bewertung: 1, firma: 'Test', anzahlProdukteTotal: 10, anzahlOffeneEngpaesse: 2 },
        ],
        atcGruppen: [{ atcCode: 'A01', bezeichnung: 'Test Group', anzahl: 5 }],
      }

      await saveOverviewStats(stats)

      const saved = await prisma.overviewStats.findFirst()
      expect(saved?.firmenRanking).toBeDefined()
      expect(Array.isArray(saved?.firmenRanking)).toBe(true)
    })
  })

  describe('saveScrapeRun', () => {
    test('creates scrape run record with success status', async () => {
      const run: ScrapeRun = {
        scrapedAt: new Date().toISOString(),
        totalCount: 100,
        newEntries: 5,
        removedEntries: 2,
        status: 'success',
      }

      await saveScrapeRun(run)

      const saved = await prisma.scrapeRun.findFirst()
      expect(saved).toBeDefined()
      expect(saved?.status).toBe('success')
      expect(saved?.totalCount).toBe(100)
      expect(saved?.newEntries).toBe(5)
      expect(saved?.removedEntries).toBe(2)
    })

    test('creates scrape run record with error status', async () => {
      const run: ScrapeRun = {
        scrapedAt: new Date().toISOString(),
        totalCount: 0,
        newEntries: 0,
        removedEntries: 0,
        status: 'error',
        errorMessage: 'Network timeout',
      }

      await saveScrapeRun(run)

      const saved = await prisma.scrapeRun.findFirst()
      expect(saved?.status).toBe('error')
      expect(saved?.errorMessage).toBe('Network timeout')
    })
  })

  describe('upsertCompletedShortages', () => {
    test('inserts new completed shortages', async () => {
      const completed: Shortage[] = [
        {
          gtin: '999',
          pharmacode: '9999',
          bezeichnung: 'Completed Med',
          firma: 'Test Firma',
          atcCode: 'Z99',
          gengrp: 'Z99GRP',
          statusCode: 9,
          statusText: '9 abgeschlossen',
          datumLieferfahigkeit: 'KW 10',
          datumLetzteMutation: '01.01.2026',
          tageSeitMeldung: 200,
          detailUrl: 'https://test.com',
          firstSeenAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          isActive: false,
        },
      ]

      const result = await upsertCompletedShortages(completed)
      expect(result.inserted).toBe(1)

      const saved = await prisma.shortage.findUnique({ where: { gtin: '999' } })
      expect(saved).toBeDefined()
      expect(saved?.statusCode).toBe(9)
      expect(saved?.isActive).toBe(false)
    })

    test('updates existing completed shortages', async () => {
      await prisma.shortage.create({
        data: {
          gtin: '888',
          pharmacode: '8888',
          bezeichnung: 'Old Med',
          firma: 'Old Firma',
          atcCode: 'Z88',
          gengrp: 'Z88GRP',
          statusCode: 9,
          statusText: '9 abgeschlossen',
          datumLieferfahigkeit: '',
          datumLetzteMutation: '',
          tageSeitMeldung: 100,
          detailUrl: '',
          isActive: false,
        },
      })

      const completed: Shortage[] = [
        {
          gtin: '888',
          pharmacode: '8888',
          bezeichnung: 'Updated Med',
          firma: 'Updated Firma',
          atcCode: 'Z88',
          gengrp: 'Z88GRP',
          statusCode: 9,
          statusText: '9 abgeschlossen',
          datumLieferfahigkeit: 'KW 15',
          datumLetzteMutation: '15.03.2026',
          tageSeitMeldung: 150,
          detailUrl: 'https://updated.com',
          firstSeenAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          isActive: false,
        },
      ]

      await upsertCompletedShortages(completed)

      const updated = await prisma.shortage.findUnique({ where: { gtin: '888' } })
      expect(updated?.bezeichnung).toBe('Updated Med')
      expect(updated?.tageSeitMeldung).toBe(150)
    })

    test('handles large batches with chunking (500+)', async () => {
      const largeSet: Shortage[] = Array.from({ length: 600 }, (_, i) => ({
        gtin: `GTIN${i}`,
        pharmacode: `PC${i}`,
        bezeichnung: `Med ${i}`,
        firma: 'Batch Firma',
        atcCode: 'Z99',
        gengrp: 'GRP',
        statusCode: 9,
        statusText: '9',
        datumLieferfahigkeit: '',
        datumLetzteMutation: '',
        tageSeitMeldung: i,
        detailUrl: '',
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        isActive: false,
      }))

      const result = await upsertCompletedShortages(largeSet)
      expect(result.inserted).toBe(600)
    })

    test('backfills pharmacode and gengrp from existing active entries', async () => {
      // Create an active entry with full data
      await prisma.shortage.create({
        data: {
          gtin: '777',
          pharmacode: 'KNOWN_PC',
          bezeichnung: 'Known Med',
          firma: 'Known Firma',
          atcCode: 'A01',
          gengrp: 'KNOWN_GRP',
          statusCode: 1,
          statusText: '1',
          datumLieferfahigkeit: '',
          datumLetzteMutation: '',
          tageSeitMeldung: 50,
          detailUrl: '',
          isActive: true,
        },
      })

      // Now insert completed entry with missing pharmacode/gengrp
      const completed: Shortage[] = [
        {
          gtin: '777',
          pharmacode: '', // Missing
          bezeichnung: 'Completed Med',
          firma: 'Known Firma',
          atcCode: 'A01',
          gengrp: '', // Missing
          statusCode: 9,
          statusText: '9',
          datumLieferfahigkeit: '',
          datumLetzteMutation: '',
          tageSeitMeldung: 200,
          detailUrl: '',
          firstSeenAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          isActive: false,
        },
      ]

      await upsertCompletedShortages(completed)

      const saved = await prisma.shortage.findUnique({ where: { gtin: '777' } })
      expect(saved?.pharmacode).toBe('KNOWN_PC') // Backfilled
      expect(saved?.gengrp).toBe('KNOWN_GRP') // Backfilled
    })
  })
})
