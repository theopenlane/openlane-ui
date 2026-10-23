'use client'

import { useCallback, useMemo, useState } from 'react'
import { isSameChannel } from '@/lib/integrations/flow'
import { type IntegrationChannelTarget, type IntegrationMessageTeam } from '@/lib/integrations/types'
import { type UseIntegrationChannelsOptions, useIntegrationChannels } from '@/lib/query-hooks/integrations'

export type TChannelItem = IntegrationChannelTarget & {
  id: string
  name: string
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

export const useChannelItems = (integrationId: string, options?: UseIntegrationChannelsOptions) => {
  const query = useIntegrationChannels(integrationId, options)
  const items = useMemo(() => toChannelItems(query.data ?? []), [query.data])

  return { ...query, items }
}

export type TChannelItems = ReturnType<typeof useChannelItems>

export const findChannelItem = (items: TChannelItem[], target: IntegrationChannelTarget | undefined): TChannelItem | undefined => items.find((item) => isSameChannel(item, target))

type TChannelPick = { kind: 'initial' } | { kind: 'picked'; id: string | undefined }

export const useChannelSelection = (channels: TChannelItems, initial: IntegrationChannelTarget | undefined) => {
  const [pick, setPick] = useState<TChannelPick>({ kind: 'initial' })
  const selectedId = pick.kind === 'initial' ? findChannelItem(channels.items, initial)?.id : pick.id
  const selectedChannel = channels.items.find((item) => item.id === selectedId)
  const setSelectedId = useCallback((id: string | undefined) => setPick({ kind: 'picked', id }), [])

  return { selectedId, selectedChannel, setSelectedId }
}
