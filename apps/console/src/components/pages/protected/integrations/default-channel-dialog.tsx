'use client'

import React from 'react'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { isSameChannel } from '@/lib/integrations/flow'
import { type IntegrationChannelTarget, type IntegrationProvider } from '@/lib/integrations/types'
import { useSaveIntegrationDefaultChannel } from '@/lib/query-hooks/integrations'
import { ChannelSelectField } from './channel-select-field'
import { type TChannelItem, useChannelItems, useChannelSelection } from './use-channel-items'

type DefaultChannelDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  integrationId: string
  providerName: string
  defaultChannel?: IntegrationChannelTarget
  provider: IntegrationProvider | undefined
}

type DefaultChannelBodyProps = Omit<DefaultChannelDialogProps, 'open'>

const DefaultChannelBody = ({ onOpenChange, integrationId, providerName, defaultChannel, provider }: DefaultChannelBodyProps) => {
  const channels = useChannelItems(integrationId)
  const { selectedId, selectedChannel, setSelectedId } = useChannelSelection(channels, defaultChannel)
  const saveDefaultChannel = useSaveIntegrationDefaultChannel()

  const save = (channel?: TChannelItem) => saveDefaultChannel.mutate({ integrationId, provider, channel }, { onSuccess: () => onOpenChange(false) })

  const saveDisabledReason = !selectedChannel ? 'Choose a channel first.' : isSameChannel(selectedChannel, defaultChannel) ? 'This channel is already the default.' : undefined

  return (
    <>
      <ChannelSelectField channels={channels} selectedId={selectedId} onSelectedIdChange={setSelectedId} providerName={providerName} />

      <DialogFooter className="gap-2">
        {defaultChannel ? (
          <Button type="button" variant="secondary" className="sm:mr-auto" onClick={() => save()} disabled={saveDefaultChannel.isPending}>
            Clear Default
          </Button>
        ) : null}
        <CancelButton onClick={() => onOpenChange(false)} disabled={saveDefaultChannel.isPending} />
        <DisabledReasonTooltip reason={saveDisabledReason}>
          <SaveButton type="button" onClick={() => save(selectedChannel)} disabled={!!saveDisabledReason || saveDefaultChannel.isPending} isSaving={saveDefaultChannel.isPending} />
        </DisabledReasonTooltip>
      </DialogFooter>
    </>
  )
}

const DefaultChannelDialog = ({ open, onOpenChange, ...bodyProps }: DefaultChannelDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Default channel</DialogTitle>
        <DialogDescription>Openlane posts {bodyProps.providerName} messages that do not name a channel to this one.</DialogDescription>
      </DialogHeader>
      <DefaultChannelBody onOpenChange={onOpenChange} {...bodyProps} />
    </DialogContent>
  </Dialog>
)

export default DefaultChannelDialog
