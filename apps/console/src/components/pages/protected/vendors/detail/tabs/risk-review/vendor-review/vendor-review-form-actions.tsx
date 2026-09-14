'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { SaveButton } from '@/components/shared/save-button/save-button'

export type TVendorReviewAction = 'draft' | 'save' | 'complete' | 'completeAndApprove' | 'approve'

type TVendorReviewFormActionsProps = {
  pendingAction: TVendorReviewAction | null
  isCreate: boolean
  isCompleted: boolean
  isApproved: boolean
  onCancel?: () => void
  onSubmit: (action: TVendorReviewAction) => void
}

const VendorReviewFormActions: React.FC<TVendorReviewFormActionsProps> = ({ pendingAction, isCreate, isCompleted, isApproved, onCancel, onSubmit }) => {
  const isBusy = pendingAction !== null

  return (
    <>
      {onCancel && <CancelButton onClick={onCancel} disabled={isBusy} />}

      {isCreate ? (
        <>
          <SaveButton type="button" variant="secondary" onClick={() => onSubmit('draft')} loading={pendingAction === 'draft'} disabled={isBusy} title="Save as Draft" />
          <Button type="button" onClick={() => onSubmit('complete')} loading={pendingAction === 'complete'} disabled={isBusy}>
            Complete
          </Button>
          <Button
            type="button"
            variant="approve"
            icon={<Check size={16} />}
            iconPosition="left"
            onClick={() => onSubmit('completeAndApprove')}
            loading={pendingAction === 'completeAndApprove'}
            disabled={isBusy}
          >
            Complete and Approve
          </Button>
        </>
      ) : (
        <>
          {!isCompleted && (
            <Button type="button" variant="secondary" onClick={() => onSubmit('complete')} loading={pendingAction === 'complete'} disabled={isBusy}>
              Complete
            </Button>
          )}
          <SaveButton type="button" onClick={() => onSubmit('save')} loading={pendingAction === 'save'} disabled={isBusy} title="Save Changes" />
          {!isApproved &&
            (isCompleted ? (
              <Button type="button" variant="approve" icon={<Check size={16} />} iconPosition="left" onClick={() => onSubmit('approve')} loading={pendingAction === 'approve'} disabled={isBusy}>
                Approve
              </Button>
            ) : (
              <Button
                type="button"
                variant="approve"
                icon={<Check size={16} />}
                iconPosition="left"
                onClick={() => onSubmit('completeAndApprove')}
                loading={pendingAction === 'completeAndApprove'}
                disabled={isBusy}
              >
                Complete and Approve
              </Button>
            ))}
        </>
      )}
    </>
  )
}

export default VendorReviewFormActions
