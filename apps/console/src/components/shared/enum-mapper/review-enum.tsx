import React from 'react'
import { ReviewReviewStatus } from '@repo/codegen/src/schema'
import { TruncatedCell } from '@repo/ui/data-table'
import { enumToOptions, getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { CommonStatusIcons } from '@/components/shared/enum-mapper/common-status-enum'

export const ReviewStatusOptions = enumToOptions(ReviewReviewStatus)

export const ReviewStatusIconMapper: Record<ReviewReviewStatus, React.ReactNode> = CommonStatusIcons

export const ReviewStatusIconLabel = ({ status }: { status?: ReviewReviewStatus | null }) =>
  status ? (
    <div className="flex items-center space-x-2">
      {ReviewStatusIconMapper[status]}
      <TruncatedCell>{getEnumLabel(status)}</TruncatedCell>
    </div>
  ) : (
    <span className="text-muted-foreground">—</span>
  )
