'use client'

import React, { useId } from 'react'
import { Hash } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Callout } from '@/components/shared/callout/callout'
import { SearchableItemSelect } from '@/components/shared/searchable-item-select/searchable-item-select'
import { type TChannelItems } from './use-channel-items'

type ChannelSelectFieldProps = {
  channels: TChannelItems
  selectedId: string | undefined
  onSelectedIdChange: (id: string | undefined) => void
  providerName: string
}

export const ChannelSelectField = ({ channels, selectedId, onSelectedIdChange, providerName }: ChannelSelectFieldProps) => {
  const labelId = useId()

  if (channels.isError) {
    return (
      <Callout
        variant="danger"
        title="Couldn't load channels"
        compact
        action={
          <Button type="button" variant="secondary" onClick={() => channels.refetch()} disabled={channels.isFetching}>
            {channels.isFetching ? 'Retrying...' : 'Retry'}
          </Button>
        }
      >
        {channels.error.message}
      </Callout>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <p id={labelId} className="text-sm font-medium">
        Channel
      </p>
      <SearchableItemSelect
        aria-labelledby={labelId}
        multiple={false}
        filterItems
        selectedIds={selectedId ? [selectedId] : []}
        onSelectedIdsChange={(ids) => onSelectedIdChange(ids[0])}
        items={channels.items}
        isLoading={channels.isPending}
        icon={<Hash className="size-4" />}
        placeholder={channels.isPending ? 'Loading channels...' : 'Choose a channel'}
        searchPlaceholder="Search channels..."
        emptyMessage={`No channels found in ${providerName}.`}
      />
    </div>
  )
}
