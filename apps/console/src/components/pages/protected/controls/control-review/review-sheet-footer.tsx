'use client'

import React from 'react'
import { Button } from '@repo/ui/button'
import { ReviewReviewStatus } from '@repo/codegen/src/schema'
import { SlideoutFormActions } from '@/components/shared/crud-base/slideout-form-actions'

type TReviewSheetFooterProps = {
  pendingAction: ReviewReviewStatus | null
  onCancel: () => void
  onSubmit: (status: ReviewReviewStatus) => void
  submitLabel: string
}

const ReviewSheetFooter: React.FC<TReviewSheetFooterProps> = ({ pendingAction, onCancel, onSubmit, submitLabel }) => (
  <SlideoutFormActions
    onCancel={onCancel}
    onSave={() => onSubmit(ReviewReviewStatus.COMPLETED)}
    isPending={pendingAction !== null}
    saveLabel={submitLabel}
    savingLabel={pendingAction === ReviewReviewStatus.COMPLETED ? 'Saving...' : submitLabel}
    secondaryActions={
      <Button type="button" variant="secondary" onClick={() => onSubmit(ReviewReviewStatus.IN_PROGRESS)} loading={pendingAction === ReviewReviewStatus.IN_PROGRESS} disabled={pendingAction !== null}>
        Save Draft
      </Button>
    }
  />
)

export default ReviewSheetFooter
