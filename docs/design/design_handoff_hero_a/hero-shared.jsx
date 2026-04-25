// Shared brand primitives for engpass.radar hero variants.
// Colors, fonts, tiny UI bits that every variant reuses.

const ER_COLORS = {
  bg:         'oklch(1 0 0)',
  bgAlt:      'oklch(0.985 0.002 240)',
  bgInverse:  'oklch(0.18 0.01 240)',
  fg:         'oklch(0.18 0.01 240)',
  fgOnDark:   'oklch(0.97 0.005 240)',
  muted:      'oklch(0.45 0.01 240)',
  muted2:     'oklch(0.65 0.01 240)',
  border:     'oklch(0.91 0.005 240)',
  border2:    'oklch(0.84 0.005 240)',
  primary:    'oklch(0.52 0.09 200)',
  primarySoft:'oklch(0.52 0.09 200 / 0.10)',
  primaryInk: 'oklch(0.38 0.07 200)',
  destructive:'oklch(0.58 0.21 27)',
  warning:    'oklch(0.72 0.15 75)',
  success:    'oklch(0.58 0.13 150)',
};

const ER_FONTS = {
  sans: '"Inter", system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

// Inject Inter + JetBrains Mono + tiny reset once.
if (typeof document !== 'undefined' && !document.getElementById('er-fonts')) {
  const pre1 = document.createElement('link');
  pre1.rel = 'preconnect'; pre1.href = 'https://fonts.googleapis.com';
  const pre2 = document.createElement('link');
  pre2.rel = 'preconnect'; pre2.href = 'https://fonts.gstatic.com'; pre2.crossOrigin = 'anonymous';
  const l = document.createElement('link');
  l.id = 'er-fonts';
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap';
  document.head.append(pre1, pre2, l);

  const s = document.createElement('style');
  s.id = 'er-reset';
  s.textContent = `
    .er-root *, .er-root *::before, .er-root *::after { box-sizing: border-box; }
    .er-root { font-family: ${ER_FONTS.sans}; color: ${ER_COLORS.fg};
      -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
      font-feature-settings: "cv11","ss01"; }
    .er-mono { font-family: ${ER_FONTS.mono}; font-feature-settings: "tnum"; }
    .er-num  { font-variant-numeric: tabular-nums; }
  `;
  document.head.appendChild(s);
}

// ───────────────────────────────────────────────────────────
// Shared: brand header (used inside every hero artboard)
// Matches real site structure post Header-Nav decision (item 02 in the
// content concept). Keeps each variant self-contained so they can be
// compared side by side.
// ───────────────────────────────────────────────────────────
function ERHeader({ onDark = false, accentNav = null }) {
  const fg   = onDark ? ER_COLORS.fgOnDark : ER_COLORS.fg;
  const mut  = onDark ? 'oklch(0.75 0.01 240)' : ER_COLORS.muted;
  const brd  = onDark ? 'oklch(1 0 0 / 0.08)' : ER_COLORS.border;
  const navItems = ['Dashboard', 'Methodik', 'API', 'Bericht', 'FAQ'];
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 56px', borderBottom: `1px solid ${brd}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>
          <span style={{ color: fg }}>engpass</span>
          <span style={{ color: ER_COLORS.primary }}>.radar</span>
        </div>
        <nav style={{ display: 'flex', gap: 28, fontSize: 13.5, color: mut }}>
          {navItems.map((n, i) => (
            <span key={n} style={{
              color: (accentNav != null ? i === accentNav : i === 0) ? fg : mut,
              fontWeight: (accentNav != null ? i === accentNav : i === 0) ? 500 : 400,
              cursor: 'pointer',
            }}>{n}</span>
          ))}
        </nav>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span className="er-mono" style={{ fontSize: 11.5, color: mut, letterSpacing: '0.02em' }}>
          {new Date().toLocaleDateString('de-CH', { day: '2-digit', month: 'short', year: 'numeric' })} · 06:12
        </span>
        <button style={{
          border: `1px solid ${brd}`, background: 'transparent', color: fg,
          fontFamily: 'inherit', fontSize: 13, padding: '7px 14px',
          borderRadius: 6, cursor: 'pointer', fontWeight: 500,
        }}>Newsletter</button>
      </div>
    </header>
  );
}

// Tiny pulse dot ( source-live indicator )
function ERPulse({ color = ER_COLORS.success, size = 7 }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: size, height: size }}>
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%', background: color,
      }}/>
      <span style={{
        position: 'absolute', inset: -3, borderRadius: '50%', background: color,
        opacity: 0.25, animation: 'er-pulse 2s ease-out infinite',
      }}/>
      <style>{`@keyframes er-pulse{0%{transform:scale(0.8);opacity:.5}80%,100%{transform:scale(2.2);opacity:0}}`}</style>
    </span>
  );
}

Object.assign(window, { ER_COLORS, ER_FONTS, ERHeader, ERPulse });
