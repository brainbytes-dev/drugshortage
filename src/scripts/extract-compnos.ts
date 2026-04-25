import { XMLParser } from 'fast-xml-parser'

async function main() {
  console.log('Fetching article XML (~80MB)...')
  const r = await fetch('https://download.hin.ch/download/oddb2xml/oddb_article.xml', { headers: { 'User-Agent': 'engpassradar.ch/1.0' } })
  const xml = await r.text()
  const parser = new XMLParser({ ignoreAttributes: true, parseTagValue: true, trimValues: true, removeNSPrefix: true, isArray: (n: string) => ['ART','ARTBAR','ARTPRI','ARTCOMP'].includes(n) })
  const doc = parser.parse(xml)
  const arts: Record<string,unknown>[] = doc?.ARTICLE?.ART ?? []
  const compnos = new Set<string>()
  for (const art of arts) {
    const comps = (Array.isArray(art.ARTCOMP) ? art.ARTCOMP : art.ARTCOMP ? [art.ARTCOMP] : []) as Record<string,unknown>[]
    for (const c of comps) if (c.COMPNO) compnos.add(String(c.COMPNO))
  }
  console.log('Unique COMPNOs:', compnos.size)
  Array.from(compnos).slice(0, 15).forEach(c => console.log(' ', c))
}

main().catch(console.error).finally(() => process.exit(0))
