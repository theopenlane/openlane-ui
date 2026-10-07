import { EntityFrequency, type EntityQuery, type UpdateEntityInput, type UpdateReviewInput } from '@repo/codegen/src/schema'
import { omit, orClear, type TFieldMappers, passthrough } from '@/hooks/useDirtyInput'
import { plateToHtmlOrNull } from '@/components/shared/plate/plate-utils'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { type ReviewsNodeNonNull } from '@/lib/graphql-hooks/review'
import { vendorRiskScoreInput } from '@/lib/vendor-risk-rating'
import { type VendorReviewFormData } from './use-vendor-review-form-schema'

type TVendor = EntityQuery['entity']

export const buildVendorReviewTitle = (vendor: TVendor): string => {
  const name = vendor.name?.trim() || vendor.displayName?.trim() || 'Vendor'
  const cadence = vendor.reviewFrequency && vendor.reviewFrequency !== EntityFrequency.NONE ? `${getEnumLabel(vendor.reviewFrequency)} ` : ''

  return `${name} ${cadence}Risk Review`
}

export const buildVendorReviewDefaults = (vendor: TVendor, review?: ReviewsNodeNonNull): VendorReviewFormData => ({
  title: review ? review.title : buildVendorReviewTitle(vendor),
  description: review?.details ?? '',
  tier: vendor.tier ?? undefined,
  riskScore: vendor.riskScore === null || vendor.riskScore === undefined ? '' : String(vendor.riskScore),
})

export const VENDOR_REVIEW_UPDATE_FIELDS = {
  description: async (value, _values, { converter }) => {
    const details = await plateToHtmlOrNull(value, converter)
    return details ? { details } : { clearDetails: true }
  },
  tier: omit,
  riskScore: omit,
  title: passthrough,
} satisfies TFieldMappers<VendorReviewFormData, UpdateReviewInput>

export const VENDOR_RISK_UPDATE_FIELDS = {
  title: omit,
  description: omit,
  tier: orClear('clearTier'),
  riskScore: vendorRiskScoreInput,
} satisfies TFieldMappers<VendorReviewFormData, UpdateEntityInput>
