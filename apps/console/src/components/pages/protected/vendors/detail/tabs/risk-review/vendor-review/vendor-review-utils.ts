import { EntityFrequency, type EntityQuery, type UpdateEntityInput } from '@repo/codegen/src/schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { type ReviewsNodeNonNull } from '@/lib/graphql-hooks/review'
import { type VendorReviewFormData } from './use-vendor-review-form-schema'

type TVendor = EntityQuery['entity']

export const buildVendorReviewTitle = (vendor: TVendor): string => {
  const name = vendor.name?.trim() || vendor.displayName?.trim() || 'Vendor'
  const cadence = vendor.reviewFrequency && vendor.reviewFrequency !== EntityFrequency.NONE ? `${getEnumLabel(vendor.reviewFrequency)} ` : ''

  return `${name} ${cadence}risk review`
}

const parseRiskScore = (riskScore: VendorReviewFormData['riskScore']): number | null => (riskScore ? Number(riskScore) : null)

export const buildVendorReviewDefaults = (vendor: TVendor, review?: ReviewsNodeNonNull): VendorReviewFormData => ({
  title: review ? review.title : buildVendorReviewTitle(vendor),
  description: review?.details ?? '',
  tier: vendor.tier ?? undefined,
  riskRating: vendor.riskRating ?? '',
  riskScore: vendor.riskScore === null || vendor.riskScore === undefined ? '' : String(vendor.riskScore),
})

export const buildVendorRiskUpdate = (vendor: TVendor, formData: VendorReviewFormData): UpdateEntityInput | null => {
  const input: UpdateEntityInput = {}

  if (formData.tier && formData.tier !== vendor.tier) {
    input.tier = formData.tier
  }

  const riskRating = formData.riskRating?.trim() ?? ''
  if (riskRating !== (vendor.riskRating ?? '')) {
    if (riskRating) {
      input.riskRating = riskRating
    } else {
      input.clearRiskRating = true
    }
  }

  const riskScore = parseRiskScore(formData.riskScore)
  if (riskScore !== (vendor.riskScore ?? null)) {
    if (riskScore === null) {
      input.clearRiskScore = true
    } else {
      input.riskScore = riskScore
    }
  }

  return Object.keys(input).length > 0 ? input : null
}
