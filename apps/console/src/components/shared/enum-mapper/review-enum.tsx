import type React from 'react'
import { ReviewReviewStatus } from '@repo/codegen/src/schema'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import { CommonStatusIconLabel, CommonStatusIcons } from '@/components/shared/enum-mapper/common-status-enum'

export const ReviewStatusOptions = enumToOptions(ReviewReviewStatus)

export const ReviewStatusIconMapper: Record<ReviewReviewStatus, React.ReactNode> = CommonStatusIcons

export const ReviewStatusIconLabel = CommonStatusIconLabel
