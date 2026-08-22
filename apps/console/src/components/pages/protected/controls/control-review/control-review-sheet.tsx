'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { Sheet } from '@repo/ui/sheet'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import ControlReviewSheetBody from './control-review-sheet-body'

type TControlReviewSheetProps = {
  controlId: string
  queryParamKey?: string
  reviewId?: string | null
  onClose?: () => void
}

const ControlReviewSheet: React.FC<TControlReviewSheetProps> = ({ controlId, queryParamKey = 'reviewId', reviewId: reviewIdProp, onClose: onCloseProp }) => {
  const searchParams = useSearchParams()
  const { replace } = useSmartRouter()
  const reviewId = reviewIdProp !== undefined ? reviewIdProp : searchParams.get(queryParamKey)

  const close = () => {
    if (onCloseProp) {
      onCloseProp()
      return
    }
    replace({ [queryParamKey]: null })
  }

  return (
    <Sheet open={!!reviewId} onOpenChange={(next) => (next ? undefined : close())}>
      <ControlReviewSheetBody key={reviewId} controlId={controlId} reviewId={reviewId} onClose={close} />
    </Sheet>
  )
}

export default ControlReviewSheet
