# Design

## 1. Visual Theme & Atmosphere

**Scene sentence.** Eine Apothekerin steht am Tresen einer Schweizer Offizin um 14:30, Tageslicht durchs Schaufenster, eine Kundin fragt nach Pantoprazol. Sie öffnet engpassradar.ch am Smartphone, einhändig. Die Seite muss in unter fünf Sekunden eine Status-Antwort liefern, ohne gelesen zu werden. Parallel: Spitalpharmazeut Basel, 21:00, gedimmtes Büro, Desktop, dritter Tab, monatlicher Engpass-Report fällig — er erwartet dichte Tabellen, exportierbar.

Das diktiert: **Light Mode als Primärmodus** (Offizin-Tageslicht), **Dark Mode als gleichwertige Spätschicht-Variante**, niemals dark-by-default. Atmosphäre: ruhig, warm-papier statt steril-weiss, lesbar bei aller Beleuchtung, **nicht** klinisch-bläulich (das ist die Healthcare-Reflex-Lane, die wir verlassen).

**Dials (verpflichtend, treiben jede Komponentenentscheidung).**

```
DESIGN_VARIANCE: 0.25   # zurückhaltend, Konventionen respektieren, Identität durch wenige starke Entscheidungen
MOTION_INTENSITY: 0.15  # praktisch statisch — Animation nur dort, wo sie Wachsamkeit signalisiert oder State-Wechsel klärt
VISUAL_DENSITY: 0.65    # dicht, aber atmungsfähig — Tabellen Bloomberg-nah, Hero/Marketing FT-Press-nah
```

Re-lies diese Werte vor jeder Komponentenentscheidung. Hoher MOTION_INTENSITY wäre Lizenz zu animieren — 0.15 ist Lizenz, alles Dekorative wegzulassen.

## 2. Color System

### Strategie

**Restrained mit committed Akzent.** Tinted-Neutrals tragen 92 % der Fläche; ein einziger Brand-Akzent (Indigo) zieht Aufmerksamkeit nur dort, wo etwas zu tun ist. Daneben drei strikt-semantische Status-Hues (Aktiv / Neu / Resolved) — sie sind keine Brand-Farben, sondern Daten-Sprache.

**Reflex-Reject.** `#fff`, `#000`, Healthcare-Teal (hue 180–210 niedrig-chroma), Hospital-Mint, Krypto-Neon-on-black. Alles getintet Richtung warm (`hue 85–95`), niemals neutral-grau und niemals kühl.

### Light Mode Tokens (OKLCH)

```css
/* Foundation — warm-tinted neutrals (hue ~95, warmer paper) */
--background:           oklch(0.99 0.003 95);  /* paper white, warm tint */
--foreground:           oklch(0.18 0.01  95);  /* warm near-black, never #000 */
--muted:                oklch(0.96 0.005 95);  /* table-row, secondary surfaces */
--muted-foreground:     oklch(0.50 0.008 95);  /* labels, eyebrows, captions */
--border:               oklch(0.90 0.006 95);
--border-strong:        oklch(0.82 0.008 95);  /* card edges, table separators */
--input:                oklch(0.93 0.006 95);
--ring:                 oklch(0.42 0.16 268 / 0.55);  /* focus ring = primary @ 55% */

/* Brand — single committed accent */
--primary:              oklch(0.42 0.16 268);  /* deep indigo, ~268° hue */
--primary-foreground:   oklch(0.99 0.003 95);
--primary-soft:         oklch(0.94 0.04  268); /* indigo wash for callouts */

/* Status — semantic, never decorative */
--status-active:        oklch(0.52 0.19 25);   /* burnt orange-red — aktive Engpässe */
--status-active-soft:   oklch(0.96 0.03  25);
--status-new:           oklch(0.48 0.14 268);  /* indigo-verwandt — neue Meldungen this week */
--status-new-soft:      oklch(0.95 0.03  268);
--status-resolved:      oklch(0.52 0.10 145);  /* warm green, NICHT teal/mint */
--status-resolved-soft: oklch(0.95 0.02  145);
--status-longterm:      oklch(0.55 0.11 65);   /* amber — Dauer-Engpässe (>180d) */
--status-longterm-soft: oklch(0.95 0.03  65);

/* Charts — derived from status, ordered */
--chart-1: var(--status-active);
--chart-2: var(--status-new);
--chart-3: var(--status-resolved);
--chart-4: var(--status-longterm);
--chart-5: oklch(0.45 0.02 95);  /* neutral fallback */
```

### Dark Mode Tokens

```css
--background:           oklch(0.16 0.008 95);  /* warm dark, never #111 */
--foreground:           oklch(0.96 0.003 95);
--muted:                oklch(0.22 0.008 95);
--muted-foreground:     oklch(0.66 0.006 95);
--border:               oklch(1 0 0 / 0.10);
--border-strong:        oklch(1 0 0 / 0.16);
--input:                oklch(1 0 0 / 0.12);
--ring:                 oklch(0.72 0.16 268 / 0.55);

--primary:              oklch(0.72 0.16 268);  /* lifted lightness for dark */
--primary-foreground:   oklch(0.16 0.008 95);
--primary-soft:         oklch(0.30 0.10 268);

--status-active:        oklch(0.70 0.18 25);
--status-active-soft:   oklch(0.26 0.10 25);
--status-new:           oklch(0.72 0.14 268);
--status-new-soft:      oklch(0.26 0.08 268);
--status-resolved:      oklch(0.70 0.12 145);
--status-resolved-soft: oklch(0.24 0.06 145);
--status-longterm:      oklch(0.74 0.12 65);
--status-longterm-soft: oklch(0.26 0.06 65);
```

### Contrast Checks (WCAG AA)

- `--foreground` auf `--background` (Light): ≥ 16:1 (well over AAA)
- `--muted-foreground` auf `--background` (Light): ≥ 4.6:1 (AA Body) — verifiziert vor jeder Token-Änderung
- `--primary-foreground` auf `--primary`: ≥ 7:1 (AA Large + AA Body)
- Status-Töne (hellste Variante): ≥ 4.5:1 auf weissem Hintergrund

### Absolute Bans

- Kein `#000`, kein `#fff`, kein neutrales Grau (chroma = 0).
- Kein Teal/Mint/Cyan (hue 160–220) als Brand-Akzent — nur als sehr punktuelles Status-Element falls je nötig (aktuell: nein).
- Kein `gradient-text` mit `background-clip: text` für Akzentwörter im Body. Akzent kommt durch Font-Weight oder Serif-Wechsel.
- Keine Glassmorphism-Karten, keine `backdrop-blur` als Dekoration.

## 3. Typography

### Schriftfamilien

```css
--font-sans:    "Inter", -apple-system, system-ui, sans-serif;
--font-serif:   "Fraunces", "Source Serif 4", Georgia, serif;
--font-mono:    "IBM Plex Mono", ui-monospace, "SF Mono", monospace;
```

Alle drei sind Google Fonts (kostenfrei, web-ladbar). Inter ist bereits im Projekt — Fraunces und IBM Plex Mono werden via `next/font` ergänzt.

### Rollen

| Rolle | Familie | Wann |
|---|---|---|
| **Display Number** (Hero `12’340`) | Fraunces, optical size 144, weight 600, slight roman, narrow tracking | Nur Hero-Aktiv-Zahl + Sektion-Hero-Numbers im Blog |
| **H1 / Page-Headline** | Inter, weight 600, tracking `-0.02em` | Dashboard-Titel, Detail-Pages |
| **H2 / Section** | Inter, weight 600, tracking `-0.015em` | Blog-Sections, Marketing-Sektionen |
| **H3 / Sub-Section** | Inter, weight 600 | Untergeordnete Headlines |
| **Body** | Inter, weight 400, line-height 1.55 | Fliesstext, Tabellen-Zellen |
| **Editorial Lead** | Fraunces, weight 400, italic optional | Blog-Lead-Paragraph, Editorial-Hervorhebung in Marketing-Sektionen |
| **Eyebrow / Label** | IBM Plex Mono, weight 500, `uppercase`, tracking `0.04em`, size 11–12px | Quellen-Label, Tabellen-Header, "Stand"-Stempel, Methodik-Verweise |
| **Tabular Data** | Inter mit `font-feature-settings: "tnum" 1`, tabular-nums | Alle Zahlen in Tabellen und Delta-Zeilen |

### Hierarchie-Skala

Strikter 1.25-Step (Major Third) ab Body 16 px:

```
xs:   11px   (Eyebrow, Mono-Labels)
sm:   13px   (Secondary)
base: 16px   (Body)
lg:   20px   (Lead, Card-Headline)
xl:   25px   (Delta-Werte Hero)
2xl:  32px   (H3)
3xl:  40px   (H2)
4xl:  50px   (H1 Detail-Pages)
hero: clamp(96px, 13vw, 168px)  (Hero-Aktiv-Zahl — Fraunces, optical size 144)
```

Body line-length: 65–72ch. Mehr ist auf Desktop nicht erlaubt.

### Typografie-Tells, die wir vermeiden

- Keine "alle Headings gleich gross" Skala — Kontrast ≥ 1.25 zwischen Stufen, sichtbar.
- Kein `letter-spacing` auf Body (nur Eyebrow / Display-Numbers).
- Keine ALL-CAPS-Headlines (ALL-CAPS nur für Mono-Eyebrow-Labels, max. 6 Wörter).
- Kein `italic` auf Body-Text — italic ist Editorial-Lead-Reserviert oder Werknamen.

## 4. Components

### Buttons

Drei Varianten, mehr nicht.

```
Primary:    bg-primary, text-primary-foreground, border-transparent.
            Used: hero "Pro testen", Watchlist hinzufügen, Newsletter abschicken.
Secondary:  bg-muted/40, text-foreground, border-border-strong.
            Used: alle Tool-Aktionen (CSV-Export, Filter zurücksetzen).
Ghost:      bg-transparent, text-muted-foreground hover:text-foreground.
            Used: Pagination, Tab-Wechsel, Sekundär-Links in Tabellen.
```

- **Höhe**: `--btn-h: 40px` Standard, `--btn-h-sm: 32px` für inline/icon-only, `--btn-h-lg: 48px` für Hero/Mobile-Primary.
- **Touch-Target**: jeder Button hat `min-height: 44px` auf Mobile (`< sm`).
- **Radius**: `--radius-sm: 6px` für Buttons. Niemals pill-shaped (`rounded-full` ausschliesslich für Status-Badges und Avatare).
- **Focus-Visible (Pflicht)**: `outline: 2px solid var(--ring); outline-offset: 2px;` — jeder interaktive Schalter, kein `outline: none` ohne identischen Ersatz.

### Cards

Cards sind **nicht** Default-Container. Vor Verwendung der Test: hätte das hier ohne Card-Border auch funktioniert? Wenn ja → keine Card.

Wo Cards berechtigt sind: Pricing-Tiers (vergleichende Auswahl), Watchlist-Items (Status pro Eintrag), Blog-Listing (Hover-Affordance). Wo nicht: Marketing-Feature-Sektionen, Hero-Stat-Boxen, KPI-Zeilen.

```
Card:       bg-card, border 1px solid border-strong, radius 10px.
            Padding 24px desktop / 20px mobile. Kein nested-Card.
            Kein side-stripe-border (links oder rechts gefärbt). VERBOTEN.
```

### Tables

Das ist die Identitätskomponente. Dichter als Bootstrap, lesbarer als Bloomberg.

- Row-Height: 44 px (passt Touch-Target und Glance-Density).
- Zebra: `tr:nth-child(even) { background: oklch(--muted/25) }` — sehr subtil.
- Header: IBM Plex Mono, 11px, uppercase, tracking 0.04em, color `--muted-foreground`, padding 12px.
- Border: nur unten zwischen Zeilen (`border-bottom: 1px solid border`). Keine vertikalen Trenner.
- Numbers: tabular-nums, rechtsbündig, Apostroph-Tausender (`12’340`).
- Status-Badge in Tabellenzelle: kleiner Kreis-Indikator (8 px) + Inline-Text, **nicht** ausgefüllter Pill.

### Status Badges

```
.badge-active     → Kreis: status-active, Text: status-active
.badge-new        → Kreis: status-new, Text: status-new
.badge-resolved   → Kreis: status-resolved, Text: muted-foreground (de-emphasized)
.badge-longterm   → Kreis: status-longterm, Text: status-longterm
```

Niemals als komplett gefärbte Pill. Nie als Side-Stripe in Cards/Listen.

### Forms

- Label oben, Mono-Style optional für Detail-Eyebrows (z.B. `STAND` über Search).
- Input-Höhe: 44 px (Touch-konform), padding 16 px horizontal.
- Fehler: Text in `status-active` direkt unter Input, mit Icon (Lucide `alert-circle`).
- Niemals "input mit grossem Magnify-Icon im Hero als zentrales Element" — Search-Hero ist Eyebrow-Label-getrennt, nicht placeholder-getragen.

### Charts

`recharts`-basiert. Regeln:

- Linien: 2 px, Farbe aus `--chart-*` strikt in Status-Reihenfolge.
- Achsen: `--muted-foreground`, Schrift Mono 10 px.
- Gridlines: dashed, `border` Farbe, Opacity 0.4.
- Keine Gradient-Fills, keine 3D, keine animierte Mount-Animationen (`isAnimationActive={false}`).
- Tooltip: Mono-Labels, Werte tabular-nums.

## 5. Layout Principles

### Spacing-Grid (verbindlich)

**Strict 4 px Base-Grid.** Jeder padding/margin-Wert ist Vielfaches von 4. Toleranz: 0.

Bevorzugte Stops: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96 · 128`.

Falsch sind: `13px`, `7px`, `18px`, `clamp(72px, 14vw, 184px)` mit nicht-4er Endpunkten. Beim aktuellen Hero ist `pt-[72px] pb-6 px-10 mb-11 gap-[72px] mt-[18px] mt-16` ein gemischter Salat — wird im Audit als P1 markiert.

### Rhythm

Vertikale Abstände variieren bewusst:

```
Section-Break (Editorial):     96 px desktop / 64 px mobile
Section-Break (Tool/Tabelle):  48 px desktop / 32 px mobile
Innerhalb Sektion:             24-32 px
Innerhalb Card:                16-24 px
```

Niemals "alles 24 px" — das ist Monotonie und liest sich AI-generisch.

### Container

- Tool/Dashboard-Bereiche: `max-w-7xl` (1280 px), `px-4` mobile, `px-6` desktop.
- Marketing/Blog-Bereiche: `max-w-3xl` (720 px) für Fliesstext, `max-w-6xl` für mit-Visuals.
- Hero darf den Container brechen (Riesennumber wirkt nur ohne klassischen Container-Rand).

### Verbotene Layout-Muster

- **Side-stripe-border**: `border-left: 4px solid X` oder `border-right` auf Cards, Callouts, List-Items, Alerts. Ersatz: voller Border + Background-Tint oder leading Icon/Mono-Eyebrow.
- **Identical Card Grids**: 3-Spalten "icon-headline-text" auf Marketing-Sektionen ist verboten. Stattdessen Editorial-Aufzählung (zweispaltig oder einspaltig, Mono-Number-Prefix `01 / 02 / 03`).
- **Hero-Metric-Template**: nicht die "Big Number → 3 small stats → CTA-Button" SaaS-Schablone. Unser Hero hat die Number, ja, aber paired mit DeltaRows (Daten-Substanz), nicht mit "Trusted by 500+ pharmacies".
- **Modal-First**: Sheet/Drawer ist Default für Sekundär-Aktionen (Firmen-Ranking, ATC-Gruppen sind bereits Sheets — gut). Modals nur für destruktive Bestätigung.

## 6. Motion

Dial: `MOTION_INTENSITY = 0.15`.

### Erlaubt

- **Pulse-Dot im Eyebrow** (Wachsamkeitssignal, semantisch): bleibt, ist eine der wenigen identitätstragenden Animationen.
- **Filter-Reactions**: `transition: background-color 150ms ease-out` auf Buttons/Inputs. Keine Layout-Animations (kein `width`-Transition).
- **Sheet/Drawer Slide-In**: `transform: translateX` mit `ease-out-quart`, 280 ms. Backdrop fade 180 ms.
- **Number-Updates** in Live-Tabellen: `opacity 0.3 → 1` über 120 ms bei Wert-Wechsel. Kein Counter-Roll-Up.

### Verboten

- **Hero-Blob-Drift** (`@keyframes blob-drift` 20s infinite): raus. Dekorativ ohne Funktion.
- **Hero-Fade-Up-Cascade** (`.hero-animate-1..5` mit staggered delay): raus. Riecht nach AI-Landingpage. Hero erscheint sofort statisch — die Aktiv-Zahl ist die Show.
- Scroll-Driven Animationen (`scroll-timeline`): nein. Keine `intersection-observer`-getriebenen Fade-Ins.
- Bounce, elastic, spring-Easings: nein. Nur `ease-out-quart` / `quint`.
- Animationen auf CSS-Layout-Properties (`width`, `height`, `top`, `left`): nie. Nur `transform` und `opacity`.

### Reduced-Motion

`@media (prefers-reduced-motion: reduce)` muss:
- Pulse-Dot: zum statischen Punkt (kein Ping).
- Alle Sheet-Slides: zu Fade-only ohne Translate.
- Filter-Transitions: bleiben (sie sind funktional, keine Dekoration).

## 7. Iconography

**Lucide React** ist gesetzt. Keine zweite Icon-Library. Hand-gezeichnete SVGs nur für Logo / Markenkerne / Charts.

- Stroke-Width: konsequent `1.75` für 16–20 px Icons, `1.5` für ≥ 24 px.
- Größe: `12 / 14 / 16 / 20 / 24` — keine `13` oder `18`.
- Farbe: vererbt von `currentColor`. Icons haben nie eigene Farbtokens.

## 8. Content Voice (UI-Copy-Regeln)

Diese Regeln gelten für Strings in `messages/*.json`:

- **Siezen** (Sie/Ihnen), nie Duzen. Fachpublikum.
- Keine Em-Dashes (`—`), keine `--`. Stattdessen: Komma, Doppelpunkt, Klammer, Punkt.
- **Banned Words** (aus globaler Style-Guide): delve, crucial, robust, comprehensive, nuanced, multifaceted, furthermore, moreover, additionally, pivotal, landscape, tapestry, underscore, foster, showcase, intricate, vibrant, fundamental.
- Daten-Stempel ist Pflicht-Element: `Stand: 15.05.2026` als Mono-Eyebrow, niemals "kürzlich aktualisiert".
- CTAs sind Verb-Aktionen: "Pro testen", "Watchlist speichern", "CSV exportieren". Nie "Loslegen!" oder "Jetzt starten!".

## 9. Internationalization Layout

DE/EN/FR/IT. Layout muss Längenvariation tragen:

- **Buttons**: `min-width` setzen, niemals fixe Width. Französisch ist ~20 % länger als Deutsch.
- **Tabellen-Header**: Mono-Eyebrow erlaubt Abkürzung (`SUBST.` statt `Wirkstoff`). DE als Master, FR/IT entsprechend gekürzt.
- **Headlines**: `clamp()` für `font-size` mit Reserve. Hero-Number ist locale-invariant (Zahl), Headline darunter muss aber FR-tauglich sein.
- **Datumsformat**: Pro Locale (`DD.MM.YYYY` für DE/IT, `DD/MM/YYYY` für FR, `DD MMM YYYY` für EN). Apostroph-Tausender (`12’340`) für DE/IT, Komma (`12,340`) für EN, Leerzeichen (`12 340`) für FR.

## 10. Iteration Test (vor jedem Merge zu lesen)

1. Wäre diese Änderung ohne den AI-Slop-Reflex genauso entstanden? (Healthcare → teal? SaaS → 3-Card-Grid?)
2. Stimmt der MOTION_INTENSITY = 0.15 noch? Wurde dekorative Animation hinzugefügt?
3. Stimmt das 4 px-Grid? Gibt es krumme `px`-Werte?
4. Sind alle `:focus-visible` Outlines sichtbar?
5. Wechseln die Sprachen DE/EN/FR/IT ohne Layout-Bruch?
6. Hat jede Zahl ein Datum, jede Aussage eine Quelle?
