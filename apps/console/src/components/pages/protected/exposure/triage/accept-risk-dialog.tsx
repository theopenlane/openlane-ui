'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@repo/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Textarea } from '@repo/ui/textarea'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { DISMISS_REASONS, OTHER_DISMISS_REASON } from '../vulnerability-dismiss-reasons'

type Props = {
  isOpen: boolean
  vulnerabilityName: string
  isSubmitting?: boolean
  onClose: () => void
  onConfirm: (reason: string, comment: string) => void
}

const AcceptRiskDialog: React.FC<Props> = ({ isOpen, vulnerabilityName, isSubmitting, onClose, onConfirm }) => {
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setReason('')
      setCustomReason('')
      setComment('')
    }
  }, [isOpen])

  const isOther = reason === OTHER_DISMISS_REASON
  const selectedDescription = DISMISS_REASONS.find((option) => option.value === reason)?.description
  const resolvedReason = isOther ? customReason.trim() : reason
  const canSubmit = Boolean(resolvedReason)

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
                {DISMISS_REASONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
                <SelectItem value={OTHER_DISMISS_REASON}>Other</SelectItem>
              </SelectContent>
            </Select>
            {selectedDescription && <p className="text-xs text-muted-foreground">{selectedDescription}</p>}
            {isOther && <Input value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="Enter a reason" autoFocus />}
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
          <Button variant="destructive" loading={isSubmitting} disabled={isSubmitting || !canSubmit} onClick={() => onConfirm(resolvedReason, comment.trim())}>
            Accept risk
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AcceptRiskDialog
