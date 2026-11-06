import type { ConvertParams, JobStage, OutputFormat, QaMetrics } from '../types'
import { CALC_BASE_1080, CALC_BASE_4K, CALC_BASE_8K, FORMAT_FACTOR, RUSH_RATE, TAX_RATE } from './constants'

export function weightedProgress(stages: JobStage[]): number {
  const total = stages.reduce((s, st) => s + st.weight, 0)
  const done = stages.reduce((s, st) => s + (st.weight * st.progress) / 100, 0)
  return Math.round((done / total) * 100)
}

export function resolutionTier(width: number): '8K' | '4K' | '1080p' {
  if (width >= 7000) return '8K'
  if (width >= 3000) return '4K'
  return '1080p'
}

export function unitPrice(width: number): number {
  const tier = resolutionTier(width)
  if (tier === '8K') return 360
  if (tier === '4K') return 120
  return 80
}

export function baseFactor(width: number): number {
  const tier = resolutionTier(width)
  if (tier === '8K') return CALC_BASE_8K
  if (tier === '4K') return CALC_BASE_4K
  return CALC_BASE_1080
}

/** 预估处理耗时（秒） */
export function estimateSeconds(durationSec: number, width: number, format: OutputFormat, rush: boolean, nodes = 1) {
  const f = baseFactor(width) * FORMAT_FACTOR[format] * (rush ? 0.55 : 1)
  return Math.round((durationSec * f) / nodes + (rush ? 240 : 1800))
}

export function jobCost(billedMinutes: number, width: number, rush: boolean) {
  const unit = unitPrice(width)
  return Math.round(billedMinutes * unit * (rush ? RUSH_RATE : 1))
}

export function orderTotals(items: { minutes: number; unitPriceCNY: number }[], rush: boolean, discount: number) {
  const subtotal = items.reduce((s, i) => s + i.minutes * i.unitPriceCNY, 0)
  const rushFee = rush ? subtotal * (RUSH_RATE - 1) : 0
  const taxable = subtotal + rushFee - discount
  const tax = taxable * TAX_RATE
  return { subtotal, rushFee, tax, total: taxable + tax }
}

export function comfortLevel(score: number): { label: string; tone: 'success' | 'warning' | 'danger' } {
  if (score >= 85) return { label: '优', tone: 'success' }
  if (score >= 75) return { label: '良', tone: 'warning' }
  return { label: '需修正', tone: 'danger' }
}

export function jitterLevel(v: number) {
  return v <= 0.12 ? 'success' : v <= 0.18 ? 'warning' : 'danger'
}

export function artifactLevel(v: number) {
  return v <= 2 ? 'success' : v <= 3.5 ? 'warning' : 'danger'
}

export function defaultParams(): ConvertParams {
  return {
    depthModel: 'SpaceScape-Depth V3',
    disparity: 45,
    convergence: 0,
    temporalSmooth: 70,
    edgePreserve: 60,
    depthDetail: 55,
    faceProtect: true,
    deflicker: true,
  }
}

export function averageMetrics(list: QaMetrics[]) {
  if (!list.length) return null
  const sum = list.reduce(
    (a, m) => ({
      comfortScore: a.comfortScore + m.comfortScore,
      temporalJitter: a.temporalJitter + m.temporalJitter,
      edgeArtifactRate: a.edgeArtifactRate + m.edgeArtifactRate,
      maxPositiveDisparity: a.maxPositiveDisparity + m.maxPositiveDisparity,
      maxNegativeDisparity: a.maxNegativeDisparity + m.maxNegativeDisparity,
      windowViolationFrames: a.windowViolationFrames + m.windowViolationFrames,
      depthConfidence: a.depthConfidence + m.depthConfidence,
    }),
    {
      comfortScore: 0,
      temporalJitter: 0,
      edgeArtifactRate: 0,
      maxPositiveDisparity: 0,
      maxNegativeDisparity: 0,
      windowViolationFrames: 0,
      depthConfidence: 0,
    },
  )
  const n = list.length
  return {
    comfortScore: sum.comfortScore / n,
    temporalJitter: sum.temporalJitter / n,
    edgeArtifactRate: sum.edgeArtifactRate / n,
    maxPositiveDisparity: sum.maxPositiveDisparity / n,
    maxNegativeDisparity: sum.maxNegativeDisparity / n,
    windowViolationFrames: sum.windowViolationFrames / n,
    depthConfidence: sum.depthConfidence / n,
  }
}
