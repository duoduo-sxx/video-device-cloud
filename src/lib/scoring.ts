import type { Defect, Grade, Severity } from '../types'
import { SEVERITY_META } from './constants'

export function emptyCounts(): Record<Severity, number> {
  return { fatal: 0, severe: 0, moderate: 0, info: 0 }
}

export function countBySeverity(defects: Defect[]): Record<Severity, number> {
  const counts = emptyCounts()
  for (const d of defects) {
    if (d.status === 'ignored') continue
    counts[d.severity] += 1
  }
  return counts
}

export function computeScore(defects: Defect[]): number {
  const counts = countBySeverity(defects)
  const deduction =
    counts.fatal * SEVERITY_META.fatal.weight +
    counts.severe * SEVERITY_META.severe.weight +
    counts.moderate * SEVERITY_META.moderate.weight +
    counts.info * SEVERITY_META.info.weight
  const raw = 100 - deduction
  return Math.round(Math.max(0, Math.min(100, raw)) * 10) / 10
}

export function gradeOf(score: number, defects: Defect[] = []): Grade {
  const hasFatal = defects.some((d) => d.severity === 'fatal' && d.status !== 'ignored')
  if (score >= 90 && !hasFatal) return 'A'
  if (score >= 75) return hasFatal && score >= 90 ? 'C' : score >= 90 ? 'A' : 'B'
  if (score >= 60) return 'C'
  return 'D'
}

export function gradeOfScore(score: number, hasFatal = false): Grade {
  if (hasFatal) return score >= 60 ? 'C' : 'D'
  if (score >= 90) return 'A'
  if (score >= 75) return 'B'
  if (score >= 60) return 'C'
  return 'D'
}

export function repairRate(fixed: number, total: number): number {
  if (total === 0) return 0
  return Math.round((fixed / total) * 1000) / 1000
}

export function passRate(fixed: number, total: number): string {
  return `${((fixed / Math.max(1, total)) * 100).toFixed(1)}%`
}

/** 复检是否通过：致命/严重残留 0，一般残留 <= 10% */
export function recheckPassed(residual: { severity: Severity }[]): boolean {
  const fatal = residual.filter((d) => d.severity === 'fatal' || d.severity === 'severe').length
  return fatal === 0
}
