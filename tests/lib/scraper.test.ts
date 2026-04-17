import {
  parseShortagesFromHtml,
  parseDetailFromHtml,
  parseOverviewStats,
  parseCompletedFromHtml,
  parseAusserHandelFromHtml,
  parseVertriebseinstellungFromHtml,
} from '@/lib/scraper'

const SAMPLE_HTML = `
<table id="GridView1">
  <tr bgcolor="#FF5050">
    <th>Bezeichnung</th><th>Datum Lieferfähigkeit</th>
    <th>mögliche Alternativen</th><th>Status</th>
    <th>Datum letzte Mutation</th><th>Firma</th>
    <th>GTIN</th><th>Pharmacode</th>
    <th>Tage seit erster Meldung</th><th>ATC</th><th>GENGRP</th>
  </tr>
  <tr>
    <td><a href="detail_lieferengpass.aspx?ID=25975">ACETALGIN Supp 125 mg 10 Stk</a></td>
    <td>unbestimmt</td>
    <td><a href="alternativen.aspx?GTIN=7680494930101">Alternativen?</a></td>
    <td>1 aktuell keine Lieferungen</td>
    <td>11.12.2025</td>
    <td>Streuli Pharma AG</td>
    <td>7680494930101</td>
    <td>1379591</td>
    <td>293</td>
    <td>N02BE01</td>
    <td>N02BE01SRSN000000125SUPP</td>
  </tr>
</table>
`

test('parseShortagesFromHtml extracts one shortage from sample HTML', () => {
  const result = parseShortagesFromHtml(SAMPLE_HTML)
  expect(result).toHaveLength(1)
  const s = result[0]
  expect(s.gtin).toBe('7680494930101')
  expect(s.bezeichnung).toBe('ACETALGIN Supp 125 mg 10 Stk')
  expect(s.firma).toBe('Streuli Pharma AG')
  expect(s.statusCode).toBe(1)
  expect(s.statusText).toBe('1 aktuell keine Lieferungen')
  expect(s.tageSeitMeldung).toBe(293)
  expect(s.atcCode).toBe('N02BE01')
  expect(s.datumLieferfahigkeit).toBe('unbestimmt')
  expect(s.detailUrl).toBe('https://www.drugshortage.ch/detail_lieferengpass.aspx?ID=25975')
  expect(s.isActive).toBe(true)
})

test('parseShortagesFromHtml returns empty array for missing table', () => {
  const result = parseShortagesFromHtml('<html><body>no table</body></html>')
  expect(result).toHaveLength(0)
})

test('parseShortagesFromHtml skips rows with missing GTIN', () => {
  const html = `
    <table id="GridView1">
      <tr><th>h1</th><th>h2</th></tr>
      <tr><td>Name</td><td></td><td></td><td>1</td><td></td><td>Firma</td><td></td><td></td><td>0</td><td>A01</td><td>grp</td></tr>
    </table>
  `
  const result = parseShortagesFromHtml(html)
  expect(result).toHaveLength(0)
})

// ---------------------------------------------------------------------------
// parseDetailFromHtml
// ---------------------------------------------------------------------------

function makeDetailHtml(pairs: Record<string, string>): string {
  const rows = Object.entries(pairs)
    .map(([label, value]) => `<tr><td>${label}</td><td>${value}</td></tr>`)
    .join('\n')
  return `<table>${rows}</table>`
}

test('parseDetailFromHtml maps known labels to Shortage fields', () => {
  const html = makeDetailHtml({
    'ATC-Code': 'J01CA04',
    'erste Meldung': '01.01.2026',
    'erste Meldung durch': 'Swissmedic',
    'erste Info durch die Firma': '02.01.2026',
    'Art der Info durch die Firma': 'Statusbericht',
    'voraussichtliche Dauer': '3 Monate',
    'ca. Datum der Wiederherstellung der Lieferfähigkeit': '01.04.2026',
    'Bemerkungen': 'Rohstoffmangel',
  })
  const result = parseDetailFromHtml(html)
  expect(result.atcCode).toBe('J01CA04')
  expect(result.ersteMeldung).toBe('01.01.2026')
  expect(result.ersteMeldungDurch).toBe('Swissmedic')
  expect(result.ersteInfoDurchFirma).toBe('02.01.2026')
  expect(result.artDerInfoDurchFirma).toBe('Statusbericht')
  expect(result.voraussichtlicheDauer).toBe('3 Monate')
  expect(result.datumLieferfahigkeit).toBe('01.04.2026')
  expect(result.bemerkungen).toBe('Rohstoffmangel')
})

test('parseDetailFromHtml parses statusCode from "Status des Engpasses"', () => {
  const html = makeDetailHtml({ 'Status des Engpasses': '9 abgeschlossen' })
  const result = parseDetailFromHtml(html)
  expect(result.statusCode).toBe(9)
  expect(result.statusText).toBe('9 abgeschlossen')
})

test('parseDetailFromHtml ignores rows with empty value or value "0"', () => {
  const html = makeDetailHtml({ 'ATC-Code': '', 'voraussichtliche Dauer': '0' })
  const result = parseDetailFromHtml(html)
  expect(result.atcCode).toBeUndefined()
  expect(result.voraussichtlicheDauer).toBeUndefined()
})

test('parseDetailFromHtml strips non-breaking spaces from values', () => {
  // The parser does .replace(/\u00a0/g, '') — removes NBSP entirely (not replaced with space)
  const html = `<table><tr><td>Bemerkungen</td><td>Text\u00a0mit\u00a0NBSP</td></tr></table>`
  const result = parseDetailFromHtml(html)
  expect(result.bemerkungen).toBe('TextmitNBSP')
})

// ---------------------------------------------------------------------------
// parseOverviewStats
// ---------------------------------------------------------------------------

function buildOverviewHtml(): string {
  const tables = [
    // Table 0: Packungen / Produkte
    `<table><tr><th>Pack</th><th>Prod</th></tr><tr><td>1234</td><td>567</td></tr></table>`,
    // Table 1: ATC-Gruppen
    `<table><tr><th>ATC</th></tr><tr><td>42</td></tr></table>`,
    // Table 2: Regulatory + duration (12 cols)
    `<table><tr>${Array.from({ length: 12 }, (_, i) => `<th>H${i}</th>`).join('')}</tr>
     <tr><td>10</td><td>20</td><td>5</td><td>3</td><td>684 von total 9856</td><td>6.9</td><td>50</td><td>80</td><td>120</td><td>30</td><td>10</td><td>5</td></tr>
    </table>`,
    // Table 3: Swissmedic (4 cols)
    `<table><tr>${Array.from({ length: 4 }, (_, i) => `<th>S${i}</th>`).join('')}</tr>
     <tr><td>128 von 2942</td><td>55 von 1200</td><td>20 von 800</td><td>15 von 500</td></tr>
    </table>`,
    // Table 4: unused
    `<table><tr><td>unused</td></tr></table>`,
    // Table 5: Firmen-Ranking
    `<table>
      <tr><th>Bew</th><th>Firma</th><th>Total</th><th>Offen</th></tr>
      <tr><td>1</td><td>Roche AG</td><td>15</td><td>8</td></tr>
      <tr><td>2</td><td>Novartis AG</td><td>12</td><td>5</td></tr>
    </table>`,
    // Table 6: ATC-Gruppen breakdown
    `<table>
      <tr><th>ATC</th><th>Bezeichnung</th><th>Anzahl</th></tr>
      <tr><td>J01</td><td>Antibiotika</td><td>34</td></tr>
      <tr><td>A02</td><td>Magenmittel</td><td>12</td></tr>
    </table>`,
  ]
  return `<html><body>${tables.join('\n')}</body></html>`
}

test('parseOverviewStats parses totalPackungen and totalProdukte', () => {
  const result = parseOverviewStats(buildOverviewHtml())
  expect(result.totalPackungen).toBe(1234)
  expect(result.totalProdukte).toBe(567)
})

test('parseOverviewStats parses betroffeneAtcGruppen', () => {
  const result = parseOverviewStats(buildOverviewHtml())
  expect(result.betroffeneAtcGruppen).toBe(42)
})

test('parseOverviewStats parses SL fraction', () => {
  const result = parseOverviewStats(buildOverviewHtml())
  expect(result.kassenpflichtigSL).toBe(684)
  expect(result.kassenpflichtigSLTotal).toBe(9856)
  expect(result.prozentSLNichtLieferbar).toBeCloseTo(6.9)
})

test('parseOverviewStats parses Swissmedic list counts', () => {
  const result = parseOverviewStats(buildOverviewHtml())
  expect(result.swissmedicListeA).toBe(128)
  expect(result.swissmedicListeATotal).toBe(2942)
  expect(result.swissmedicListeB).toBe(55)
})

test('parseOverviewStats parses firmenRanking', () => {
  const result = parseOverviewStats(buildOverviewHtml())
  expect(result.firmenRanking).toHaveLength(2)
  expect(result.firmenRanking[0].firma).toBe('Roche AG')
  expect(result.firmenRanking[0].anzahlProdukteTotal).toBe(15)
  expect(result.firmenRanking[0].bewertung).toBe(1)
})

test('parseOverviewStats parses atcGruppen', () => {
  const result = parseOverviewStats(buildOverviewHtml())
  expect(result.atcGruppen).toHaveLength(2)
  expect(result.atcGruppen[0].atcCode).toBe('J01')
  expect(result.atcGruppen[0].bezeichnung).toBe('Antibiotika')
  expect(result.atcGruppen[0].anzahl).toBe(34)
})

test('parseOverviewStats parses duration buckets', () => {
  const result = parseOverviewStats(buildOverviewHtml())
  expect(result.dauerUnter2Wochen).toBe(50)
  expect(result.dauer2bis6Wochen).toBe(80)
  expect(result.dauerUeber6WochenBis6Monate).toBe(120)
  expect(result.dauerUeber6MonateBis1Jahr).toBe(30)
  expect(result.dauerUeber1Bis2Jahre).toBe(10)
  expect(result.dauerUeber2Jahre).toBe(5)
})

// ---------------------------------------------------------------------------
// parseCompletedFromHtml
// ---------------------------------------------------------------------------

const COMPLETED_HTML = `
<table id="GridView1">
  <tr><th>Bezeichnung</th><th>Firma</th><th>Erste Meldung</th><th>Letzte Mutation</th><th>Tage</th><th>GTIN</th></tr>
  <tr>
    <td><a href="detail_lieferengpass.aspx?ID=99">Ibuprofen 400 mg</a></td>
    <td>Pharma GmbH</td>
    <td>01.03.2025</td>
    <td>15.03.2025</td>
    <td>180</td>
    <td>7680555550001</td>
  </tr>
</table>
`

test('parseCompletedFromHtml parses a completed row', () => {
  const [s] = parseCompletedFromHtml(COMPLETED_HTML)
  expect(s.gtin).toBe('7680555550001')
  expect(s.bezeichnung).toBe('Ibuprofen 400 mg')
  expect(s.firma).toBe('Pharma GmbH')
  expect(s.ersteMeldung).toBe('01.03.2025')
  expect(s.tageSeitMeldung).toBe(180)
  expect(s.statusCode).toBe(9)
  expect(s.statusText).toBe('9 abgeschlossen')
  expect(s.isActive).toBe(false)
  expect(s.detailUrl).toContain('detail_lieferengpass.aspx')
})

test('parseCompletedFromHtml skips rows with fewer than 6 cells', () => {
  const html = `<table id="GridView1"><tr><th>H</th></tr><tr><td>only one</td></tr></table>`
  expect(parseCompletedFromHtml(html)).toHaveLength(0)
})

test('parseCompletedFromHtml skips rows with empty GTIN', () => {
  const html = `
    <table id="GridView1">
      <tr><th>B</th><th>F</th><th>EM</th><th>LM</th><th>T</th><th>G</th></tr>
      <tr><td>Name</td><td>Firma</td><td>01.01.2025</td><td>02.01.2025</td><td>10</td><td></td></tr>
    </table>`
  expect(parseCompletedFromHtml(html)).toHaveLength(0)
})

test('parseCompletedFromHtml sets ersteMeldung to undefined when empty', () => {
  const html = `
    <table id="GridView1">
      <tr><th>B</th><th>F</th><th>EM</th><th>LM</th><th>T</th><th>G</th></tr>
      <tr><td>Name</td><td>Firma</td><td></td><td>02.01.2025</td><td>10</td><td>7680111110001</td></tr>
    </table>`
  const [s] = parseCompletedFromHtml(html)
  expect(s.ersteMeldung).toBeUndefined()
})

// ---------------------------------------------------------------------------
// parseAusserHandelFromHtml
// ---------------------------------------------------------------------------

const AUSSER_HANDEL_HTML = `
<table id="GridView1">
  <tr><th>GTIN</th><th>Bezeichnung</th><th>Firma</th><th>ATC</th><th>Datum</th></tr>
  <tr>
    <td>7680111110001</td>
    <td>Aspirin 100 mg</td>
    <td>Bayer AG</td>
    <td>B01AC06</td>
    <td>01.01.2026</td>
  </tr>
</table>
`

test('parseAusserHandelFromHtml parses an ausser-Handel entry', () => {
  const [e] = parseAusserHandelFromHtml(AUSSER_HANDEL_HTML)
  expect(e.gtin).toBe('7680111110001')
  expect(e.bezeichnung).toBe('Aspirin 100 mg')
  expect(e.firma).toBe('Bayer AG')
  expect(e.atcCode).toBe('B01AC06')
  expect(e.datum).toBe('01.01.2026')
  expect(e.category).toBe('AUSSER_HANDEL')
})

test('parseAusserHandelFromHtml skips rows with fewer than 4 cells', () => {
  const html = `<table id="GridView1"><tr><th>H</th></tr><tr><td>only one</td></tr></table>`
  expect(parseAusserHandelFromHtml(html)).toHaveLength(0)
})

test('parseAusserHandelFromHtml skips rows with empty GTIN', () => {
  const html = `
    <table id="GridView1">
      <tr><th>G</th><th>B</th><th>F</th><th>A</th><th>D</th></tr>
      <tr><td></td><td>Name</td><td>Firma</td><td>X01</td><td>01.01.2026</td></tr>
    </table>`
  expect(parseAusserHandelFromHtml(html)).toHaveLength(0)
})

test('parseAusserHandelFromHtml sets atcCode to null when empty', () => {
  const html = `
    <table id="GridView1">
      <tr><th>G</th><th>B</th><th>F</th><th>A</th><th>D</th></tr>
      <tr><td>7680111110001</td><td>Name</td><td>Firma</td><td></td><td>01.01.2026</td></tr>
    </table>`
  const [e] = parseAusserHandelFromHtml(html)
  expect(e.atcCode).toBeNull()
})

// ---------------------------------------------------------------------------
// parseVertriebseinstellungFromHtml
// ---------------------------------------------------------------------------

const VERTRIEBSEINSTELLUNG_HTML = `
<table id="GridView1">
  <tr><th>Bezeichnung</th><th>GTIN</th><th>Firma</th><th>Datum</th></tr>
  <tr>
    <td>Voltaren Emulgel</td>
    <td>7680222220001</td>
    <td>GSK AG</td>
    <td>15.06.2025</td>
  </tr>
</table>
`

test('parseVertriebseinstellungFromHtml parses a Vertriebseinstellung entry', () => {
  const [e] = parseVertriebseinstellungFromHtml(VERTRIEBSEINSTELLUNG_HTML)
  expect(e.gtin).toBe('7680222220001')
  expect(e.bezeichnung).toBe('Voltaren Emulgel')
  expect(e.firma).toBe('GSK AG')
  expect(e.datum).toBe('15.06.2025')
  expect(e.atcCode).toBeNull()
  expect(e.category).toBe('VERTRIEBSEINSTELLUNG')
})

test('parseVertriebseinstellungFromHtml skips rows with fewer than 3 cells', () => {
  const html = `<table id="GridView1"><tr><th>H</th></tr><tr><td>only one</td></tr></table>`
  expect(parseVertriebseinstellungFromHtml(html)).toHaveLength(0)
})

test('parseVertriebseinstellungFromHtml skips rows with empty GTIN', () => {
  const html = `
    <table id="GridView1">
      <tr><th>B</th><th>G</th><th>F</th><th>D</th></tr>
      <tr><td>Name</td><td></td><td>Firma</td><td>01.01.2026</td></tr>
    </table>`
  expect(parseVertriebseinstellungFromHtml(html)).toHaveLength(0)
})

test('parseVertriebseinstellungFromHtml sets datum to null when empty', () => {
  const html = `
    <table id="GridView1">
      <tr><th>B</th><th>G</th><th>F</th><th>D</th></tr>
      <tr><td>Name</td><td>7680222220001</td><td>Firma</td><td></td></tr>
    </table>`
  const [e] = parseVertriebseinstellungFromHtml(html)
  expect(e.datum).toBeNull()
})
