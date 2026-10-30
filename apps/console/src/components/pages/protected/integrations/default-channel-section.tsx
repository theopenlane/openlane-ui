'use client'

import React from 'react'
import { Hash } from 'lucide-react'
import { TruncatedCell } from '@repo/ui/truncated-cell'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { type IntegrationChannelTarget } from '@/lib/integrations/types'
import { findChannelItem, useChannelItems } from './use-channel-items'

const CHANNEL_NAME_STALE_TIME_MS = 10 * 60 * 1000 // 10min

type DefaultChannelSectionProps = {
  integrationId: string
  defaultChannel: IntegrationChannelTarget | undefined
  canResolveName: boolean
}

const DefaultChannelSection = ({ integrationId, defaultChannel, canResolveName }: DefaultChannelSectionProps) => {
  const channels = useChannelItems(integrationId, { enabled: !!defaultChannel && canResolveName, staleTime: CHANNEL_NAME_STALE_TIME_MS })
  const channelName = findChannelItem(channels.items, defaultChannel)?.name ?? (channels.isSuccess ? `Unknown channel (${defaultChannel?.channelId})` : defaultChannel?.channelId)

  return (
    <div className="flex min-w-0 flex-col gap-1 text-sm">
      <span className="text-xs text-muted-foreground">DEFAULT CHANNEL</span>
      {!defaultChannel ? (
        <span className="text-muted-foreground">Not set</span>
      ) : canResolveName && channels.isPending ? (
        <Skeleton height={20} className="w-full max-w-40 rounded-md" />
      ) : (
        <span className="flex min-w-0 items-center gap-1">
          <Hash className="size-4 shrink-0 text-muted-foreground" />
          <TruncatedCell className="min-w-0" portal>
            {channelName}
          </TruncatedCell>
        </span>
      )}
    </div>
  )
}

export default DefaultChannelSection
