import { SITE_URL } from './resend'

// ── Shared wrapper ────────────────────────────────────────────────────────────

function emailWrapper(content: string, footerLinks: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08)">

        <!-- Header -->
        <tr>
          <td style="background:#2d8f8f;padding:24px 32px">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px">engpass.radar</p>
            <p style="margin:5px 0 0;color:rgba(255,255,255,0.75);font-size:12px;letter-spacing:0.05em;text-transform:uppercase">Schweizer Medikamenten-Engpass Dashboard</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;border-top:1px solid #eeeeee;padding:16px 32px">
            <p style="margin:0;color:#9ca3af;font-size:11px;line-height:1.6">
              engpass.radar · Nur für Fachpersonen im Gesundheitswesen ·
              ${footerLinks}
              <a href="${SITE_URL}/datenschutz" style="color:#9ca3af">Datenschutz</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── Button helper ─────────────────────────────────────────────────────────────

function ctaButton(href: string, label: string, color = '#2d8f8f'): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0 8px">
    <tr>
      <td style="background:${color};border-radius:7px">
        <a href="${href}" style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:-0.1px">${label}</a>
      </td>
    </tr>
  </table>`
}

// ── Confirmation email (DOI) ──────────────────────────────────────────────────

export function confirmationEmail(atcCode: string, atcName: string, confirmUrl: string): string {
  const content = `
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#111827;letter-spacing:-0.3px">
      Alert bestätigen
    </h1>
    <p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6">
      Sie haben einen Engpass-Alert für <strong>${atcName}</strong>
      <span style="color:#6b7280;font-size:13px;font-family:monospace">&nbsp;(${atcCode})</span>
      eingerichtet.
    </p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6">
      Bitte bestätigen Sie Ihre Anmeldung. Sie erhalten täglich eine Benachrichtigung,
      sobald sich die Engpass-Lage für diesen Wirkstoff ändert — keine Änderung, keine Mail.
    </p>

    ${ctaButton(confirmUrl, 'Engpass-Alert bestätigen')}

    <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;line-height:1.5">
      Falls Sie diesen Alert nicht angefordert haben, können Sie diese E-Mail ignorieren.
      Der Link läuft nach 7 Tagen ab.
    </p>
  `

  return emailWrapper(
    content,
    '',
  )
}

// ── Alert email ───────────────────────────────────────────────────────────────

interface AlertShortage {
  bezeichnung: string
  firma: string
  statusCode?: number | null
}

export function alertEmail(opts: {
  atcCode: string
  atcName: string
  newShortages: AlertShortage[]
  resolvedShortages: AlertShortage[]
  dashboardUrl: string
  unsubUrl: string
}): string {
  const { atcCode, atcName, newShortages, resolvedShortages, dashboardUrl, unsubUrl } = opts

  const shortageRow = (s: AlertShortage, badge: string, badgeColor: string) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;vertical-align:top">
        <span style="display:inline-block;font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${badgeColor};background:${badgeColor}1a;padding:2px 6px;border-radius:4px;margin-bottom:4px">${badge}</span><br>
        <strong style="font-size:14px;color:#111827">${s.bezeichnung}</strong><br>
        <span style="font-size:12px;color:#6b7280">${s.firma}</span>
      </td>
    </tr>`

  const newRows = newShortages.map(s => shortageRow(s, 'Neuer Engpass', '#dc2626')).join('')
  const resolvedRows = resolvedShortages.map(s => shortageRow(s, 'Aufgelöst', '#16a34a')).join('')

  const content = `
    <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#2d8f8f">Engpass-Alert</p>
    <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111827;letter-spacing:-0.3px">
      ${atcName} <span style="color:#9ca3af;font-size:14px;font-weight:400;font-family:monospace">${atcCode}</span>
    </h1>

    <table width="100%" cellpadding="0" cellspacing="0">
      ${newRows}
      ${resolvedRows}
    </table>

    ${ctaButton(dashboardUrl, `Alle ${atcName}-Engpässe ansehen`)}
  `

  const footerLinks = `<a href="${unsubUrl}" style="color:#9ca3af">Abmelden</a> · `

  return emailWrapper(content, footerLinks)
}

// ── Subject line helper ───────────────────────────────────────────────────────

export function alertSubject(atcName: string, newCount: number, resolvedCount: number): string {
  const parts: string[] = []
  if (newCount > 0) parts.push(`${newCount} neu`)
  if (resolvedCount > 0) parts.push(`${resolvedCount} aufgelöst`)
  return `Engpass-Alert ${atcName}: ${parts.join(', ')}`
}
