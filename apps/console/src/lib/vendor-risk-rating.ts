import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'

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
