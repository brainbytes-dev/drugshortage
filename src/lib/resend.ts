import { Resend } from 'resend'

let _resend: Resend | null = null

export function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

export const FROM_ADDRESS = 'Engpass-Signal <alerts@engpassradar.ch>'
export const SITE_URL = 'https://engpassradar.ch'
