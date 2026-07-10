import { ReviewReviewStatus } from '@repo/codegen/src/schema'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'

export const ReviewStatusOptions = enumToOptions(ReviewReviewStatus)
