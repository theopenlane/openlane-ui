'use client'

import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Button } from '@repo/ui/button'

interface ChangeTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  options: Array<{ label: string; value: string }>
  value?: string
  isLoading?: boolean
  onSave: (emailTemplateID: string) => Promise<void> | void
  isPending?: boolean
}

export const ChangeTemplateDialog: React.FC<ChangeTemplateDialogProps> = ({ open, onOpenChange, options, value, isLoading, onSave, isPending }) => {
  const [selected, setSelected] = useState<string | undefined>(value)

  useEffect(() => {
    if (open) setSelected(value)
  }, [open, value])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-w-md flex-col">
        <DialogHeader>
          <DialogTitle>Change email template</DialogTitle>
          <p className="text-sm text-muted-foreground">Choose the email template used to contact recipients.</p>
        </DialogHeader>

        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an email template" />
          </SelectTrigger>
          <SelectContent>
            {isLoading ? (
              <div className="p-2 text-sm text-muted-foreground">Loading templates...</div>
            ) : options.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">No email templates available</div>
            ) : (
              options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" type="button" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="primary" type="button" onClick={() => selected && onSave(selected)} disabled={isPending || !selected}>
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
