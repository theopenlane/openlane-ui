import { type UpdateEntityInput, VendorRiskScoreVendorRiskImpact, VendorRiskScoreVendorRiskLikelihood } from '@repo/codegen/src/schema'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { type TSeverityLevel } from '@/utils/severity'
import { isOneOf } from '@/utils/type-guards'
import { VendorRiskRating, type TVendorRiskRating, type TVendorRiskThreshold } from '@repo/codegen/src/vendor-scoring-defaults.generated'

export { VendorRiskRating, type TVendorRiskRating, type TVendorRiskThreshold }

export const sortRiskThresholds = (thresholds: readonly TVendorRiskThreshold[]): TVendorRiskThreshold[] => [...thresholds].sort((a, b) => a.maxScore - b.maxScore)

export const riskRatingBands = (thresholds: readonly TVendorRiskThreshold[]): { rating: TVendorRiskRating; bound: string }[] => {
  const sorted = sortRiskThresholds(thresholds)
  const highest = sorted[sorted.length - 1]
  const belowHighest = sorted[sorted.length - 2]
  return sorted.map(({ rating, maxScore }) => ({ rating, bound: rating === highest.rating && belowHighest ? `>${belowHighest.maxScore}` : `≤${maxScore}` }))
}

export const VENDOR_RISK_RATING_SEVERITY: Record<TVendorRiskRating, TSeverityLevel | 'none'> = {
  NONE: 'none',
  VERY_LOW: 'low',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
}

const VENDOR_RISK_RATING_COLOR_VAR: Record<TVendorRiskRating, string> = {
  NONE: '--color-muted-foreground',
  VERY_LOW: '--color-success',
  LOW: '--color-severity-low',
  MEDIUM: '--color-severity-medium',
  HIGH: '--color-severity-high',
  CRITICAL: '--color-severity-critical',
}

export const vendorRiskRatingColor = (rating: TVendorRiskRating) => `var(${VENDOR_RISK_RATING_COLOR_VAR[rating]})`

export const vendorRiskRatingLevel = (rating: string): TSeverityLevel | 'none' | undefined => (isVendorRiskRating(rating) ? VENDOR_RISK_RATING_SEVERITY[rating] : undefined)

const VENDOR_RISK_IMPACT_SEVERITY: Record<VendorRiskScoreVendorRiskImpact, TSeverityLevel> = {
  [VendorRiskScoreVendorRiskImpact.VERY_LOW]: 'low',
  [VendorRiskScoreVendorRiskImpact.LOW]: 'low',
  [VendorRiskScoreVendorRiskImpact.MEDIUM]: 'medium',
  [VendorRiskScoreVendorRiskImpact.HIGH]: 'high',
  [VendorRiskScoreVendorRiskImpact.CRITICAL]: 'critical',
}

const VENDOR_RISK_LIKELIHOOD_SEVERITY: Record<VendorRiskScoreVendorRiskLikelihood, TSeverityLevel> = {
  [VendorRiskScoreVendorRiskLikelihood.VERY_LOW]: 'low',
  [VendorRiskScoreVendorRiskLikelihood.LOW]: 'low',
  [VendorRiskScoreVendorRiskLikelihood.MEDIUM]: 'medium',
  [VendorRiskScoreVendorRiskLikelihood.HIGH]: 'high',
  [VendorRiskScoreVendorRiskLikelihood.VERY_HIGH]: 'critical',
}

export const vendorRiskImpactLevel = (impact: VendorRiskScoreVendorRiskImpact): TSeverityLevel | undefined => VENDOR_RISK_IMPACT_SEVERITY[impact]

export const vendorRiskLikelihoodLevel = (likelihood: VendorRiskScoreVendorRiskLikelihood): TSeverityLevel | undefined => VENDOR_RISK_LIKELIHOOD_SEVERITY[likelihood]

export const VENDOR_RISK_RATING_OPTIONS = enumToOptions(VendorRiskRating)

export const riskRatingFromScore = (riskScore: number | string | null | undefined, thresholds: readonly TVendorRiskThreshold[]): TVendorRiskRating | undefined => {
  if (riskScore === null || riskScore === undefined || riskScore === '') {
    return undefined
  }

  const score = Number(riskScore)
  if (Number.isNaN(score)) {
    return undefined
  }

  const sorted = sortRiskThresholds(thresholds)
  return sorted.find((threshold) => score <= threshold.maxScore)?.rating ?? sorted[sorted.length - 1]?.rating
}

export const isVendorRiskRating = isOneOf(Object.values(VendorRiskRating))

const parseRiskScore = (riskScore: number | string | null | undefined): number | null => {
  if (riskScore === null || riskScore === undefined || riskScore === '') return null
  const score = Number(riskScore)
  return Number.isFinite(score) ? score : null
}

export const vendorRiskScoreInput = (value: number | string | null | undefined): UpdateEntityInput => {
  const riskScore = parseRiskScore(value)
  return riskScore === null ? { clearRiskScore: true } : { riskScore }
}

export const withRiskRating = (input: UpdateEntityInput, thresholds: readonly TVendorRiskThreshold[]): UpdateEntityInput => {
  if (input.clearRiskScore) return { ...input, clearRiskRating: true }
  const riskRating = riskRatingFromScore(input.riskScore, thresholds)
  return riskRating ? { ...input, riskRating } : input
}
