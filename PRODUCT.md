# Product

## Register

product

## Users

**Primär 1 — Apotheker:in in der Offizin.** Steht am Tresen, ein:e Kund:in fragt nach Medikament X. Job-to-be-Done: in unter fünf Sekunden wissen, ob X aktuell von einem Engpass betroffen ist, wie lange schon, und welche Alternative greifbar ist. Kontext: oft am Smartphone, einhändig, helle Offizin-Beleuchtung, unterbrochenes Arbeiten. Suche und Status-Erkennung müssen *ohne* Lesen langer Texte funktionieren — Glance-Tauglichkeit ist die harte Anforderung.

**Primär 2 — Klinikpharmazie / Spitalpharmazie.** Monitort 30–200 kritische Wirkstoffe parallel, baut Watchlists, recherchiert Alternativen, erstellt periodische Reports für Klinikleitung und Einkauf. Kontext: Desktop, mehrere Tabs, längere Sitzungen. Will dichte Tabellen, exportierbare Daten, historische Verläufe, ATC- und Hersteller-Aggregate — keine Erklärbär-UI.

Sekundär: Journalismus / Politik / Forschung (lesen Trends), Entwickler:innen (konsumieren API). Beide profitieren vom Hauptdesign, sind aber nicht der Optimierungs-Fokus.

## Product Purpose

engpassradar.ch macht Schweizer Lieferengpässe von Medikamenten in Echtzeit auffindbar, vergleichbar und exportierbar. Daten aus drugshortage.ch, BWL/admin.ch und USB Basel werden täglich automatisch konsolidiert, mit 128k ODDB-Medikamenten-Index angereichert und über Dashboard, REST-API, RSS und Watchlist zugänglich gemacht. Erfolg heisst: ein:e Apotheker:in stellt die Status-Frage auf engpassradar — nicht mehr auf drugshortage.ch direkt — weil die Antwort hier schneller, vollständiger und mit Alternativen kommt.

## Brand Personality

**Wachsam, faktisch, schweizerisch.**

- **Wachsam**: das Tool weiss früher Bescheid als der Anwender. Mikrosignale (Pulse-Dot, „neu diese Woche", Delta-Werte) zeigen Wachheit ohne Alarm-Theater.
- **Faktisch**: jede Zahl hat eine Quelle, jede Aussage einen Datumsstempel. Keine Marketing-Adjektive, keine Verkaufs-Phrasen. Wenn ein Wert variabel ist, wird er nie hartcodiert.
- **Schweizerisch**: Apostroph-Tausender (`12’340` statt `12,340`), Datumsformat `DD.MM.YYYY`, vier Landessprachen ernst genommen, Detail-Akkuratesse als ästhetischer Wert. *Nicht* amtlich, *nicht* Heidi-Klischee — eher NZZ-Datenredaktion als BAG-Formular.

Stimme: ruhig, kurz, präzise. Niemals euphorisch. Im Zweifel weniger Wort als mehr.

## Anti-references

Was engpassradar **explizit nicht** sein darf:

1. **Generisches Healthcare-Startup-UI** — weiss + entsättigtes Teal/Mint, glücklicher Stockfoto-Arzt im Hero, runde Icon-Badges, Doctolib-/Compendium-/Apo-Banking-Look. Die "Pharma-Welt mit Beruhigungsfarbe" muss durch ein eigenständiges System ersetzt werden.
2. **SaaS-Landing-Template** — Hero-Metric → "Features in 3 Cards" → Testimonial-Wall → Pricing-Tiles → CTA-Band. Das ist die Vercel-Template-Schule: pixelperfekt, brand-leer, austauschbar. engpassradar verkauft Substanz, nicht Sektionen.
3. **Konsumenten-/B2C-App** — bunte Pastell-Illustrationen, Onboarding-Coachmarks, Confetti, Emoji-Reactions, "Hi 👋" Begrüssungen. Das hier ist Profi-Werkzeug für Healthcare-Profis.
4. **Behörden-Ästhetik mit Abrutsch-Potenzial**: amtliche Formulare und admin.ch-Look sind keine Anti-Ref (Seriosität ist OK), aber sterile Government-Optik ohne eigene Identität ist zu vermeiden — engpassradar ist *komplementär* zu BWL/Swissmedic, nicht deren Kopie.

## Design Principles

1. **Das Tool ist die Botschaft.** Die Startseite ist das Dashboard — nicht eine Landing-Page mit Link zum Dashboard. Die Aktiv-Zahl trifft den Nutzer in der ersten Sekunde. Marketing-Sektionen (Pricing, Klinik-System) leben weiter unten und übernehmen erst, wenn das Werkzeug überzeugt hat.
2. **Daten zuerst, Dekoration danach.** Wenn ein Element keiner Frage des Apothekers oder Klinikpharmazeuten dient, kommt es weg. Cards, Icons, Gradients, Animationen müssen sich vor diesem Test verteidigen.
3. **Schweizer Detail-Akkuratesse als Identität.** Apostroph-Tausender, ISO-Wochen, präzise Datumsangaben, Quellen-Kennzeichnung, mehrsprachige Korrektheit — diese kleinen Dinge tragen die Marke. Generische i18n-Layouts (Google-Translate-Look) verraten den Aufwand.
4. **Mobile in der Offizin, Desktop in der Klinik.** Zwei unterschiedliche Nutzungskontexte — die Hierarchie muss beide tragen, ohne dass eine Seite ein Kompromiss wird. Mobile: einhändig, einsekündig. Desktop: dicht, lesbar, exportierbar.
5. **Aktualität sichtbar machen.** "Wann wurde das zuletzt gescrapt? Aus welcher Quelle?" muss auf jeder relevanten Page beantwortet werden — sonst zerfällt das Wachsamkeits-Versprechen.

## Accessibility & Inclusion

- **WCAG AA als Mindestbett.** 4.5:1 Body-Text, 3:1 für UI-Elemente und Large-Text. Fokus-Indikatoren sichtbar auf allen interaktiven Elementen — keine `outline: none` ohne Ersatz. Healthcare-Pflicht, nicht Kür.
- **`prefers-reduced-motion` respektieren.** Hero-Blob-Drift, Hero-Fade-In, Pulse-Dot — alles muss bei aktivierter Reduced-Motion in einen statischen Zustand verfallen (Pulse-Dot kann sichtbarer Punkt ohne Ping bleiben).
- **Mobile Touch-Targets ≥ 44 × 44 px.** Apotheker:innen tippen einhändig am Tresen. Buttons, Tabs, Toggle, Filter-Chips, Reset-Icons — alle prüfen.
- **Mehrsprachigkeit ist Layout-Anforderung.** FR ist ~20 % länger als DE, IT variiert stark. Headlines, Buttons und Tabellen-Header dürfen nicht brechen, wenn die Sprache wechselt. Aktuelle Sprache muss erkennbar bleiben (Flag + ISO-Code).
- **Keyboard-Navigation für alle Filter/Suche/Watchlist-Flows.** Klinikpharmazie arbeitet schneller mit Tab/Enter/Esc als mit der Maus.
