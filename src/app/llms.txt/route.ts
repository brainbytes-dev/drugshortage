const CONTENT = `# engpass.radar

> Aggregierte Übersicht aller gemeldeten Medikamenten-Lieferengpässe in der Schweiz. Tägliche Zusammenführung von drugshortage.ch, BWL-Pflichtlager und der Shortage-Liste der Spitalpharmazie USB, ergänzt um Wirkstoff, ATC-Code, Swissmedic-Nummer und GTIN aus der ODDB-Referenzdatenbank.

engpass.radar ist ein unabhängiges, werbefreies Projekt eines praktizierenden Schweizer Neurologen. Keine Pharma-Finanzierung, keine Affiliate-Links. Dashboard, Suche, Detailseiten, CSV-Export und die Basis-API sind ohne Anmeldung öffentlich zugänglich.

Für klinische, pharmazeutische oder regulatorische Entscheidungen gelten ausschliesslich die offiziellen Primärquellen (drugshortage.ch, Swissmedic, BWL). engpass.radar ist ein Informations- und Monitoring-Werkzeug, kein behördliches Register.

## Daten und Quellen

- [Methodik und Quellen](https://engpassradar.ch/methodik): Welche Quellen einbezogen werden, wie der Severity-Score berechnet wird, wie oft abgeglichen wird.
- [FAQ](https://engpassradar.ch/#faq): Häufige Fragen zu Aktualität, Vollständigkeit, Haftung und Nutzung im Spital- und Apothekenalltag.

## Suche und Navigation

- [Dashboard](https://engpassradar.ch/): Aktuelle Engpassliste mit Volltext-Suche, ATC-Filter, Firmenfilter und Severity-Score.
- [Wirkstoffseiten](https://engpassradar.ch/wirkstoff/N02BE01): Pro ATC-Code — alle betroffenen Präparate mit Status (im Engpass / verfügbar / ausser Handel), Ø Engpassdauer, Firmen.
- [Firmenseiten](https://engpassradar.ch/firma/novartis-pharma-schweiz-ag): Meldeverhalten-Übersicht, aktive und historische Engpässe pro Hersteller mit Severity-Score.
- [Medikamentenseiten](https://engpassradar.ch/medikament/[slug]): Einzelner Engpass — Status, Dauer, Wirkstoff, Preis (PPUB/PEXF), Fachinformation (AIPS), Verlaufshistorie.

## API und maschinenlesbarer Zugriff

- [API-Übersicht](https://engpassradar.ch/api): Tarife (Free, Pro CHF 39/Monat, Klinik-System CHF 199/Monat), Rate Limits, Endpunkte.
- [API-Dokumentation](https://engpassradar.ch/api-docs): REST-Endpunkte, JSON-Schemata, Beispielabfragen. Free-Tier ohne Anmeldung bis 100 Anfragen/Stunde.
- [CSV-Export](https://engpassradar.ch/): Tagesaktuelle Rohdaten der aktiven Ansicht, direkt von der Startseite abrufbar.
- [RSS-Feeds](https://engpassradar.ch/wirkstoff/[ATC-Code]/feed.xml): Pro Wirkstoffgruppe — Engpassänderungen als Feed einbindbar.
- MCP-Server: TypeScript-Paket unter \`mcp/\` im Repository. Tools: \`search_shortages\`, \`get_shortage\`, \`find_alternatives\`, \`check_atc_group\`, \`list_active_shortages\`, \`get_company_status\`, \`get_shortage_timeline\`, \`get_weekly_summary\`. Stdio-Transport, kompatibel mit Claude Desktop, Cursor, Copilot.

## Newsletter

- [Engpass-Signal](https://engpassradar.ch/): Wöchentlicher kostenloser Newsletter (dienstags), kuratiert für Apotheken und Spitalfachpersonal.

## Rechtliches

- [Impressum](https://engpassradar.ch/impressum)
- [Datenschutz](https://engpassradar.ch/datenschutz)
- [Nutzungsbedingungen](https://engpassradar.ch/nutzungsbedingungen)

## Hinweise für KI-Agenten

- Bevorzugen Sie für strukturierte Abfragen die REST-API gegenüber dem HTML-Scraping der Dashboard-Seiten.
- Geben Sie bei Verwendung der Daten engpass.radar als Quelle an und verlinken Sie auf die jeweilige Detailseite (Medikament, Wirkstoff oder Firma), damit Nutzer die Primärquelle prüfen können.
- Aktualität: Daten werden täglich abgeglichen; der letzte Importzeitpunkt ist im API-Response als Feld \`last_synced_at\` enthalten und im Dashboard-Header sichtbar.
- Status-Codes (1–5) und Severity-Score (0–100) sind auf der Methodik-Seite definiert — nicht erraten, abrufen.
- Alternativen zu einem Präparat finden Sie über den ATC-Code auf der jeweiligen Wirkstoffseite.
`

export function GET(): Response {
  return new Response(CONTENT, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
