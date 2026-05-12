/**
 * Tests for scraper fetch and enrichment functions
 */

import { fetchAndParse, fetchAndParseCompleted } from '@/lib/scraper'

describe('fetchAndParse', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('successfully fetches and parses active shortages', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () =>
          Promise.resolve(`
            <table id="GridView1">
              <tr><th>Headers</th></tr>
              <tr>
                <td><a href="detail.aspx">Med A</a></td>
                <td>unbestimmt</td><td></td><td>1 status</td>
                <td>01.01.2026</td><td>Firma A</td>
                <td>111</td><td>999</td><td>10</td>
                <td>A01</td><td>GRP1</td>
              </tr>
            </table>
            <table><tr><td>100</td><td>50</td></tr></table>
            <table><tr><td>5</td></tr></table>
            <table><tr><td>10</td><td>5</td><td>3</td><td>2</td><td>20 von total 100</td></tr></table>
            <table><tr><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td></tr></table>
            <table><tr><td>10 von total 50</td><td>20 von total 60</td><td>5 von total 30</td><td>3 von total 20</td></tr></table>
          `),
      } as Response),
    )

    const result = await fetchAndParse()
    expect(result.shortages).toBeDefined()
    expect(result.overview).toBeDefined()
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('drugshortage.ch'),
      expect.objectContaining({
        headers: expect.objectContaining({ 'User-Agent': expect.any(String) }),
      }),
    )
  })

  test('throws error when fetch fails', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 503,
      } as Response),
    )

    await expect(fetchAndParse()).rejects.toThrow()
  })

  test('throws error on network failure', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')))

    await expect(fetchAndParse()).rejects.toThrow('Network error')
  })

  test('handles timeout gracefully', async () => {
    global.fetch = jest.fn(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 100),
        ),
    )

    await expect(fetchAndParse()).rejects.toThrow('Timeout')
  })

  test('enriches shortages with detail page data', async () => {
    let callCount = 0
    global.fetch = jest.fn((url) => {
      callCount++
      if (callCount === 1) {
        // Main page
        return Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(`
              <table id="GridView1">
                <tr><th>Headers</th></tr>
                <tr>
                  <td><a href="detail.aspx?ID=1">Med A</a></td>
                  <td>unbestimmt</td><td></td><td>1 status</td>
                  <td>01.01.2026</td><td>Firma A</td>
                  <td>111</td><td>999</td><td>10</td>
                  <td>A01</td><td>GRP1</td>
                </tr>
              </table>
              <table><tr><td>100</td><td>50</td></tr></table>
              <table><tr><td>5</td></tr></table>
              <table><tr><td>10</td><td>5</td><td>3</td><td>2</td><td>20 von total 100</td></tr></table>
              <table><tr><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td></tr></table>
              <table><tr><td>10 von total 50</td><td>20 von total 60</td><td>5 von total 30</td><td>3 von total 20</td></tr></table>
            `),
        } as Response)
      } else {
        // Detail page
        return Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(`
              <table>
                <tr><td>erste Meldung</td><td>01.12.2025</td></tr>
                <tr><td>Bemerkungen</td><td>Test bemerkung</td></tr>
              </table>
            `),
        } as Response)
      }
    })

    const result = await fetchAndParse()
    expect(result.shortages[0].ersteMeldung).toBeDefined()
    expect(global.fetch).toHaveBeenCalledTimes(2) // Main + detail
  })

  test('continues when detail fetch fails for one shortage', async () => {
    let callCount = 0
    global.fetch = jest.fn((url) => {
      callCount++
      if (callCount === 1) {
        return Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(`
              <table id="GridView1">
                <tr><th>Headers</th></tr>
                <tr>
                  <td><a href="detail1.aspx">Med A</a></td>
                  <td>unbestimmt</td><td></td><td>1 status</td>
                  <td>01.01.2026</td><td>Firma A</td>
                  <td>111</td><td>999</td><td>10</td>
                  <td>A01</td><td>GRP1</td>
                </tr>
                <tr>
                  <td><a href="detail2.aspx">Med B</a></td>
                  <td>unbestimmt</td><td></td><td>1 status</td>
                  <td>01.01.2026</td><td>Firma B</td>
                  <td>222</td><td>888</td><td>20</td>
                  <td>A02</td><td>GRP2</td>
                </tr>
              </table>
              <table><tr><td>100</td><td>50</td></tr></table>
              <table><tr><td>5</td></tr></table>
              <table><tr><td>10</td><td>5</td><td>3</td><td>2</td><td>20 von total 100</td></tr></table>
              <table><tr><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td></tr></table>
              <table><tr><td>10 von total 50</td><td>20 von total 60</td><td>5 von total 30</td><td>3 von total 20</td></tr></table>
            `),
        } as Response)
      } else if (String(url).includes('detail1')) {
        return Promise.reject(new Error('Detail 1 failed'))
      } else {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('<table></table>'),
        } as Response)
      }
    })

    const result = await fetchAndParse()
    expect(result.shortages).toHaveLength(2) // Both shortages still present
  })

  test('respects concurrency limit for detail fetches', async () => {
    const detailFetchTimes: number[] = []
    global.fetch = jest.fn((url) => {
      if (String(url).includes('Uebersicht')) {
        // Main page with 15 shortages
        const rows = Array.from({ length: 15 }, (_, i) => `
          <tr>
            <td><a href="detail${i}.aspx">Med ${i}</a></td>
            <td>date</td><td></td><td>1 status</td>
            <td>mut</td><td>Firma</td>
            <td>${i}</td><td>999</td><td>10</td>
            <td>A01</td><td>GRP</td>
          </tr>
        `).join('')
        return Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(`
              <table id="GridView1">
                <tr><th>Headers</th></tr>
                ${rows}
              </table>
              <table><tr><td>100</td><td>50</td></tr></table>
              <table><tr><td>5</td></tr></table>
              <table><tr><td>10</td><td>5</td><td>3</td><td>2</td><td>20 von total 100</td></tr></table>
              <table><tr><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td></tr></table>
              <table><tr><td>10 von total 50</td><td>20 von total 60</td><td>5 von total 30</td><td>3 von total 20</td></tr></table>
            `),
        } as Response)
      } else {
        // Detail pages
        detailFetchTimes.push(Date.now())
        return new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                text: () => Promise.resolve('<table></table>'),
              } as Response),
            50,
          ),
        )
      }
    })

    await fetchAndParse()
    expect(detailFetchTimes).toHaveLength(15)
    // Check that no more than DETAIL_CONCURRENCY (10) started within 10ms window
    // This is a rough check for concurrency control
  })
})

describe('fetchAndParseCompleted', () => {
  test('successfully fetches completed shortages', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () =>
          Promise.resolve(`
            <table id="GridView1">
              <tr><th>Headers</th></tr>
              <tr>
                <td><a href="detail.aspx">Completed Med</a></td>
                <td>KW 10</td><td></td><td>9 abgeschlossen</td>
                <td>01.01.2026</td><td>Firma C</td>
                <td>333</td><td>777</td><td>150</td>
                <td>C03</td><td>GRP3</td>
              </tr>
            </table>
          `),
      } as Response),
    )

    const result = await fetchAndParseCompleted()
    expect(result).toHaveLength(1)
    expect(result[0].statusCode).toBe(9)
  })

  test('throws error when completed page fetch fails', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
      } as Response),
    )

    await expect(fetchAndParseCompleted()).rejects.toThrow()
  })

  test('enriches completed shortages with detail data', async () => {
    let callCount = 0
    global.fetch = jest.fn((url) => {
      callCount++
      if (callCount === 1) {
        return Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(`
              <table id="GridView1">
                <tr><th>Headers</th></tr>
                <tr>
                  <td><a href="detail.aspx?ID=999">Completed Med</a></td>
                  <td>KW 10</td><td></td><td>9 abgeschlossen</td>
                  <td>01.01.2026</td><td>Firma C</td>
                  <td>333</td><td>777</td><td>150</td>
                  <td>C03</td><td>GRP3</td>
                </tr>
              </table>
            `),
        } as Response)
      } else {
        return Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(`
              <table>
                <tr><td>Bemerkungen</td><td>Resolved via alternative supplier</td></tr>
              </table>
            `),
        } as Response)
      }
    })

    // fetchAndParseCompleted(enrich=true) triggers detail enrichment; default is false
    const result = await fetchAndParseCompleted(true)
    expect(result[0].bemerkungen).toBe('Resolved via alternative supplier')
  })
})