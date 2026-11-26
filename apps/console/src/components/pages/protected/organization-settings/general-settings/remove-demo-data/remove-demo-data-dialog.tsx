'use client'

import { useState } from 'react'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Label } from '@repo/ui/label'
import { RadioGroup, RadioGroupItem } from '@repo/ui/radio-group'
import { cn } from '@repo/ui/lib/utils'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { NOTHING_KEPT, type TDemoDataTypeKey } from '@/constants/demo-data-types'
import { type TDemoDataTypeCounts } from '@/lib/graphql-hooks/demo-data'
import { isOneOf } from '@/utils/type-guards'
import { pluralizeWithCount } from '@/utils/strings'
import { DemoDataTypePicker } from './demo-data-type-picker'
import { useDemoDataTypeSelection } from './use-demo-data-type-selection'

type RemoveDemoDataDialogProps = {
  counts: TDemoDataTypeCounts
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (kept: ReadonlySet<TDemoDataTypeKey>) => void
  isRemoving: boolean
}

const REMOVAL_MODES = ['everything', 'keep-some'] as const
type TRemovalMode = (typeof REMOVAL_MODES)[number]
const isRemovalMode = isOneOf(REMOVAL_MODES)

const MODE_COPY: Record<TRemovalMode, { title: string; description: string }> = {
  everything: { title: 'Remove everything', description: 'All sample records are deleted.' },
  'keep-some': { title: 'Keep some records', description: 'Choose what to keep, like templates and questionnaires.' },
}

const KEEPING_NOTHING_REASON = 'Select at least one type to keep, or choose Remove everything.'
const KEEPING_ALL_REASON = 'Every record is being kept. Clear at least one type to remove it.'

const RemoveDemoDataBody = ({ counts, onOpenChange, onConfirm, isRemoving }: Omit<RemoveDemoDataDialogProps, 'open'>) => {
  const [mode, setMode] = useState<TRemovalMode>('everything')
  const isKeepingSome = mode === 'keep-some'
  const selection = useDemoDataTypeSelection(counts)

  const selectionReason = selection.isKeepingAll ? KEEPING_ALL_REASON : selection.kept.size === 0 ? KEEPING_NOTHING_REASON : null
  const unavailableReason = isKeepingSome ? selectionReason : null

  return (
    <>
      <RadioGroup
        value={mode}
        onValueChange={(value) => isRemovalMode(value) && setMode(value)}
        aria-label="What to remove"
        className={cn('grid gap-3', isKeepingSome && 'sm:grid-cols-2')}
        disabled={isRemoving}
      >
        {REMOVAL_MODES.map((option) => (
          <Label key={option} htmlFor={`remove-demo-data-${option}`} className={cn('flex cursor-pointer items-start gap-3 rounded-lg border p-4', option === mode && 'border-primary')}>
            <RadioGroupItem value={option} id={`remove-demo-data-${option}`} className="mt-0.5" />
            <span className="flex min-w-0 flex-col gap-1">
              <span className="text-sm font-medium">{MODE_COPY[option].title}</span>
              <span className="text-sm font-normal text-muted-foreground">{MODE_COPY[option].description}</span>
            </span>
          </Label>
        ))}
      </RadioGroup>

      {isKeepingSome && <DemoDataTypePicker selection={selection} disabled={isRemoving} />}

      <DialogFooter className="items-center gap-2 sm:justify-between">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {isKeepingSome ? `Keeping ${pluralizeWithCount(selection.keptCount, 'record')}` : null}
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" type="button" disabled={isRemoving} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <DisabledReasonTooltip reason={unavailableReason} side="top">
            <Button
              variant="destructiveOutline"
              type="button"
              disabled={isRemoving || !!unavailableReason}
              loading={isRemoving}
              onClick={() => onConfirm(isKeepingSome ? selection.kept : NOTHING_KEPT)}
            >
              Remove demo data
            </Button>
          </DisabledReasonTooltip>
        </div>
      </DialogFooter>
    </>
  )
}

export const RemoveDemoDataDialog = ({ counts, open, onOpenChange, onConfirm, isRemoving }: RemoveDemoDataDialogProps) => (
  <Dialog open={open} onOpenChange={(next) => !isRemoving && onOpenChange(next)}>
    <DialogContent className="w-[calc(100%-2rem)] max-w-xl has-[[data-demo-data-picker]]:max-w-4xl">
      <DialogHeader>
        <DialogTitle>Remove demo data</DialogTitle>
        <DialogDescription>Records you created yourself are not affected.</DialogDescription>
      </DialogHeader>
      <RemoveDemoDataBody counts={counts} onOpenChange={onOpenChange} onConfirm={onConfirm} isRemoving={isRemoving} />
    </DialogContent>
  </Dialog>
)
