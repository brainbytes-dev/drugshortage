// Design primitives matching the engpass.radar Deep Pages design system.
// Square corners, mono labels, OKLCH colors.

const MONO = 'var(--font-mono, "JetBrains Mono", ui-monospace, monospace)'

const STATUS_MAP: Record<number, { label: string; color: string; soft: string }> = {
  1: { label: 'Direkt gemeldet',  color: 'oklch(0.58 0.13 150)', soft: 'oklch(0.58 0.13 150 / 0.10)' },
  2: { label: 'Gemeldet',         color: 'oklch(0.65 0.14 130)', soft: 'oklch(0.65 0.14 130 / 0.10)' },
  3: { label: 'Sporadisch',       color: 'oklch(0.72 0.15 75)',  soft: 'oklch(0.72 0.15 75 / 0.12)' },
  4: { label: 'Keine Information',color: 'oklch(0.58 0.21 27)',  soft: 'oklch(0.58 0.21 27 / 0.10)' },
  5: { label: 'In Verhandlung',   color: 'oklch(0.65 0.16 60)',  soft: 'oklch(0.65 0.16 60 / 0.12)' },
}

export function statusColor(code: number): string {
  return STATUS_MAP[code]?.color ?? STATUS_MAP[4].color
}

export function erScoreColor(score: number): string {
  if (score >= 75) return 'oklch(0.58 0.21 27)'
  if (score >= 50) return 'oklch(0.72 0.15 75)'
  if (score >= 25) return 'oklch(0.65 0.14 130)'
  return 'oklch(0.58 0.13 150)'
}

export function StatusPill({ code, big = false }: { code: number; big?: boolean }) {
  const s = STATUS_MAP[code] ?? STATUS_MAP[4]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: big ? '8px 14px' : '4px 10px',
      background: s.soft, color: s.color,
      fontSize: big ? 14 : 12, fontWeight: 500,
      border: `1px solid ${s.color}`,
    }}>
      <span style={{ width: big ? 8 : 6, height: big ? 8 : 6, background: s.color, borderRadius: 999, flexShrink: 0 }} />
      <span style={{ fontFamily: MONO, fontSize: big ? 11 : 10, opacity: 0.8 }}>STATUS {code}</span>
      <span>·</span>
      <span>{s.label}</span>
    </span>
  )
}

export function ErEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: MONO, fontSize: 11, color: 'oklch(0.45 0.01 240)', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>
      {children}
    </div>
  )
}

export function ErCrumbs({ items }: { items: string[] }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      fontFamily: MONO, fontSize: 11.5,
      color: 'oklch(0.65 0.01 240)', letterSpacing: '0.04em',
      marginBottom: 32,
    }}>
      {items.map((it, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {i > 0 && <span style={{ opacity: 0.4 }}>/</span>}
          <span style={{ color: i === items.length - 1 ? 'oklch(0.18 0.01 240)' : 'oklch(0.65 0.01 240)' }}>
            {it}
          </span>
        </span>
      ))}
    </div>
  )
}

export function ErSectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div>
      <ErEyebrow>{eyebrow}</ErEyebrow>
      <h2 style={{ margin: '8px 0 0', fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em' }}>{title}</h2>
      {subtitle && <div style={{ fontSize: 14, color: 'oklch(0.45 0.01 240)', marginTop: 6, lineHeight: 1.55 }}>{subtitle}</div>}
    </div>
  )
}
