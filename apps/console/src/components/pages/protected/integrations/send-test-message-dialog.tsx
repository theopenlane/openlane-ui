'use client'

import React, { useId, useMemo, useRef, useState } from 'react'
import { Hash, Send } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Callout } from '@/components/shared/callout/callout'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { SearchableItemSelect } from '@/components/shared/searchable-item-select/searchable-item-select'
import { type IntegrationMessageTeam } from '@/lib/integrations/types'
import { useIntegrationChannels, useSendIntegrationTestMessage } from '@/lib/query-hooks/integrations'
import { useNotification } from '@/hooks/useNotification'

type TSendTestMessageVariant = 'manual' | 'post-install'

type TChannelItem = {
  id: string
  name: string
  teamId: string
  channelId: string
}

type SendTestMessageDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  integrationId: string
  providerName: string
  variant?: TSendTestMessageVariant
}

const DIALOG_COPY: Record<TSendTestMessageVariant, { title: string; dismissLabel: string }> = {
  manual: { title: 'Send test message', dismissLabel: 'Cancel' },
  'post-install': { title: 'Send a test message now?', dismissLabel: 'Not now' },
}

const toChannelItems = (teams: IntegrationMessageTeam[]): TChannelItem[] =>
  teams.flatMap((team) =>
    team.channels.map((channel) => ({
      id: `${team.id}:${channel.id}`,
      name: teams.length > 1 ? `${team.displayName} / ${channel.displayName}` : channel.displayName,
      teamId: team.id,
      channelId: channel.id,
    })),
  )

type SendTestMessageBodyProps = Omit<SendTestMessageDialogProps, 'open' | 'variant'> & {
  dismissLabel: string
}

const SendTestMessageBody = ({ onOpenChange, integrationId, providerName, dismissLabel }: SendTestMessageBodyProps) => {
  const labelId = useId()
  const [selectedId, setSelectedId] = useState<string>()
  const { data: teams, isPending, isError, error, refetch, isFetching } = useIntegrationChannels(integrationId)
  const sendTestMessage = useSendIntegrationTestMessage()
  const { successNotification } = useNotification()
  const isSendingRef = useRef(false)

  const channelItems = useMemo(() => toChannelItems(teams ?? []), [teams])
  const selectedChannel = channelItems.find((item) => item.id === selectedId)

  const handleSend = () => {
    if (!selectedChannel || isSendingRef.current) {
      return
    }

    isSendingRef.current = true
    sendTestMessage.mutate(
      { integrationId, target: { teamId: selectedChannel.teamId, channelId: selectedChannel.channelId } },
      {
        onSuccess: () => {
          successNotification({
            title: 'Test message sent',
            description: `Check ${selectedChannel.name} in ${providerName} for the message from Openlane.`,
          })
          onOpenChange(false)
        },
        onSettled: () => {
          isSendingRef.current = false
        },
      },
    )
  }

  const sendDisabledReason = !selectedChannel ? 'Choose a channel first.' : undefined

  return (
    <>
      {isError ? (
        <Callout
          variant="danger"
          title="Couldn't load channels"
          compact
          action={
            <Button type="button" variant="secondary" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? 'Retrying...' : 'Retry'}
            </Button>
          }
        >
          {error.message}
        </Callout>
      ) : (
        <div className="flex flex-col gap-2">
          <p id={labelId} className="text-sm font-medium">
            Channel
          </p>
          <SearchableItemSelect
            aria-labelledby={labelId}
            multiple={false}
            filterItems
            selectedIds={selectedId ? [selectedId] : []}
            onSelectedIdsChange={(ids) => setSelectedId(ids[0])}
            items={channelItems}
            isLoading={isPending}
            icon={<Hash className="size-4" />}
            placeholder={isPending ? 'Loading channels...' : 'Choose a channel'}
            searchPlaceholder="Search channels..."
            emptyMessage={`No channels found in ${providerName}.`}
          />
        </div>
      )}

      <DialogFooter>
        <CancelButton title={dismissLabel} onClick={() => onOpenChange(false)} disabled={sendTestMessage.isPending} />
        <DisabledReasonTooltip reason={sendDisabledReason}>
          <Button type="button" className="w-full sm:w-auto" icon={<Send className="size-4" />} iconPosition="left" onClick={handleSend} disabled={!!sendDisabledReason || sendTestMessage.isPending}>
            {sendTestMessage.isPending ? 'Sending...' : 'Send Test Message'}
          </Button>
        </DisabledReasonTooltip>
      </DialogFooter>
    </>
  )
}

const SendTestMessageDialog = ({ open, onOpenChange, integrationId, providerName, variant = 'manual' }: SendTestMessageDialogProps) => {
  const copy = DIALOG_COPY[variant]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>Openlane will post a test message to the channel you choose, so you can confirm {providerName} is connected and working.</DialogDescription>
        </DialogHeader>
        <SendTestMessageBody onOpenChange={onOpenChange} integrationId={integrationId} providerName={providerName} dismissLabel={copy.dismissLabel} />
      </DialogContent>
    </Dialog>
  )
}

export default SendTestMessageDialog
