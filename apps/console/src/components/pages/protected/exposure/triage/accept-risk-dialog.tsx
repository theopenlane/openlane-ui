'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@repo/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Textarea } from '@repo/ui/textarea'
import { Button } from '@repo/ui/button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

type Props = {
  isOpen: boolean
  vulnerabilityName: string
  isSubmitting?: boolean
  onClose: () => void
  onConfirm: (reason: string, comment: string) => void
}

const REASONS: { value: string; label: string }[] = [
  { value: 'tolerable_risk', label: 'Tolerable risk' },
  { value: 'not_used', label: 'Not used' },
  { value: 'ineligible', label: 'Ineligible' },
  { value: 'no_bandwidth', label: 'No bandwidth' },
]

const AcceptRiskDialog: React.FC<Props> = ({ isOpen, vulnerabilityName, isSubmitting, onClose, onConfirm }) => {
  const [reason, setReason] = useState('')
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setReason('')
      setComment('')
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px] bg-secondary">
        <DialogHeader>
          <DialogTitle>Accept risk</DialogTitle>
          <DialogDescription>
            Dismiss <span className="font-medium text-text-header">{vulnerabilityName}</span> as an accepted risk. Choose a reason for the record.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="accept-risk-reason" className="text-sm font-medium">
              Reason
            </label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="accept-risk-reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="accept-risk-comment" className="text-sm font-medium">
              Comment <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Textarea id="accept-risk-comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="e.g. Compensating controls in place; revisit next quarter." rows={4} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <CancelButton disabled={isSubmitting} onClick={onClose} />
          <Button variant="destructive" loading={isSubmitting} disabled={isSubmitting || !reason} onClick={() => onConfirm(reason, comment.trim())}>
            Accept risk
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AcceptRiskDialog
