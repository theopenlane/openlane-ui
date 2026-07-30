'use client'

import React from 'react'
import { Button } from '@repo/ui/button'
import { ReviewReviewStatus } from '@repo/codegen/src/schema'

type TReviewSheetFooterProps = {
  pendingAction: ReviewReviewStatus | null
  onCancel: () => void
  onSubmit: (status: ReviewReviewStatus) => void
  submitLabel: string
}

const ReviewSheetFooter: React.FC<TReviewSheetFooterProps> = ({ pendingAction, onCancel, onSubmit, submitLabel }) => (
  <div className="mt-auto flex items-center justify-end gap-2 border-t pt-4">
    <Button type="button" variant="secondary" onClick={onCancel} disabled={pendingAction !== null}>
      Cancel
    </Button>
    <Button type="button" variant="secondary" onClick={() => onSubmit(ReviewReviewStatus.IN_PROGRESS)} loading={pendingAction === ReviewReviewStatus.IN_PROGRESS} disabled={pendingAction !== null}>
      Save Draft
    </Button>
    <Button type="button" onClick={() => onSubmit(ReviewReviewStatus.COMPLETED)} loading={pendingAction === ReviewReviewStatus.COMPLETED} disabled={pendingAction !== null}>
      {submitLabel}
    </Button>
  </div>
)

export default ReviewSheetFooter
