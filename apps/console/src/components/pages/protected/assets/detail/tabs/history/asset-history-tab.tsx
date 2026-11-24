'use client'

import React, { useMemo, useState } from 'react'
import { AssetHistoryOpType } from '@repo/codegen/src/historyschema'
import { Button } from '@repo/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import AssociationTimeline from '@/components/pages/protected/exposure/overview/association-timeline'
import { useOwnershipHistory } from '@/components/pages/protected/exposure/detail/history/use-ownership-history'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { useAssetHistories, type AssetVendorNode } from '@/lib/graphql-hooks/asset-detail'
import { useSourceLabelResolver } from '@/lib/query-hooks/integrations'
import { isOneOf } from '@/utils/type-guards'
import { getAssetTitle, type AssetDetailNode } from '../../../asset-display'
import { type TExposureItem } from '../exposure/exposure-items'
import { buildAssetHistory } from './asset-history-model'

const HISTORY_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'fields', label: 'Field changes' },
  { value: 'exposure', label: 'Exposure' },
  { value: 'vendor', label: 'Vendor' },
] as const
type THistoryFilter = (typeof HISTORY_FILTERS)[number]['value']
const isHistoryFilter = isOneOf(HISTORY_FILTERS.map(({ value }) => value))

type TAssetHistoryTabProps = {
  asset: AssetDetailNode
  exposure: TExposureItem[]
  vendors: AssetVendorNode[]
}

const AssetHistoryTab: React.FC<TAssetHistoryTabProps> = ({ asset, exposure, vendors }) => {
  const [filter, setFilter] = useState<THistoryFilter>('all')
  const { histories, isPending, isError, error, hasNextPage, isFetchingNextPage, fetchNextPage } = useAssetHistories(asset.id)
  const resolveSource = useSourceLabelResolver()
  useQueryErrorNotification({ error, description: 'Failed to load asset history' })

  const linkedAuthorIds = useMemo(() => [...exposure, ...vendors].map(({ createdBy }) => createdBy), [exposure, vendors])
  const { authorName, ownershipChanges } = useOwnershipHistory({ histories, updateOperation: AssetHistoryOpType.UPDATE, authorIds: [...linkedAuthorIds, asset.createdBy], isPending })

  const events = useMemo(
    () =>
      buildAssetHistory({
        asset,
        title: getAssetTitle(asset),
        sourceLabel: resolveSource(asset.sourceDefinitionID),
        histories,
        ownershipChanges,
        exposure,
        vendors,
        resolveAuthor: authorName,
        resolveSource,
      }),
    [asset, histories, ownershipChanges, exposure, vendors, authorName, resolveSource],
  )

  if (isError) return <EmptyTabState title="History unavailable" description="The history of this asset could not be loaded." />

  return (
    <div className="space-y-4">
      <Tabs variant="solid" value={filter} onValueChange={(value) => isHistoryFilter(value) && setFilter(value)} className="max-w-full">
        <TabsList className="w-fit max-w-full overflow-x-auto">
          {HISTORY_FILTERS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <AssociationTimeline nodes={filter === 'all' ? events : events.filter(({ category }) => category === filter)} isLoading={isPending} emptyText="No history yet" />
      {hasNextPage && (
        <div className="flex justify-center">
          <Button type="button" variant="secondary" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
            {isFetchingNextPage ? 'Loading…' : 'Load more history'}
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">Linked vulnerabilities, findings, risks and vendors are dated by when each record was created.</p>
    </div>
  )
}

export default AssetHistoryTab
