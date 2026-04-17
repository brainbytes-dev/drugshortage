import type { Shortage } from './types'

/**
 * engpass.radar Severity Score (0–100)
 *
 * Proprietary index combining four factors:
 *   1. Transparency (0–35): How well the company communicates — inversely scored.
 *      Code 1 (direct reporting) = 5 pts, Code 4 (silent) = 35 pts, Code 5 (negotiating) = 20 pts
 *   2. Duration   (0–30): How long the shortage has persisted.
 *      ≤14 days = 5, ≤30 = 10, ≤90 = 17, ≤180 = 22, ≤365 = 27, >365 = 30
 *   3. No alternatives (0–20): Whether alternatives exist.
 *      No alternativenUrl = +20, has alternatives = 0
 *   4. Critical supply (0–15): Whether flagged by BWL (Swiss strategic reserve list).
 *      isBwl = +15, otherwise 0
 *
 * Total max = 35 + 30 + 20 + 15 = 100
 */

export interface ScoreBreakdown {
  total: number
  transparency: number   // 0–35
  duration: number       // 0–30
  noAlternatives: number // 0–20
  critical: number       // 0–15
}

export function calculateScore(shortage: Shortage, isBwl: boolean): ScoreBreakdown {
  // 1. Transparency (inverse of cooperation)
  const transparencyMap: Record<number, number> = { 1: 5, 2: 12, 3: 22, 4: 35, 5: 20 }
  const transparency = transparencyMap[shortage.statusCode] ?? 15

  // 2. Duration
  const d = shortage.tageSeitMeldung
  const duration =
    d <= 14  ? 5  :
    d <= 30  ? 10 :
    d <= 90  ? 17 :
    d <= 180 ? 22 :
    d <= 365 ? 27 : 30

  // 3. Alternatives
  const noAlternatives = shortage.alternativenUrl ? 0 : 20

  // 4. Critical supply
  const critical = isBwl ? 15 : 0

  const total = transparency + duration + noAlternatives + critical
  return { total, transparency, duration, noAlternatives, critical }
}

export function scoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Kritisch', color: 'text-red-600 dark:text-red-400' }
  if (score >= 60) return { label: 'Hoch', color: 'text-orange-600 dark:text-orange-400' }
  if (score >= 40) return { label: 'Mittel', color: 'text-yellow-600 dark:text-yellow-400' }
  return { label: 'Niedrig', color: 'text-emerald-600 dark:text-emerald-400' }
}
