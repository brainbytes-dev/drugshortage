import { parseDetailFromHtml, parseOverviewStats } from '@/lib/scraper'

describe('parseDetailFromHtml', () => {
  test('extracts detail fields from valid HTML', () => {
    const html = `
      <table>
        <tr><td>ATC-Code</td><td>N02BE01</td></tr>
        <tr><td>erste Meldung</td><td>01.12.2025</td></tr>
        <tr><td>erste Meldung durch</td><td>Swissmedic</td></tr>
        <tr><td>erste Info durch die Firma</td><td>10.12.2025</td></tr>
        <tr><td>Art der Info durch die Firma</td><td>Email</td></tr>
        <tr><td>voraussichtliche Dauer</td><td>mittel langer Engpass (2 bis 6 Wochen)</td></tr>
        <tr><td>ca. Datum der Wiederherstellung der Lieferfähigkeit</td><td>KW 20</td></tr>
        <tr><td>Bemerkungen</td><td>Produktionsprobleme</td></tr>
        <tr><td>Status des Engpasses</td><td>9 abgeschlossen</td></tr>
      </table>
    `
    const result = parseDetailFromHtml(html)
    expect(result.atcCode).toBe('N02BE01')
    expect(result.ersteMeldung).toBe('01.12.2025')
    expect(result.ersteMeldungDurch).toBe('Swissmedic')
    expect(result.ersteInfoDurchFirma).toBe('10.12.2025')
    expect(result.artDerInfoDurchFirma).toBe('Email')
    expect(result.voraussichtlicheDauer).toBe('mittel langer Engpass (2 bis 6 Wochen)')
    expect(result.datumLieferfahigkeit).toBe('KW 20')
    expect(result.bemerkungen).toBe('Produktionsprobleme')
    expect(result.statusCode).toBe(9)
    expect(result.statusText).toBe('9 abgeschlossen')
  })

  test('returns empty object for HTML with no matching fields', () => {
    const html = '<html><body>No tables here</body></html>'
    const result = parseDetailFromHtml(html)
    expect(Object.keys(result).length).toBe(0)
  })

  test('handles missing fields gracefully', () => {
    const html = `
      <table>
        <tr><td>ATC-Code</td><td>A01BC01</td></tr>
        <tr><td>Unknown Field</td><td>Value</td></tr>
      </table>
    `
    const result = parseDetailFromHtml(html)
    expect(result.atcCode).toBe('A01BC01')
    expect(result.ersteMeldung).toBeUndefined()
  })

  test('strips non-breaking spaces from values', () => {
    const html = `
      <table>
        <tr><td>ATC-Code</td><td>N02BE01\u00a0\u00a0</td></tr>
      </table>
    `
    const result = parseDetailFromHtml(html)
    expect(result.atcCode).toBe('N02BE01')
  })

  test('ignores rows with value "0"', () => {
    const html = `
      <table>
        <tr><td>ATC-Code</td><td>0</td></tr>
        <tr><td>erste Meldung</td><td>01.01.2026</td></tr>
      </table>
    `
    const result = parseDetailFromHtml(html)
    expect(result.atcCode).toBeUndefined()
    expect(result.ersteMeldung).toBe('01.01.2026')
  })

  test('parses status code from multi-word status text', () => {
    const html = `
      <table>
        <tr><td>Status des Engpasses</td><td>1 aktuell keine Lieferungen</td></tr>
      </table>
    `
    const result = parseDetailFromHtml(html)
    expect(result.statusCode).toBe(1)
    expect(result.statusText).toBe('1 aktuell keine Lieferungen')
  })

  test('handles invalid status code gracefully', () => {
    const html = `
      <table>
        <tr><td>Status des Engpasses</td><td>unknown status</td></tr>
      </table>
    `
    const result = parseDetailFromHtml(html)
    expect(result.statusCode).toBeUndefined()
    expect(result.statusText).toBeUndefined()
  })
})

describe('parseOverviewStats', () => {
  test('extracts all aggregate statistics from overview page', () => {
    const html = `
      <html>
        <body>
          <table>
            <tr><th>Header</th></tr>
            <tr><td>1234</td><td>567</td></tr>
          </table>
          <table>
            <tr><th>ATC Groups</th></tr>
            <tr><td>89</td></tr>
          </table>
          <table>
            <tr><th>Col1</th><th>Col2</th><th>Col3</th><th>Col4</th><th>SL</th></tr>
            <tr><td>10</td><td>5</td><td>3</td><td>2</td><td>684 von total 9856</td></tr>
          </table>
          <table>
            <tr><th>Duration</th></tr>
            <tr><td>15</td><td>20</td><td>10</td><td>5</td><td>3</td><td>2</td></tr>
          </table>
          <table>
            <tr><th>Swissmedic</th></tr>
            <tr><td>100 von total 500</td><td>200 von total 600</td><td>50 von total 150</td><td>10 von total 50</td></tr>
          </table>
        </body>
      </html>
    `
    const result = parseOverviewStats(html)
    expect(result.totalPackungen).toBe(1234)
    expect(result.totalProdukte).toBe(567)
    expect(result.betroffeneAtcGruppen).toBe(89)
    expect(result.pflichtlager).toBe(10)
    expect(result.bwl).toBe(5)
    expect(result.bwlWho).toBe(3)
    expect(result.who).toBe(2)
    expect(result.kassenpflichtigSL).toBe(684)
    expect(result.kassenpflichtigSLTotal).toBe(9856)
    expect(result.dauerUnter2Wochen).toBe(15)
    expect(result.dauer2bis6Wochen).toBe(20)
    expect(result.swissmedicListeA).toBe(100)
    expect(result.swissmedicListeATotal).toBe(500)
  })

  test('calculates prozentSLNichtLieferbar correctly', () => {
    const html = `
      <table></table><table></table>
      <table>
        <tr><td></td><td></td><td></td><td></td><td>250 von total 1000</td></tr>
      </table>
    `
    const result = parseOverviewStats(html)
    expect(result.prozentSLNichtLieferbar).toBe(25)
  })

  test('handles missing tables gracefully', () => {
    const html = '<html><body></body></html>'
    const result = parseOverviewStats(html)
    expect(result.totalPackungen).toBe(0)
    expect(result.totalProdukte).toBe(0)
  })

  test('handles malformed numbers gracefully', () => {
    const html = `
      <table>
        <tr><td>abc</td><td>def</td></tr>
      </table>
    `
    const result = parseOverviewStats(html)
    expect(result.totalPackungen).toBe(0)
    expect(result.totalProdukte).toBe(0)
  })

  test('extracts firmenRanking from table 5', () => {
    const html = `
      <table></table><table></table><table></table><table></table>
      <table></table>
      <table id="ranking">
        <tr><th>Bew</th><th>Firma</th><th>Total</th><th>Offen</th></tr>
        <tr><td>1</td><td>Firma A</td><td>100</td><td>5</td></tr>
        <tr><td>2</td><td>Firma B</td><td>80</td><td>10</td></tr>
      </table>
    `
    const result = parseOverviewStats(html)
    expect(result.firmenRanking).toHaveLength(2)
    expect(result.firmenRanking[0].firma).toBe('Firma A')
    expect(result.firmenRanking[0].bewertung).toBe(1)
    expect(result.firmenRanking[0].anzahlProdukteTotal).toBe(100)
    expect(result.firmenRanking[0].anzahlOffeneEngpaesse).toBe(5)
  })

  test('extracts atcGruppen from table 6', () => {
    const html = `
      <table></table><table></table><table></table><table></table>
      <table></table><table></table>
      <table id="atc">
        <tr><th>Code</th><th>Name</th><th>Count</th></tr>
        <tr><td>C09</td><td>Mittel mit Wirkung auf das Renin-Angiotensin-System</td><td>42</td></tr>
        <tr><td>N02</td><td>Analgetika</td><td>35</td></tr>
      </table>
    `
    const result = parseOverviewStats(html)
    expect(result.atcGruppen).toHaveLength(2)
    expect(result.atcGruppen[0].atcCode).toBe('C09')
    expect(result.atcGruppen[0].bezeichnung).toBe('Mittel mit Wirkung auf das Renin-Angiotensin-System')
    expect(result.atcGruppen[0].anzahl).toBe(42)
  })
})
