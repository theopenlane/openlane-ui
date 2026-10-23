'use client'

import React, { useId, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { providerSupportsDefaultChannel } from '@/lib/integrations/flow'
import { type IntegrationChannelTarget, type IntegrationProvider } from '@/lib/integrations/types'
import { useSaveIntegrationDefaultChannel, useSendIntegrationTestMessage } from '@/lib/query-hooks/integrations'
import { useNotification } from '@/hooks/useNotification'
import { ChannelSelectField } from './channel-select-field'
import { useChannelItems, useChannelSelection } from './use-channel-items'

type TSendTestMessageVariant = 'manual' | 'post-install'

type SendTestMessageDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  integrationId: string
  providerName: string
  variant?: TSendTestMessageVariant
  defaultChannel?: IntegrationChannelTarget
  provider?: IntegrationProvider
}

const DIALOG_COPY: Record<TSendTestMessageVariant, { title: string; dismissLabel: string }> = {
  manual: { title: 'Send test message', dismissLabel: 'Cancel' },
  'post-install': { title: 'Send a test message now?', dismissLabel: 'Not now' },
}

type SendTestMessageBodyProps = Omit<SendTestMessageDialogProps, 'open'> & {
  dismissLabel: string
  sendTestMessage: ReturnType<typeof useSendIntegrationTestMessage>
  saveDefaultChannel: ReturnType<typeof useSaveIntegrationDefaultChannel>
}

const SendTestMessageBody = ({ onOpenChange, integrationId, providerName, dismissLabel, variant, defaultChannel, provider, sendTestMessage, saveDefaultChannel }: SendTestMessageBodyProps) => {
  const makeDefaultId = useId()
  const channels = useChannelItems(integrationId)
  const { selectedId, selectedChannel, setSelectedId } = useChannelSelection(channels, defaultChannel)
  const [canMakeDefault] = useState(() => providerSupportsDefaultChannel(provider) && !defaultChannel)
  const [makeDefault, setMakeDefault] = useState(variant === 'post-install')
  const { successNotification } = useNotification()
  const isSendingRef = useRef(false)
  const isWorking = sendTestMessage.isPending || saveDefaultChannel.isPending

  const handleSend = () => {
    if (!selectedChannel || isSendingRef.current) {
      return
    }

    isSendingRef.current = true
    const finish = () => {
      isSendingRef.current = false
      onOpenChange(false)
    }

    sendTestMessage.mutate(
      { integrationId, target: { teamId: selectedChannel.teamId, channelId: selectedChannel.channelId } },
      {
        onSuccess: () => {
          successNotification({
            title: 'Test message sent',
            description: `Check ${selectedChannel.name} in ${providerName} for the message from Openlane.`,
          })
          if (canMakeDefault && makeDefault) {
            saveDefaultChannel.mutate({ integrationId, provider, channel: selectedChannel }, { onSettled: finish })
            return
          }
          finish()
        },
        onError: () => {
          isSendingRef.current = false
        },
      },
    )
  }

  const sendDisabledReason = !selectedChannel ? 'Choose a channel first.' : undefined

  return (
    <>
      <ChannelSelectField channels={channels} selectedId={selectedId} onSelectedIdChange={setSelectedId} providerName={providerName} />

      {canMakeDefault && !channels.isError ? (
        <div className="flex items-start gap-2">
          <Checkbox id={makeDefaultId} className="mt-0.5" checked={makeDefault} onCheckedChange={(checked) => setMakeDefault(checked === true)} disabled={isWorking} />
          <label htmlFor={makeDefaultId} className="text-sm">
            Also make this the default channel
            <span className="block text-xs text-muted-foreground">Messages sent without a channel will post here.</span>
          </label>
        </div>
      ) : null}

      <DialogFooter>
        <CancelButton title={dismissLabel} onClick={() => onOpenChange(false)} disabled={isWorking} />
        <DisabledReasonTooltip reason={sendDisabledReason}>
          <Button type="button" className="w-full sm:w-auto" icon={<Send className="size-4" />} iconPosition="left" onClick={handleSend} disabled={!!sendDisabledReason || isWorking}>
            {saveDefaultChannel.isPending ? 'Saving default...' : sendTestMessage.isPending ? 'Sending...' : 'Send Test Message'}
          </Button>
        </DisabledReasonTooltip>
      </DialogFooter>
    </>
  )
}

const SendTestMessageDialog = ({ open, onOpenChange, variant = 'manual', ...bodyProps }: SendTestMessageDialogProps) => {
  const copy = DIALOG_COPY[variant]
  const sendTestMessage = useSendIntegrationTestMessage()
  const saveDefaultChannel = useSaveIntegrationDefaultChannel()
  const isWorking = sendTestMessage.isPending || saveDefaultChannel.isPending
  const handleOpenChange = (next: boolean) => {
    if (next || !isWorking) {
      onOpenChange(next)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg" showCloseButton={!isWorking}>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>Openlane will post a test message to the channel you choose, so you can confirm {bodyProps.providerName} is connected and working.</DialogDescription>
        </DialogHeader>
        <SendTestMessageBody onOpenChange={onOpenChange} dismissLabel={copy.dismissLabel} variant={variant} sendTestMessage={sendTestMessage} saveDefaultChannel={saveDefaultChannel} {...bodyProps} />
      </DialogContent>
    </Dialog>
  )
}

export default SendTestMessageDialog
