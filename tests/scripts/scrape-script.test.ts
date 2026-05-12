/**
 * Tests for the main scrape script
 */

import { fetchAndParse, fetchAndParseCompleted } from '@/lib/scraper'
import { upsertShortages, saveOverviewStats, upsertCompletedShortages, saveScrapeRun } from '@/lib/db'

jest.mock('@/lib/scraper')
jest.mock('@/lib/db')

const mockFetchAndParse = fetchAndParse as jest.MockedFunction<typeof fetchAndParse>
const mockFetchAndParseCompleted = fetchAndParseCompleted as jest.MockedFunction<typeof fetchAndParseCompleted>
const mockUpsertShortages = upsertShortages as jest.MockedFunction<typeof upsertShortages>
const mockSaveOverviewStats = saveOverviewStats as jest.MockedFunction<typeof saveOverviewStats>
const mockUpsertCompletedShortages = upsertCompletedShortages as jest.MockedFunction<typeof upsertCompletedShortages>
const mockSaveScrapeRun = saveScrapeRun as jest.MockedFunction<typeof saveScrapeRun>

// TODO: integration tests — dynamic import('@/scripts/scrape') runs the module once and Node caches
// it; subsequent tests reuse the cached module so mocks don't execute on re-import.
// Requires script refactoring to export a runnable function instead of top-level execution.
describe.skip('Scrape Script', () => {
  let consoleLogSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance
  let processExitSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
      throw new Error(`process.exit(${code})`)
    })
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    processExitSpy.mockRestore()
  })

  test('successfully completes full scrape workflow', async () => {
    mockFetchAndParse.mockResolvedValue({
      shortages: [
        {
          gtin: '111',
          pharmacode: '999',
          bezeichnung: 'Test Med',
          firma: 'Test Firma',
          atcCode: 'A01',
          gengrp: 'GRP1',
          statusCode: 1,
          statusText: '1',
          datumLieferfahigkeit: '',
          datumLetzteMutation: '',
          tageSeitMeldung: 10,
          detailUrl: '',
          firstSeenAt: new Date().toISOString(),
          lastSeenAt: new Date().toISOString(),
          isActive: true,
        },
      ],
      overview: {
        scrapedAt: '',
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
        dauerUeber6WochenBis6Monate: 15,
        dauerUeber6MonateBis1Jahr: 8,
        dauerUeber1Bis2Jahre: 4,
        dauerUeber2Jahre: 2,
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
      },
    })
    mockUpsertShortages.mockResolvedValue({ newEntries: 1, removedEntries: 0 })
    mockSaveOverviewStats.mockResolvedValue()
    mockFetchAndParseCompleted.mockResolvedValue([])
    mockUpsertCompletedShortages.mockResolvedValue({ inserted: 0 })
    mockSaveScrapeRun.mockResolvedValue()

    // Dynamically import and execute the script
    await import('@/scripts/scrape')

    expect(mockFetchAndParse).toHaveBeenCalled()
    expect(mockUpsertShortages).toHaveBeenCalled()
    expect(mockSaveOverviewStats).toHaveBeenCalled()
    expect(mockFetchAndParseCompleted).toHaveBeenCalled()
    expect(mockSaveScrapeRun).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        totalCount: 1,
        newEntries: 1,
        removedEntries: 0,
      }),
    )
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Active done'),
    )
  })

  test('saves error status when active scrape fails', async () => {
    mockFetchAndParse.mockRejectedValue(new Error('Fetch failed'))
    mockSaveScrapeRun.mockResolvedValue()

    await expect(async () => {
      await import('@/scripts/scrape')
    }).rejects.toThrow('process.exit(1)')

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error:'),
      expect.any(Error),
    )
    expect(mockSaveScrapeRun).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        errorMessage: expect.stringContaining('Fetch failed'),
      }),
    )
    expect(processExitSpy).toHaveBeenCalledWith(1)
  })

  test('continues when historical scrape fails (non-fatal)', async () => {
    mockFetchAndParse.mockResolvedValue({
      shortages: [],
      overview: {
        scrapedAt: '',
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
        firmenRanking: [],
        atcGruppen: [],
      },
    })
    mockUpsertShortages.mockResolvedValue({ newEntries: 0, removedEntries: 0 })
    mockSaveOverviewStats.mockResolvedValue()
    mockFetchAndParseCompleted.mockRejectedValue(new Error('Historical fetch failed'))
    mockSaveScrapeRun.mockResolvedValue()

    await import('@/scripts/scrape')

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Historical fetch failed (non-fatal)'),
      expect.any(Error),
    )
    expect(mockSaveScrapeRun).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'success' }),
    )
    expect(processExitSpy).not.toHaveBeenCalled()
  })

  test('logs progress messages at each step', async () => {
    mockFetchAndParse.mockResolvedValue({
      shortages: [{ gtin: '111' } as any],
      overview: {} as any,
    })
    mockUpsertShortages.mockResolvedValue({ newEntries: 1, removedEntries: 0 })
    mockSaveOverviewStats.mockResolvedValue()
    mockFetchAndParseCompleted.mockResolvedValue([])
    mockUpsertCompletedShortages.mockResolvedValue({ inserted: 0 })
    mockSaveScrapeRun.mockResolvedValue()

    await import('@/scripts/scrape')

    expect(consoleLogSpy).toHaveBeenCalledWith('[scrape] Starting active shortages...')
    expect(consoleLogSpy).toHaveBeenCalledWith('[scrape] Fetched 1 active shortages')
    expect(consoleLogSpy).toHaveBeenCalledWith('[scrape] Active done. New: 1, Removed: 0')
    expect(consoleLogSpy).toHaveBeenCalledWith('[scrape] Starting historical (completed) shortages...')
    expect(consoleLogSpy).toHaveBeenCalledWith('[scrape] Historical done. Inserted/updated: 0')
    expect(consoleLogSpy).toHaveBeenCalledWith('[scrape] ScrapeRun saved.')
  })

  test('saves ScrapeRun even when saveScrapeRun fails on error path', async () => {
    mockFetchAndParse.mockRejectedValue(new Error('Main error'))
    mockSaveScrapeRun.mockRejectedValue(new Error('SaveScrapeRun failed'))

    await expect(async () => {
      await import('@/scripts/scrape')
    }).rejects.toThrow('process.exit(1)')

    expect(mockSaveScrapeRun).toHaveBeenCalled()
    // Should exit even if saveScrapeRun fails
    expect(processExitSpy).toHaveBeenCalledWith(1)
  })

  test('includes timestamp in ScrapeRun', async () => {
    const beforeTime = new Date()
    mockFetchAndParse.mockResolvedValue({ shortages: [], overview: {} as any })
    mockUpsertShortages.mockResolvedValue({ newEntries: 0, removedEntries: 0 })
    mockSaveOverviewStats.mockResolvedValue()
    mockFetchAndParseCompleted.mockResolvedValue([])
    mockUpsertCompletedShortages.mockResolvedValue({ inserted: 0 })
    mockSaveScrapeRun.mockResolvedValue()

    await import('@/scripts/scrape')

    const afterTime = new Date()
    expect(mockSaveScrapeRun).toHaveBeenCalledWith(
      expect.objectContaining({
        scrapedAt: expect.any(String),
      }),
    )

    const scrapedAt = new Date(mockSaveScrapeRun.mock.calls[0][0].scrapedAt)
    expect(scrapedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
    expect(scrapedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime())
  })
})