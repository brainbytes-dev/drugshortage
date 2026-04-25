// Shared bits for the 4 deep pages: Medikament, Wirkstoff, Firma, 404.
// Reuses ER_COLORS/ER_FONTS from hero-shared.jsx and the SiteHeader
// vocabulary (we redeclare a richer header here with the real route set).

const PC = window.ER_COLORS || {
  bg:'#fff', bgAlt:'oklch(0.985 0.002 240)', bgInverse:'oklch(0.18 0.01 240)',
  fg:'oklch(0.18 0.01 240)', fgOnDark:'oklch(0.97 0.005 240)',
  muted:'oklch(0.45 0.01 240)', muted2:'oklch(0.65 0.01 240)',
  border:'oklch(0.91 0.005 240)', border2:'oklch(0.84 0.005 240)',
  primary:'oklch(0.52 0.09 200)', primarySoft:'oklch(0.52 0.09 200 / 0.10)',
  primaryInk:'oklch(0.38 0.07 200)',
  destructive:'oklch(0.58 0.21 27)', warning:'oklch(0.72 0.15 75)', success:'oklch(0.58 0.13 150)',
};
const PF = window.ER_FONTS || {
  sans:'"Inter",system-ui,sans-serif', mono:'"JetBrains Mono",ui-monospace,monospace',
};

// ─── Real-route header (matches src/app folder structure) ────────────
function PageHeader({ active = 'medikament' }) {
  const items = [
    { k: 'dashboard', l: 'Dashboard' },
    { k: 'wirkstoff', l: 'Wirkstoffe' },
    { k: 'firma',     l: 'Firmen' },
    { k: 'methodik',  l: 'Methodik' },
    { k: 'api',       l: 'API' },
    { k: 'blog',      l: 'Bericht' },
  ];
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 48px', borderBottom: `1px solid ${PC.border}`,
      background: PC.bg,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>
          <span style={{ color: PC.fg }}>engpass</span>
          <span style={{ color: PC.primary }}>.radar</span>
        </div>
        <nav style={{ display: 'flex', gap: 26, fontSize: 13.5, color: PC.muted }}>
          {items.map((n) => (
            <span key={n.k} style={{
              color: n.k === active ? PC.fg : PC.muted,
              fontWeight: n.k === active ? 500 : 400,
            }}>{n.l}</span>
          ))}
        </nav>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          fontFamily: PF.mono, fontSize: 11.5, color: PC.muted,
          letterSpacing: '0.04em',
        }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 999,
            background: PC.success, marginRight: 8, transform: 'translateY(-1px)' }} />
          Daten-Stand 25. Apr · 03:14
        </div>
        <div style={{
          padding: '8px 14px', fontSize: 13, fontWeight: 500,
          background: PC.fg, color: PC.fgOnDark,
        }}>
          Watchlist
        </div>
      </div>
    </header>
  );
}

// ─── Breadcrumb ──────────────────────────────────────────────────────
function PageCrumbs({ items }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '20px 48px 0',
      fontFamily: PF.mono, fontSize: 11.5, color: PC.muted2,
      letterSpacing: '0.04em',
    }}>
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color: PC.muted2 }}>/</span>}
          <span style={{
            color: i === items.length - 1 ? PC.fg : PC.muted2,
          }}>{it}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────
function PageFooter() {
  const cols = [
    ['Produkt', ['Dashboard', 'Wirkstoffe', 'Firmen', 'Watchlist', 'CSV-Export']],
    ['Daten',   ['Methodik', 'Quellen', 'API & Docs', 'RSS-Feed', 'Score-System']],
    ['Über',    ['Bericht', 'GitHub', 'Datenschutz', 'Impressum', 'Kontakt']],
  ];
  return (
    <footer style={{
      borderTop: `1px solid ${PC.border}`, padding: '40px 48px 32px',
      background: PC.bgAlt,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 1fr', gap: 48 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>
            <span style={{ color: PC.fg }}>engpass</span>
            <span style={{ color: PC.primary }}>.radar</span>
          </div>
          <div style={{ fontSize: 13, color: PC.muted, marginTop: 10, lineHeight: 1.5, maxWidth: 320 }}>
            Lieferengpässe für Schweizer Apotheken — täglich, transparent, offen.
          </div>
          <div style={{
            marginTop: 16, fontFamily: PF.mono, fontSize: 11,
            color: PC.muted2, letterSpacing: '0.06em',
          }}>
            HM CONSULTING RÜHE · AARAU · 2026
          </div>
        </div>
        {cols.map(([t, list]) => (
          <div key={t}>
            <div style={{
              fontFamily: PF.mono, fontSize: 11,
              color: PC.muted, letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>{t}</div>
            <ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none' }}>
              {list.map((l) => (
                <li key={l} style={{ fontSize: 13.5, color: PC.fg, padding: '5px 0' }}>{l}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}

// ─── Status pill ─────────────────────────────────────────────────────
function StatusPill({ code, big = false }) {
  const map = {
    1: { l: 'Direkt gemeldet',  c: PC.success,    soft: 'oklch(0.58 0.13 150 / 0.10)' },
    2: { l: 'Gemeldet',         c: 'oklch(0.65 0.14 130)', soft: 'oklch(0.65 0.14 130 / 0.10)' },
    3: { l: 'Sporadisch',       c: PC.warning,    soft: 'oklch(0.72 0.15 75 / 0.12)' },
    4: { l: 'Keine Information',c: PC.destructive,soft: 'oklch(0.58 0.21 27 / 0.10)' },
    5: { l: 'In Verhandlung',   c: 'oklch(0.65 0.16 60)',  soft: 'oklch(0.65 0.16 60 / 0.12)' },
  };
  const s = map[code] || map[4];
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: big ? '8px 14px' : '4px 10px',
      background: s.soft, color: s.c,
      fontSize: big ? 14 : 12, fontWeight: 500,
      letterSpacing: '-0.005em',
      border: `1px solid ${s.c}`,
    }}>
      <span style={{
        width: big ? 8 : 6, height: big ? 8 : 6, background: s.c,
        borderRadius: 999,
      }} />
      <span style={{ fontFamily: PF.mono, fontSize: big ? 11 : 10, opacity: 0.8 }}>
        STATUS {code}
      </span>
      <span>·</span>
      <span>{s.l}</span>
    </div>
  );
}

// ─── Score badge ─────────────────────────────────────────────────────
function ScoreBadge({ score }) {
  const color =
    score >= 75 ? PC.destructive :
    score >= 50 ? PC.warning :
    score >= 25 ? 'oklch(0.65 0.14 130)' : PC.success;
  const label =
    score >= 75 ? 'Kritisch' :
    score >= 50 ? 'Hoch' :
    score >= 25 ? 'Mittel' : 'Niedrig';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'baseline', gap: 8,
      fontFamily: PF.mono, fontVariantNumeric: 'tabular-nums',
    }}>
      <span style={{ fontSize: 13, color: PC.muted, letterSpacing: '0.04em' }}>SCORE</span>
      <span style={{ fontSize: 22, fontWeight: 600, color }}>{score}</span>
      <span style={{ fontSize: 11, color, opacity: 0.7 }}>· {label}</span>
    </div>
  );
}

// ─── Eyebrow ─────────────────────────────────────────────────────────
function PageEyebrow({ children }) {
  return (
    <div style={{
      fontFamily: PF.mono, fontSize: 11,
      color: PC.muted, letterSpacing: '0.08em', textTransform: 'uppercase',
    }}>{children}</div>
  );
}

// ─── Page shell ──────────────────────────────────────────────────────
function PageShell({ active, crumbs, children }) {
  return (
    <div className="er-root" style={{
      width: '100%', background: PC.bg, color: PC.fg,
      fontFamily: PF.sans,
    }}>
      <PageHeader active={active} />
      {crumbs && <PageCrumbs items={crumbs} />}
      {children}
      <PageFooter />
    </div>
  );
}

Object.assign(window, {
  PC, PF, PageHeader, PageCrumbs, PageFooter,
  StatusPill, ScoreBadge, PageEyebrow, PageShell,
});
