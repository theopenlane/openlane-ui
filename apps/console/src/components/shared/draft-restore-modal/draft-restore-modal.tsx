'use client'

import { useMemo } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { FileClock } from 'lucide-react'
import { formatTimeSince } from '@/utils/date.ts'

type DraftRestoreModalProps = {
  open: boolean
  savedAt: number
  entityLabel: string
  onResume: () => void
  onDiscard: () => void
}

const DraftRestoreModal = ({ open, savedAt, entityLabel, onResume, onDiscard }: DraftRestoreModalProps) => {
  const savedAtIso = useMemo(() => new Date(savedAt).toISOString(), [savedAt])
  return (
    <Dialog open={open}>
      <DialogContent className="size-fit max-w-md" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <FileClock className="h-6 w-6" strokeWidth={1.5} />
            <DialogTitle>Resume unsaved {entityLabel}?</DialogTitle>
          </div>
          <DialogDescription>We saved your work locally {formatTimeSince(savedAtIso)}. You can pick up where you left off, or discard it and start fresh.</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onDiscard}>
            Discard
          </Button>
          <Button onClick={onResume}>Resume</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DraftRestoreModal
