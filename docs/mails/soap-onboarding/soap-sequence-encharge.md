# SOAP-Sequenz — Encharge Setup-Guide
## Engpassradar Newsletter Onboarding (5 E-Mails, 7 Tage)

**Trigger:** Neue Newsletter-Anmeldung (opt-in bestätigt)  
**Ziel:** Free-User zu Pro-Subscriber konvertieren  
**Absender:** `alerts@engpassradar.ch` · Anzeigename: `Henrik von engpass.radar`

---

## Encharge Setup — Schritt für Schritt

### 1. Flow erstellen
- Encharge → **Flows** → **New Flow**
- Name: `Newsletter Onboarding SOAP`
- Trigger: **"Person subscribed to broadcast list"** → Liste: `Newsletter`

### 2. Zeitverzögerungen
```
Tag 0 (sofort)  → E-Mail 1
Tag 2           → E-Mail 2
Tag 3           → E-Mail 3
Tag 5           → E-Mail 4
Tag 7           → E-Mail 5
```

### 3. Unsubscribe-Link
Encharge fügt automatisch einen Abmeldelink ein. Sicherstellen dass die Einstellung  
**"Include unsubscribe link in footer"** aktiv ist.

---

## Die 5 E-Mails

---

### E-Mail 1 — Tag 0 (sofort nach Opt-in)
**Betreff:** `Willkommen — und eine kurze Frage`  
**Preview-Text:** `Wir senden Ihnen jeden Dienstag die 5 wichtigsten Engpässe…`

```
Guten Tag,

willkommen beim Engpass-Signal.

Jeden Dienstag erhalten Sie die 5 relevantesten Medikamenten-Engpässe 
der Woche in Kurzform — kuratiert für Apotheken und Spitalfachpersonal 
in der Schweiz.

Das Dashboard mit allen aktuellen Engpässen ist jederzeit kostenlos 
zugänglich:
→ https://engpassradar.ch

Eine kurze Frage: Was ist Ihre grösste Herausforderung beim Thema 
Medikamenten-Engpässe? Einfach auf diese E-Mail antworten — ich lese 
jede Nachricht persönlich.

Mit freundlichen Grüssen
Henrik Rühe
engpass.radar
```

**CTA-Button:** `Zum Dashboard →` → `https://engpassradar.ch`

---

### E-Mail 2 — Tag 2
**Betreff:** `Warum ich engpassradar.ch gebaut habe`  
**Preview-Text:** `Die offiziellen Daten existieren — ich habe ein Werkzeug gebaut, das sie für den Alltag aufbereitet.`

```
Guten Tag,

darf ich Ihnen kurz erklären, wie engpassradar.ch entstanden ist?

Als Neurologe in der Schweiz habe ich beobachtet, wie viel Zeit Apotheken 
täglich damit verbringen, die offiziellen Engpassquellen manuell zu prüfen 
und die Daten zusammenzuführen — Suche, Filterung, Wirkstoff-Zuordnung, 
Alternativencheck.

Die Daten sind vorhanden und zuverlässig. Was fehlte: ein Werkzeug, das 
sie für den Apotheken-Alltag aufbereitet.

engpassradar.ch aggregiert täglich alle offiziellen Schweizer 
Engpass-Quellen, reichert jede Meldung automatisch mit Wirkstoff-Daten 
an und berechnet einen Score, der zeigt wie ernst ein Engpass wirklich 
ist — nicht nur ob er gemeldet ist.

Öffentlich zugänglich. Kostenlos. Weil ein Informationsproblem kein 
Patientenproblem sein darf.

→ https://engpassradar.ch

Henrik
```

**CTA-Button:** `Dashboard öffnen →` → `https://engpassradar.ch`

---

### E-Mail 3 — Tag 3
**Betreff:** `Der Engpass-Score — was ihn von einer Liste unterscheidet`  
**Preview-Text:** `Eine Meldung ist eine Meldung. Aber wie lange dauert sie? Gibt es Alternativen?`

```
Guten Tag,

die offizielle Engpassliste sagt: dieses Medikament ist gemeldet.

Sie sagt nicht:
— wie lange dieser Engpass typischerweise dauert
— ob es wirkstoffgleiche Alternativen gibt
— ob dieses Präparat häufig oder selten in Engpass ist

Das ist der Unterschied zwischen einer Liste und einem 
Entscheidungswerkzeug.

Der Engpass-Score auf engpassradar.ch berechnet für jede Meldung einen 
Wert von 0–100, basierend auf:
• Bisherige Dauer des Engpasses
• ATC-Klasse und Häufigkeit von Engpässen in dieser Gruppe
• Verfügbarkeit von Alternativen
• BWL-Pflichtlagerstatus

Ein Score von 80 bedeutet: dieser Engpass ist kritisch, langwierig, und 
schwer zu ersetzen. Ein Score von 20 bedeutet: gemeldet, aber 
wahrscheinlich kurzfristig und mit Alternativen verfügbar.

Diese Metrik gibt es in der Schweiz nur auf engpassradar.ch.

→ https://engpassradar.ch/methodik

Henrik
```

**CTA-Button:** `Methodik ansehen →` → `https://engpassradar.ch/methodik`

---

### E-Mail 4 — Tag 5
**Betreff:** `Was die meisten Nutzer nicht wissen`  
**Preview-Text:** `RSS-Feeds, ATC-spezifische Alerts, CSV-Export — alles kostenlos`

```
Guten Tag,

ein paar Features von engpassradar.ch, die wenig bekannt sind:

1. RSS-Feeds pro Wirkstoffgruppe
Jede ATC-Gruppe hat einen eigenen RSS-Feed. Sie können Engpässe für 
Ihre relevanten Wirkstoffe direkt in Ihr PMS oder Monitoring-System 
einbinden:
engpassradar.ch/wirkstoff/[ATC-Code]/feed.xml

2. ATC-spezifische E-Mail-Alerts
Auf jeder Wirkstoff-Seite können Sie einen kostenlosen E-Mail-Alert 
einrichten — Sie werden benachrichtigt wenn sich die Lage für diesen 
Wirkstoff ändert.

3. CSV-Export
Der tagesaktuelle Datensatz lässt sich als CSV exportieren — direkt 
aus dem Dashboard.

4. Öffentliche REST-API
Alle Endpunkte sind öffentlich und ohne Registrierung nutzbar bis 
100 Anfragen/Stunde. Für produktive Integrationen gibt es den 
Engpassradar Pro-Plan.

→ https://engpassradar.ch/api-docs

Henrik
```

**CTA-Button:** `API-Dokumentation →` → `https://engpassradar.ch/api-docs`

---

### E-Mail 5 — Tag 7 (Conversion)
**Betreff:** `Für Sie: 14 Tage Engpassradar Pro — kostenlos`  
**Preview-Text:** `10'000 API-Anfragen täglich, Engpass-Score API, kein Limit auf Ihre Watchlist`

```
Guten Tag,

eine Woche Engpass-Signal liegt hinter Ihnen. Ich hoffe, die wöchentlichen 
Updates sind hilfreich.

Falls Sie engpassradar.ch in Ihre bestehenden Prozesse oder Systeme 
einbinden möchten, habe ich ein Angebot für Sie:

14 Tage Engpassradar Pro — kostenlos, ohne Kreditkarte:

✓ 10'000 API-Anfragen pro Tag (statt 100/Stunde)
✓ Engpass-Score-API für automatisierte Bewertung
✓ Batch-Abfragen bis 50 Präparate gleichzeitig
✓ Voller API-Key-Zugang

Nach 14 Tagen CHF 39/Monat — oder einfach nicht fortfahren.

→ [Trial starten]

Für Spitalapotheken mit spezifischen Anforderungen (Webhooks, 
persönlicher Onboarding-Call, monatlicher Shortage Report als PDF):
→ https://engpassradar.ch/klinik-system

Henrik
```

**CTA-Button:** `14 Tage Pro starten →` → `https://engpassradar.ch/api-keys`  
*(Trial-Link: bis Stripe Trial-Produkt konfiguriert ist, direkt zu api-keys)*

---

## Encharge-spezifische Einstellungen

### Tags & Segmente
- Beim Opt-in automatisch Tag `newsletter-subscriber` setzen
- Nach Klick auf E-Mail 5 CTA: Tag `pro-trial-intent` setzen (für Follow-up)

### A/B-Test (optional, später)
- E-Mail 5 Betreff A: `14 Tage Engpassradar Pro — kostenlos`
- E-Mail 5 Betreff B: `Haben Sie die API schon getestet?`

### Abbruchbedingungen
Flow beenden wenn:
- Person kauft Pro-Abo (Event: `stripe_checkout_completed`)
- Person meldet sich ab

### Tracking
- UTM-Parameter auf alle Links: `?utm_source=encharge&utm_medium=email&utm_campaign=soap-onboarding`

---

## Priorisierung

Zuerst E-Mail 1–3 aufsetzen (branding + education).  
E-Mail 4–5 können nach der ersten Live-Woche folgen.  
E-Mail 4 aktualisieren sobald erste echte Nutzer-Zitate vorhanden.
