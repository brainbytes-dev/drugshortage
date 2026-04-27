# Offene TODOs

## Historische Tabellen — Inhalt erweitern
**Priorität:** Mittel  
**Kontext:** User findet die historischen Tabellen inhaltlich zu dünn.

Zu klären / umzusetzen:
- [ ] Welche Felder fehlen konkret in der Historisch-Ansicht? (Dauer, Score, ATC-Details?)
- [ ] Vergleich mit was drugshortage.ch in der historischen Tabelle zeigt
- [ ] Evtl. Detailseite pro historischem Eintrag (ähnlich wie aktuelle Medikament-Seite)
- [ ] Score-Berechnung auch für historische Einträge retroaktiv zeigen?

**Relevante Files:**
- `src/components/historical-table.tsx`
- `src/app/api/v1/shortages/route.ts` (historische Query-Logik prüfen)
- `src/lib/db.ts` → `queryHistoricalShortages()`
