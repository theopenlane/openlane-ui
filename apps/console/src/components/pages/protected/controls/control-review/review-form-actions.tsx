'use client'

import React from 'react'
import { ReviewReviewStatus } from '@repo/codegen/src/schema'
import { SlideoutFormActions } from '@/components/shared/crud-base/slideout-form-actions'
import { SaveButton } from '@/components/shared/save-button/save-button'

type TReviewFormActionsProps = {
  pendingAction: ReviewReviewStatus | null
  onCancel: () => void
  onSubmit: (status: ReviewReviewStatus) => void
  submitLabel: string
}

const ReviewFormActions: React.FC<TReviewFormActionsProps> = ({ pendingAction, onCancel, onSubmit, submitLabel }) => (
  <SlideoutFormActions
    onCancel={onCancel}
    onSave={() => onSubmit(ReviewReviewStatus.COMPLETED)}
    isPending={pendingAction !== null}
    saveLabel={submitLabel}
    savingLabel={pendingAction === ReviewReviewStatus.COMPLETED ? 'Saving...' : submitLabel}
    secondaryActions={
      <SaveButton
        type="button"
        variant="secondary"
        onClick={() => onSubmit(ReviewReviewStatus.IN_PROGRESS)}
        loading={pendingAction === ReviewReviewStatus.IN_PROGRESS}
        disabled={pendingAction !== null}
        title="Save Draft"
      />
    }
  />
)

export default ReviewFormActions
