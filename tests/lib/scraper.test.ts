import { parseShortagesFromHtml } from '@/lib/scraper'

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
