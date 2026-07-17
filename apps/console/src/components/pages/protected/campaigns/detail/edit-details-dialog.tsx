'use client'

import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Button } from '@repo/ui/button'

interface EditDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialName: string
  initialDescription: string
  onSave: (values: { name: string; description: string }) => Promise<void> | void
  isPending?: boolean
}

export const EditDetailsDialog: React.FC<EditDetailsDialogProps> = ({ open, onOpenChange, initialName, initialDescription, onSave, isPending }) => {
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)

  useEffect(() => {
    if (open) {
      setName(initialName)
      setDescription(initialDescription)
    }
  }, [open, initialName, initialDescription])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-w-md flex-col">
        <DialogHeader>
          <DialogTitle>Edit details</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">
            Campaign name<span className="text-destructive">*</span>
          </label>
          <Input value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder="Enter a campaign name" />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Description</label>
          <Textarea value={description} onChange={(e) => setDescription(e.currentTarget.value)} placeholder="Describe the purpose of this campaign..." rows={3} />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" type="button" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="primary" type="button" onClick={() => onSave({ name: name.trim(), description })} disabled={isPending || !name.trim()}>
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
