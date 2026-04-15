import * as cheerio from 'cheerio'
import type { Shortage } from './types'

const BASE_URL = 'https://www.drugshortage.ch'
const SOURCE_URL = `${BASE_URL}/UebersichtaktuelleLieferengpaesse2.aspx`

export function parseShortagesFromHtml(html: string): Shortage[] {
  const $ = cheerio.load(html)
  const rows = $('#GridView1 tr').toArray()
  const shortages: Shortage[] = []
  const now = new Date().toISOString()

  for (const row of rows.slice(1)) {
    const cells = $(row).find('td')
    if (cells.length < 11) continue

    const getText = (i: number) => $(cells[i]).text().trim()
    const getHref = (i: number) => $(cells[i]).find('a').attr('href') ?? ''

    const gtin = getText(6)
    if (!gtin) continue

    const statusText = getText(3)
    const statusCode = parseInt(statusText.charAt(0), 10)
    if (isNaN(statusCode) || statusCode < 1 || statusCode > 5) continue

    const detailHref = getHref(0)
    const detailUrl = detailHref
      ? detailHref.startsWith('http')
        ? detailHref
        : `${BASE_URL}/${detailHref}`
      : ''

    shortages.push({
      gtin,
      pharmacode: getText(7),
      bezeichnung: getText(0),
      firma: getText(5),
      atcCode: getText(9),
      gengrp: getText(10),
      statusCode,
      statusText,
      datumLieferfahigkeit: getText(1),
      datumLetzteMutation: getText(4),
      tageSeitMeldung: parseInt(getText(8), 10) || 0,
      detailUrl,
      firstSeenAt: now,
      lastSeenAt: now,
      isActive: true,
    })
  }

  return shortages
}

export async function fetchAndParse(): Promise<Shortage[]> {
  const response = await fetch(SOURCE_URL, {
    headers: { 'User-Agent': 'drugshortage-dashboard/1.0' },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch source: ${response.status} ${response.statusText}`)
  }

  const html = await response.text()
  return parseShortagesFromHtml(html)
}
