/**
 * Integration tests for full scrape workflow
 * Tests the entire pipeline: fetch → parse → store → query
 */

import { fetchAndParse } from '@/lib/scraper'
import { upsertShortages, saveOverviewStats, queryShortages } from '@/lib/db'
import { prisma } from '@/lib/prisma'

describe('Scrape Workflow Integration', () => {
  beforeEach(async () => {
    await prisma.shortage.deleteMany()
    await prisma.overviewStats.deleteMany()
  })

  test('full workflow: mock fetch → parse → store → query', async () => {
    // Mock the fetch to avoid hitting the real API
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () =>
          Promise.resolve(`
            <table id="GridView1">
              <tr><th>Headers</th></tr>
              <tr>
                <td><a href="detail.aspx?ID=1">Test Med</a></td>
                <td>unbestimmt</td>
                <td><a href="alt.aspx?GTIN=111">Alt</a></td>
                <td>1 aktuell</td>
                <td>01.01.2026</td>
                <td>Test Firma</td>
                <td>111</td>
                <td>999</td>
                <td>100</td>
                <td>A01</td>
                <td>GRP1</td>
              </tr>
            </table>
            <table><tr><td>500</td><td>250</td></tr></table>
            <table><tr><td>10</td></tr></table>
            <table><tr><td>5</td><td>3</td><td>2</td><td>1</td><td>100 von total 1000</td></tr></table>
          `),
      } as Response),
    )

    // Step 1: Fetch and parse
    const { shortages, overview } = await fetchAndParse()
    expect(shortages).toHaveLength(1)
    expect(shortages[0].gtin).toBe('111')

    // Step 2: Store shortages
    const { newEntries } = await upsertShortages(shortages)
    expect(newEntries).toBe(1)

    // Step 3: Store overview
    await saveOverviewStats({ ...overview, scrapedAt: new Date().toISOString() })

    // Step 4: Query back
    const result = await queryShortages({ search: 'test' })
    expect(result.data).toHaveLength(1)
    expect(result.data[0].gtin).toBe('111')
  })

  test('active → inactive transition when shortage disappears', async () => {
    // First scrape: insert shortage
    await upsertShortages([
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
    ])

    let active = await prisma.shortage.findUnique({ where: { gtin: '111' } })
    expect(active?.isActive).toBe(true)

    // Second scrape: shortage no longer present
    await upsertShortages([])

    const inactive = await prisma.shortage.findUnique({ where: { gtin: '111' } })
    expect(inactive?.isActive).toBe(false)
  })

  test('inactive → active transition when shortage reappears', async () => {
    // Create inactive shortage
    await prisma.shortage.create({
      data: {
        gtin: '222',
        pharmacode: '888',
        bezeichnung: 'Reappearing Med',
        firma: 'Test Firma',
        atcCode: 'B02',
        gengrp: 'GRP2',
        statusCode: 9,
        statusText: '9',
        datumLieferfahigkeit: '',
        datumLetzteMutation: '',
        tageSeitMeldung: 200,
        detailUrl: '',
        isActive: false,
      },
    })

    // Scrape with this shortage active again
    await upsertShortages([
      {
        gtin: '222',
        pharmacode: '888',
        bezeichnung: 'Reappearing Med',
        firma: 'Test Firma',
        atcCode: 'B02',
        gengrp: 'GRP2',
        statusCode: 1,
        statusText: '1',
        datumLieferfahigkeit: '',
        datumLetzteMutation: '',
        tageSeitMeldung: 5,
        detailUrl: '',
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        isActive: true,
      },
    ])

    const reactivated = await prisma.shortage.findUnique({ where: { gtin: '222' } })
    expect(reactivated?.isActive).toBe(true)
    expect(reactivated?.statusCode).toBe(1)
  })

  test('concurrent scrapes do not create duplicates', async () => {
    const shortage = {
      gtin: '333',
      pharmacode: '777',
      bezeichnung: 'Concurrent Med',
      firma: 'Test Firma',
      atcCode: 'C03',
      gengrp: 'GRP3',
      statusCode: 1,
      statusText: '1',
      datumLieferfahigkeit: '',
      datumLetzteMutation: '',
      tageSeitMeldung: 15,
      detailUrl: '',
      firstSeenAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      isActive: true,
    }

    // Run two upserts concurrently
    await Promise.all([upsertShortages([shortage]), upsertShortages([shortage])])

    const count = await prisma.shortage.count({ where: { gtin: '333' } })
    expect(count).toBe(1) // No duplicate
  })

  test('preserves firstSeenAt across updates', async () => {
    const originalDate = new Date('2025-01-01')
    await prisma.shortage.create({
      data: {
        gtin: '444',
        pharmacode: '666',
        bezeichnung: 'Preserved Med',
        firma: 'Test Firma',
        atcCode: 'D04',
        gengrp: 'GRP4',
        statusCode: 1,
        statusText: '1',
        datumLieferfahigkeit: '',
        datumLetzteMutation: '',
        tageSeitMeldung: 50,
        detailUrl: '',
        firstSeenAt: originalDate,
      },
    })

    // Update with new data
    await upsertShortages([
      {
        gtin: '444',
        pharmacode: '666',
        bezeichnung: 'Preserved Med Updated',
        firma: 'Test Firma',
        atcCode: 'D04',
        gengrp: 'GRP4',
        statusCode: 2,
        statusText: '2',
        datumLieferfahigkeit: '',
        datumLetzteMutation: '',
        tageSeitMeldung: 55,
        detailUrl: '',
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        isActive: true,
      },
    ])

    const updated = await prisma.shortage.findUnique({ where: { gtin: '444' } })
    expect(updated?.firstSeenAt.toISOString()).toBe(originalDate.toISOString())
    expect(updated?.tageSeitMeldung).toBe(55) // Other fields updated
  })
})
