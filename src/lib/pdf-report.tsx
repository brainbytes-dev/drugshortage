import { Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer'
import type { Shortage } from './types'

// Register a system font that's available in Node
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
    { src: 'Helvetica-Bold', fontWeight: 'bold' },
  ],
})

const C = {
  primary: '#0f766e',
  text: '#09090b',
  muted: '#71717a',
  border: '#e4e4e7',
  bg: '#f4f4f5',
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
  low: '#16a34a',
} as const

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', backgroundColor: '#ffffff', paddingTop: 48, paddingBottom: 48, paddingHorizontal: 48 },
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, paddingBottom: 16, borderBottomColor: C.border, borderBottomWidth: 1 },
  logo: { fontSize: 18, fontWeight: 'bold', color: C.text },
  logoAccent: { color: C.primary },
  headerMeta: { alignItems: 'flex-end' },
  headerLabel: { fontSize: 8, color: C.muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 },
  headerTitle: { fontSize: 11, fontWeight: 'bold', color: C.text },
  // Section
  sectionTitle: { fontSize: 8, color: C.primary, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 'bold', marginBottom: 12 },
  // Stats row
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  statBox: { flex: 1, backgroundColor: C.bg, borderRadius: 6, padding: 12 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: C.text, marginBottom: 2 },
  statLabel: { fontSize: 8, color: C.muted },
  // Table
  tableHeader: { flexDirection: 'row', backgroundColor: C.bg, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 4, marginBottom: 2 },
  tableRow: { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 8, borderBottomColor: C.border, borderBottomWidth: 1 },
  colRank: { width: 24, fontSize: 9, color: C.muted },
  colScore: { width: 52, fontSize: 9, fontWeight: 'bold' },
  colName: { flex: 1, fontSize: 9 },
  colFirma: { width: 120, fontSize: 8, color: C.muted },
  colAtc: { width: 56, fontSize: 8, color: C.muted },
  colDays: { width: 44, fontSize: 9, textAlign: 'right', color: C.muted },
  headerText: { fontSize: 8, fontWeight: 'bold', color: C.muted, textTransform: 'uppercase' },
  // Footer
  footer: { position: 'absolute', bottom: 32, left: 48, right: 48, flexDirection: 'row', justifyContent: 'space-between', borderTopColor: C.border, borderTopWidth: 1, paddingTop: 10 },
  footerText: { fontSize: 8, color: C.muted },
})

function scoreColor(score: number): string {
  if (score >= 80) return C.critical
  if (score >= 60) return C.high
  if (score >= 40) return C.medium
  return C.low
}

export interface ReportShortage extends Shortage {
  score: number
  scoreLabel: string
  bwl: boolean
}

interface Props {
  shortages: ReportShortage[]
  activeTotal: number
  newThisWeek: number
  month: string  // e.g. "April 2026"
  generatedAt: string  // e.g. "27.04.2026"
}

export function ShortageReportPDF({ shortages, activeTotal, newThisWeek, month, generatedAt }: Props) {
  return (
    <Document title={`Shortage Report Schweiz — ${month}`} author="engpass.radar">
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.logo}>
              engpass<Text style={s.logoAccent}>.radar</Text>
            </Text>
            <Text style={[s.headerLabel, { marginTop: 4 }]}>Schweizer Medikamenten-Engpass Dashboard</Text>
          </View>
          <View style={s.headerMeta}>
            <Text style={s.headerLabel}>Shortage Report</Text>
            <Text style={s.headerTitle}>{month}</Text>
            <Text style={[s.headerLabel, { marginTop: 2 }]}>Stand: {generatedAt}</Text>
          </View>
        </View>

        {/* Stats */}
        <Text style={s.sectionTitle}>Aktuelle Lage</Text>
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statValue}>{activeTotal}</Text>
            <Text style={s.statLabel}>Aktive Engpässe gesamt</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{newThisWeek}</Text>
            <Text style={s.statLabel}>Neue Meldungen diese Woche</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{shortages.filter(s => s.score >= 80).length}</Text>
            <Text style={s.statLabel}>Davon Score ≥ 80 (Kritisch)</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{shortages.filter(s => s.bwl).length}</Text>
            <Text style={s.statLabel}>Davon BWL-Pflichtlager</Text>
          </View>
        </View>

        {/* Table */}
        <Text style={[s.sectionTitle, { marginTop: 4 }]}>Top-10 Engpässe nach Engpass-Score</Text>

        {/* Table Header */}
        <View style={s.tableHeader}>
          <Text style={[s.colRank, s.headerText]}>#</Text>
          <Text style={[s.colScore, s.headerText]}>Score</Text>
          <Text style={[s.colName, s.headerText]}>Präparat</Text>
          <Text style={[s.colFirma, s.headerText]}>Firma</Text>
          <Text style={[s.colAtc, s.headerText]}>ATC</Text>
          <Text style={[s.colDays, s.headerText]}>Tage</Text>
        </View>

        {shortages.map((item, i) => (
          <View key={item.gtin} style={s.tableRow}>
            <Text style={s.colRank}>{i + 1}</Text>
            <Text style={[s.colScore, { color: scoreColor(item.score) }]}>
              {item.score} — {item.scoreLabel}
            </Text>
            <Text style={[s.colName, { color: C.text }]}>{item.bezeichnung}</Text>
            <Text style={s.colFirma}>{item.firma}</Text>
            <Text style={s.colAtc}>{item.atcCode}</Text>
            <Text style={s.colDays}>{item.tageSeitMeldung}</Text>
          </View>
        ))}

        {/* Methodology note */}
        <View style={{ marginTop: 20, backgroundColor: C.bg, borderRadius: 6, padding: 12 }}>
          <Text style={{ fontSize: 8, color: C.muted, lineHeight: 1.5 }}>
            <Text style={{ fontWeight: 'bold' }}>Score-Methodik:</Text>
            {' '}Der Engpass-Score (0–100) kombiniert vier Faktoren: Transparenz der Herstellerkommunikation (0–35 Pkt.), Engpass-Dauer (0–30 Pkt.), fehlende Alternativen (0–20 Pkt.) und BWL-Pflichtlagerstatus (0–15 Pkt.). Höhere Werte = kritischerer Engpass.
          </Text>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Quelle: drugshortage.ch · BWL · ODDB — verarbeitet durch engpass.radar
          </Text>
          <Text style={s.footerText}>engpassradar.ch — exklusiv für Klinik-System-Abonnenten</Text>
        </View>

      </Page>
    </Document>
  )
}
