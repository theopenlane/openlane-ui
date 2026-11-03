'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { pluralizeWithCount } from '@/utils/strings'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { LinkControlsPicker } from './link-controls-picker'
import { type TLinkedControl } from './hooks/use-custom-framework-form-schema'
import { useLinkControlsToStandard } from './hooks/use-link-controls-to-standard'

type TLinkControlsDialogProps = {
  standardId: string
  standardName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const LinkControlsDialog: React.FC<TLinkControlsDialogProps> = ({ standardId, standardName, open, onOpenChange }) => {
  const [selected, setSelected] = useState<TLinkedControl[]>([])
  const { linkControls, isPending } = useLinkControlsToStandard()
  const { successNotification, errorNotification } = useNotification()

  const handleOpenChange = (next: boolean) => {
    if (!next) setSelected([])
    onOpenChange(next)
  }

  const handleLink = async () => {
    try {
      const { linked, failed, error } = await linkControls(
        standardId,
        selected.map((control) => control.id),
      )

      if (failed) {
        errorNotification({ title: `${pluralizeWithCount(failed, 'control')} could not be linked`, description: error ?? 'Please try again later.' })
      }
      if (linked) {
        successNotification({ title: `${pluralizeWithCount(linked, 'control')} linked to ${standardName}` })
      }
      if (!failed) handleOpenChange(false)
    } catch (error) {
      errorNotification({ title: 'Could not link controls', description: parseErrorMessage(error) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Link existing controls</DialogTitle>
          <DialogDescription>Add custom controls from your organization to {standardName}.</DialogDescription>
        </DialogHeader>
        <LinkControlsPicker value={selected} onChange={setSelected} />
        <DialogFooter>
          <CancelButton onClick={() => handleOpenChange(false)} />
          <DisabledReasonTooltip reason={selected.length ? undefined : 'Select at least one control to link.'}>
            <Button type="button" onClick={handleLink} disabled={!selected.length || isPending} loading={isPending}>
              {selected.length ? `Link ${pluralizeWithCount(selected.length, 'control')}` : 'Link controls'}
            </Button>
          </DisabledReasonTooltip>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
