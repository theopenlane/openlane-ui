import { type UpdateEntityInput, VendorRiskScoreVendorRiskImpact, VendorRiskScoreVendorRiskLikelihood } from '@repo/codegen/src/schema'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { type TSeverityLevel } from '@/utils/severity'

export const VendorRiskRating = {
  NONE: 'NONE',
  VERY_LOW: 'VERY_LOW',
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const

export type TVendorRiskRating = (typeof VendorRiskRating)[keyof typeof VendorRiskRating]

const RISK_RATING_THRESHOLDS: { rating: TVendorRiskRating; maxScore: number }[] = [
  { rating: VendorRiskRating.NONE, maxScore: 0 },
  { rating: VendorRiskRating.VERY_LOW, maxScore: 3 },
  { rating: VendorRiskRating.LOW, maxScore: 5 },
  { rating: VendorRiskRating.MEDIUM, maxScore: 11 },
  { rating: VendorRiskRating.HIGH, maxScore: 15 },
]

const highestThreshold = RISK_RATING_THRESHOLDS[RISK_RATING_THRESHOLDS.length - 1]

export const RISK_RATING_BANDS: { rating: TVendorRiskRating; bound: string }[] = [
  ...RISK_RATING_THRESHOLDS.map(({ rating, maxScore }) => ({ rating, bound: `≤${maxScore}` })),
  { rating: VendorRiskRating.CRITICAL, bound: `>${highestThreshold.maxScore}` },
]

export const VENDOR_RISK_RATING_SEVERITY: Record<TVendorRiskRating, TSeverityLevel | 'none'> = {
  NONE: 'none',
  VERY_LOW: 'low',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
}

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

export const riskRatingFromScore = (riskScore: number | string | null | undefined): TVendorRiskRating | undefined => {
  if (riskScore === null || riskScore === undefined || riskScore === '') {
    return undefined
  }

  const score = Number(riskScore)
  if (Number.isNaN(score)) {
    return undefined
  }

  return RISK_RATING_THRESHOLDS.find((threshold) => score <= threshold.maxScore)?.rating ?? VendorRiskRating.CRITICAL
}

export const isVendorRiskRating = (value: string): value is TVendorRiskRating => (Object.values(VendorRiskRating) as string[]).includes(value)

const parseRiskScore = (riskScore: number | string | null | undefined): number | null => {
  if (riskScore === null || riskScore === undefined || riskScore === '') return null
  const score = Number(riskScore)
  return Number.isFinite(score) ? score : null
}

export const vendorRiskScoreInput = (value: number | string | null | undefined): UpdateEntityInput => {
  const riskScore = parseRiskScore(value)
  const riskRating = riskRatingFromScore(riskScore)
  return {
    ...(riskScore === null ? { clearRiskScore: true } : { riskScore }),
    ...(riskRating ? { riskRating } : { clearRiskRating: true }),
  }
}
