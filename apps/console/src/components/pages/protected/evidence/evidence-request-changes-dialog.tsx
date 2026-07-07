'use client'

import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Textarea } from '@repo/ui/textarea'
import { Label } from '@repo/ui/label'

type TEvidenceRequestChangesDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (comment: string) => void | Promise<void>
  loading?: boolean
  evidenceName?: string
  count?: number
}

const EvidenceRequestChangesDialog: React.FC<TEvidenceRequestChangesDialogProps> = ({ open, onOpenChange, onConfirm, loading, evidenceName, count }) => {
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (open) {
      setComment('')
    }
  }, [open])

  const handleConfirm = async () => {
    if (!comment.trim()) return
    await onConfirm(comment.trim())
  }

  const description =
    count && count > 1
      ? `Provide feedback describing what needs to be updated before this evidence can be approved. Your comment will be added to all ${count} selected evidence, and their status will change to Rejected.`
      : `Provide feedback describing what needs to be updated before this evidence${evidenceName ? ` (${evidenceName}) ` : ''} can be approved. Your comment will be saved with the evidence, and its status will change to Rejected.`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Changes</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 text-left">
          <Label htmlFor="request-changes-comment">Comment</Label>
          <Textarea id="request-changes-comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Describe the changes required..." rows={4} autoFocus />
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!comment.trim() || loading} loading={loading}>
            Request Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EvidenceRequestChangesDialog
