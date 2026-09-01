'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { Sheet, SheetContent } from '@repo/ui/sheet'
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
      <SheetContent minWidth={600} className="flex flex-col">
        <ControlReviewSheetBody key={reviewId} controlId={controlId} reviewId={reviewId} onClose={close} />
      </SheetContent>
    </Sheet>
  )
}

export default ControlReviewSheet
