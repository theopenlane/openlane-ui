'use client'

import React from 'react'
import { Button } from '@repo/ui/button'

export type TVendorReviewAction = 'draft' | 'submit' | 'approve'

type TVendorReviewFooterProps = {
  pendingAction: TVendorReviewAction | null
  onCancel?: () => void
  onSubmit: (action: TVendorReviewAction) => void
  submitLabel: string
  approveLabel: string
}

const VendorReviewFooter: React.FC<TVendorReviewFooterProps> = ({ pendingAction, onCancel, onSubmit, submitLabel, approveLabel }) => {
  const isBusy = pendingAction !== null

  return (
    <div className="mt-auto flex items-center justify-end gap-2 border-t pt-4">
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel} disabled={isBusy}>
          Cancel
        </Button>
      )}
      <Button type="button" variant="secondary" onClick={() => onSubmit('draft')} loading={pendingAction === 'draft'} disabled={isBusy}>
        Save as Draft
      </Button>
      <Button type="button" onClick={() => onSubmit('submit')} loading={pendingAction === 'submit'} disabled={isBusy}>
        {submitLabel}
      </Button>
      <Button type="button" variant="success" onClick={() => onSubmit('approve')} loading={pendingAction === 'approve'} disabled={isBusy}>
        {approveLabel}
      </Button>
    </div>
  )
}

export default VendorReviewFooter
