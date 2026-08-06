'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { type CampaignRecurrenceValues } from './campaign-recurrence'
import { RecurrenceFields } from './recurrence-fields'

interface EditRecurrenceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValues: CampaignRecurrenceValues
  onSave: (values: CampaignRecurrenceValues) => Promise<void> | void
  isPending?: boolean
}

export const EditRecurrenceDialog: React.FC<EditRecurrenceDialogProps> = ({ open, onOpenChange, initialValues, onSave, isPending }) => {
  const [values, setValues] = useState(initialValues)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-w-md flex-col">
        <DialogHeader>
          <DialogTitle>Edit recurrence</DialogTitle>
        </DialogHeader>

        <RecurrenceFields values={values} onChange={setValues} />

        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" type="button" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="primary" type="button" onClick={() => onSave(values)} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
