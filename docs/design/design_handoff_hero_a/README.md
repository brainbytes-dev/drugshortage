# Handoff: Hero A — Live-Zahl (engpass.radar)

## Overview

Neuer Hero für **engpassradar.ch** — Variante **A „Live-Zahl"**. Die Landing Page führt künftig mit der dominanten Live-Zahl aller aktiven Lieferengpässe in der Schweiz. Die Suche wird zum primären CTA. Deltas und Quellen-Freshness sichtbar, aber nachrangig.

Ersetzt den bestehenden Hero in `src/app/page.tsx` (Homepage, de-CH).

## About the Design Files

Die Dateien in diesem Paket sind **Design-Referenzen in HTML/JSX** — ein Prototyp der Zielgestalt, keine produktionsfertigen Komponenten. Ziel ist die **Nachbildung im bestehenden Next.js-/React-/Tailwind-/shadcn-Setup** von engpassradar.ch, nicht der wörtliche Import des JSX.

Konkret:
- Farben als Tailwind-Variablen / CSS-Custom-Properties in der Theme-Datei pflegen
- Typografie über die vorhandene Inter-Einbindung
- Komponenten (Header, Search, Chip) als reguläre React-Komponenten unter `src/components/`
- Daten aus dem bestehenden Prisma-/Supabase-Layer, nicht hardcodiert

## Fidelity

**High-Fidelity.** Farben, Typo-Skala, Abstände, Radien sind final. Pixelgenaue Nachbildung im bestehenden Stack.

## Screen

**`/` — Homepage Hero**

### Purpose
Erstkontakt. Eine Zahl liefert sofort Relevanzsignal, die Suche erlaubt in zwei Sekunden Zugriff auf das Medikament, das den Besuch ausgelöst hat. Kein „Feature-Teaser", kein Marketing.

### Layout

Container: `max-width: 1280px`, horizontal zentriert, Padding `72px 56px 88px`.

Grid zwei Spalten: `1fr 340px`, Gap `72px`, `align-items: end`.

**Oben (volle Breite):**  
Eyebrow-Zeile mit Pulse-Dot · Quellen-String in Mono-Font, Uppercase, `letter-spacing: 0.04em`, Farbe muted.

**Links (große Spalte):**
1. Zahl `712` — `font-size: 184px`, `font-weight: 600`, `letter-spacing: -0.055em`, `line-height: 0.88`, tabular-nums.
2. H1 darunter — `font-size: 34px`, `font-weight: 500`, `letter-spacing: -0.02em`, `line-height: 1.15`, `max-width: 720px`.
3. Sub-Lede — `font-size: 16px`, muted, `max-width: 580px`, `line-height: 1.55`.

**Rechts (Deltas-Spalte):**  
`border-left: 1px solid border`, `padding-left: 32px`, `flex column`, `gap: 20px`.  
Vier Reihen: Label (`12px muted uppercase`) + Value (`28px · 600 · tabular-nums`).

**Unten (Suche, neue Zeile, `margin-top: 64px`, `max-width: 760px`):**  
Label „Suchen" (muted, uppercase). Darunter Input-Row mit Lupe-Icon · Placeholder · ⏎-Badge.  
Unter der Input eine Chip-Reihe (5 Beispiele).

### Components

#### ERHeader (site-wide, nicht Hero-spezifisch — aber Teil dieses Handoffs)
- Höhe: `18px 56px` Padding, `border-bottom: 1px solid border`.
- Links: Logo `engpass.radar` (semibold 17px, `.radar` in Primary-Teal) · Nav-Items (Dashboard · Methodik · API · Bericht · FAQ, 13.5px muted, aktiv fg 500)
- Rechts: Datum+Zeit (Mono 11.5px muted) · Button „Newsletter" (outline, 13px, radius 6)

#### Eyebrow + Pulse
- Text: `Abgleich heute · drugshortage.ch · BWL · USB Basel · ODDB`
- Mono 12px, uppercase, letter-spacing 0.04em, Farbe muted
- Davor ein animierter Pulse-Dot (7×7, success-Farbe, CSS-Keyframe `er-pulse` 2s infinite)

#### Big Number
- Text `712` (dynamisch aus DB — `count(Shortage WHERE active=true)`)
- 184px · 600 · letter-spacing -0.055em · line-height 0.88

#### Headline + Sub-Lede
- H1: „Medikamente in der Schweiz sind aktuell als nicht lieferbar gemeldet."
- Sub: „Aggregiert aus drugshortage.ch, BWL-Pflichtlager und der USB-Basel-Liste. Täglich abgeglichen, öffentlich zugänglich."

#### Delta Rows (4 Stück)
- `Neu seit KW 15` · `+5` · neutral fg
- `Beendet seit KW 15` · `−12` · success
- `≥ 6 Monate aktiv` · `207` · suffix `29 %` muted
- `Historische Fälle` · `8 642` · suffix `seit 2018` muted

Alle Zahlen dynamisch aus DB. KW-Nummer aus `date-fns` o. ä.

#### Search
- Background `bgAlt`, `border: 1px solid border2`, `radius 8`, Padding `16 20`
- Placeholder: „Wirkstoff, Handelsname, ATC-Code oder Firma"
- Rechts Mono-Badge `↵`
- Submit routet auf `/?q=<term>` (bestehende Filter-Route)

#### Chips
- 5 Beispiele: `Amoxicillin`, `Metformin`, `ATC · J01`, `Insulin`, `Tamoxifen`
- 13px muted, `padding: 6 12`, `radius 999`, `border 1px border`, Klick → Search-Route

## Interactions & Behavior

- **Pulse-Dot**: rein dekorativ, signalisiert Live-Datenstand
- **Search**: Enter oder ⏎-Badge-Klick → Navigation auf `/?q=<term>` (bestehende Query-Param-Logik)
- **Chips**: Klick setzt Such-Wert und submitet
- **Delta-Werte**: keine Interaktion nötig, rein informativ
- **Header-Nav**: reguläre Links
- Keine Hover-Animationen außer Farbwechsel auf Links/Buttons

## State / Data

Alle Werte aus bestehenden DB-Queries in `src/app/page.tsx`:

```ts
const activeCount      // count(Shortage where endedAt is null)
const newThisWeek      // shortages reported in current ISO week
const resolvedThisWeek // shortages ended in current ISO week
const longTermCount    // active shortages with startedAt > 6 months ago
const longTermPct      // longTermCount / activeCount
const historicalTotal  // total Shortage rows incl. resolved
```

ISR revalidate beibehalten (1 h).

## Design Tokens

### Colors (OKLCH)

```css
--bg:          oklch(1 0 0);
--bg-alt:      oklch(0.985 0.002 240);
--fg:          oklch(0.18 0.01 240);
--muted:       oklch(0.45 0.01 240);
--muted-2:     oklch(0.65 0.01 240);
--border:      oklch(0.91 0.005 240);
--border-2:    oklch(0.84 0.005 240);
--primary:     oklch(0.52 0.09 200); /* Medical Teal */
--primary-soft:oklch(0.52 0.09 200 / 0.10);
--destructive: oklch(0.58 0.21 27);
--warning:     oklch(0.72 0.15 75);
--success:     oklch(0.58 0.13 150);
```

### Typography

- Sans: Inter 400/500/600/700 · `font-feature-settings: "cv11","ss01"`
- Mono: JetBrains Mono 400/500 · `font-feature-settings: "tnum"`
- Nums in Zahlenfeldern: `font-variant-numeric: tabular-nums`

### Spacing

- Container horizontal-padding: `56px` Desktop
- Section vertical-padding: `72px` top / `88px` bottom
- Grid-Gap Hero: `72px`
- Delta-Stack-Gap: `20px`
- Search-to-Chips: `14px`

### Radii

- Buttons / Inputs: `6px` / `8px` (Search Input)
- Chips: `999px`

## Responsive

- `< 1024px`: Grid kippt auf 1-Spalte, Deltas werden 2×2 Grid, Border-Left weg, stattdessen Border-Top
- `< 640px`: Zahl auf `128px`, H1 auf `26px`, Padding auf `32px` horizontal
- Header-Nav kollabiert auf Hamburger ab `< 768px` (bestehende Pattern prüfen)

## Accessibility

- H1 als einziges `<h1>` auf der Seite
- Pulse-Dot mit `aria-hidden="true"`
- Search-Input mit sichtbarem Label (nicht nur Placeholder)
- Alle Zahlen mit `aria-label` wenn sie allein stehen (z. B. „712 aktive Engpässe")

## Assets

Keine Bilder. Nur Inline-SVG (Lupe-Icon, Pulse via CSS). Keine neuen Fonts — Inter und JetBrains Mono sind bereits eingebunden.

## Files in diesem Paket

- `hero-a.jsx` — Hero-Prototyp (Referenz für Layout und Token)
- `hero-shared.jsx` — ERHeader, ERPulse, Brand-Token-Setup (Referenz)
- `hero-variants.html` — Vollständiges Canvas mit allen vier Richtungen (A gewählt)
- `content-faq-konzept.html` — Content- und FAQ-Konzept (Kontext: die überarbeitete FAQ mit 8 Einträgen wird in einem separaten Schritt umgesetzt)

## Was NICHT Teil dieses Handoffs ist

- Header-Navigation als site-wide Komponente (separater Task)
- FAQ-Neuentwurf (separater Task, Konzept liegt bei)
- Dashboard-Tabelle unterhalb des Heros (bleibt wie bestehend)
- Monatsbericht-Route, API-Pricing-Page, Newsletter-Template (künftige Tasks)

## Umsetzungshinweise

1. Tokens in `tailwind.config.ts` und `globals.css` ergänzen, falls noch nicht vorhanden
2. `<ERHeader />` als `src/components/header.tsx` extrahieren (wird site-wide, nicht nur Hero)
3. Hero als `src/components/hero.tsx` — reine View-Komponente, Daten als Props
4. `src/app/page.tsx` liefert die Daten aus Prisma und gibt sie an `<Hero />`
5. Mono-Font via `next/font/google` einbinden, falls noch nicht geschehen
6. Existierende FAQ/„Wie es funktioniert"-Sections unterhalb des Heros zunächst unverändert lassen — die werden in einem Folge-Task angepasst
