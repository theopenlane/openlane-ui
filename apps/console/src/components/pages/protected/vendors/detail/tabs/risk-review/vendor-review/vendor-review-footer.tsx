'use client'

import React from 'react'
import { Check } from 'lucide-react'
import { Button } from '@repo/ui/button'

export type TVendorReviewAction = 'draft' | 'save' | 'complete' | 'completeAndApprove' | 'approve'

const APPROVE_BUTTON_CLASS = 'border-teal-600 text-teal-600'

type TVendorReviewFooterProps = {
  pendingAction: TVendorReviewAction | null
  isCreate: boolean
  isCompleted: boolean
  isApproved: boolean
  onCancel?: () => void
  onSubmit: (action: TVendorReviewAction) => void
}

const VendorReviewFooter: React.FC<TVendorReviewFooterProps> = ({ pendingAction, isCreate, isCompleted, isApproved, onCancel, onSubmit }) => {
  const isBusy = pendingAction !== null

  return (
    <div className="mt-auto flex items-center justify-end gap-2 border-t pt-4">
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel} disabled={isBusy}>
          Cancel
        </Button>
      )}

      {isCreate ? (
        <>
          <Button type="button" variant="secondary" onClick={() => onSubmit('draft')} loading={pendingAction === 'draft'} disabled={isBusy}>
            Save as Draft
          </Button>
          <Button type="button" onClick={() => onSubmit('complete')} loading={pendingAction === 'complete'} disabled={isBusy}>
            Complete
          </Button>
          <Button
            type="button"
            variant="outline"
            className={APPROVE_BUTTON_CLASS}
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
          <Button type="button" onClick={() => onSubmit('save')} loading={pendingAction === 'save'} disabled={isBusy}>
            Save Changes
          </Button>
          {!isApproved &&
            (isCompleted ? (
              <Button
                type="button"
                variant="outline"
                className={APPROVE_BUTTON_CLASS}
                icon={<Check size={16} />}
                iconPosition="left"
                onClick={() => onSubmit('approve')}
                loading={pendingAction === 'approve'}
                disabled={isBusy}
              >
                Approve
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className={APPROVE_BUTTON_CLASS}
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
    </div>
  )
}

export default VendorReviewFooter
