'use client'

import React, { useMemo } from 'react'
import { useDebounce } from '@uidotdev/usehooks'
import { Link2, LoaderCircle, SearchIcon } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { DataTable } from '@repo/ui/data-table'
import { Input } from '@repo/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import { ObjectAssociationMap } from '@/components/shared/enum-mapper/object-association-enum'
import { SkeletonRows } from '@/components/shared/skeleton/skeleton-rows'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { ASSET_EXPOSURE_LIMIT } from '@/lib/graphql-hooks/asset-detail'
import { useSourceLabelResolver } from '@/lib/query-hooks/integrations'
import { useOpenObjectSheet } from '@/providers/sheet-navigation-provider'
import { sliceByPagination } from '@/utils/pagination'
import { getExposureColumns } from './exposure-columns'
import { ExposureSeverityBar } from './exposure-severity-bar'
import { ALL_KINDS, EXPOSURE_FILTERS, isExposureFilter, type TExposureFilter, type TExposureView } from './use-exposure-view'
import { type TAssetExposure, useAssetExposure } from './use-asset-exposure'

type TAssetExposureTabProps = {
  assetId: string
  exposure: TAssetExposure
  view: TExposureView
  canEdit: boolean
  onLinkExposure: () => void
}

const AssetExposureTab: React.FC<TAssetExposureTabProps> = ({ assetId, exposure, view, canEdit, onLinkExposure }) => {
  const openObjectSheet = useOpenObjectSheet()
  const resolveSource = useSourceLabelResolver()
  const { kindFilter, setKindFilter, openOnly, setOpenOnly, searchText, setSearchText, pagination, setPagination } = view
  const search = useDebounce(searchText.trim(), 300)
  const filters = useMemo(() => ({ search, openOnly }), [search, openOnly])
  const filtered = useAssetExposure(assetId, filters)
  useQueryErrorNotification({ error: filtered.error, description: 'Failed to load exposure' })

  const columns = useMemo(() => getExposureColumns({ onOpenSheet: openObjectSheet, resolveSource }), [openObjectSheet, resolveSource])
  const itemsFor = (kind: TExposureFilter) => (kind === ALL_KINDS ? filtered.items : filtered.items.filter((item) => item.kind === kind))
  const rows = itemsFor(kindFilter)
  const openCount = exposure.items.filter((item) => item.isOpen).length
  const isSearching = searchText.trim() !== search || (filtered.isFetching && !!search)

  if (exposure.isPending) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading exposure">
        <SkeletonRows count={5} height={48} />
      </div>
    )
  }

  if (exposure.error && exposure.items.length === 0) return <EmptyTabState title="Exposure unavailable" description="Vulnerabilities, findings and risks could not be loaded." />

  const linkButton = canEdit && (
    <Button type="button" variant="secondary" icon={<Link2 size={16} />} iconPosition="left" onClick={onLinkExposure}>
      Link existing
    </Button>
  )

  if (exposure.items.length === 0) {
    return (
      <div className="flex flex-col items-center">
        <EmptyTabState title="No exposure linked" description="Vulnerabilities, findings and risks linked to this asset appear here." />
        {linkButton}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          <span className="font-medium">{exposure.totalCount} linked</span>
          <span className="text-muted-foreground"> · {openCount} open</span>
        </p>
        {linkButton}
      </div>

      <ExposureSeverityBar items={exposure.items} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs variant="solid" value={kindFilter} onValueChange={(value) => isExposureFilter(value) && setKindFilter(value)} className="max-w-full">
          <TabsList className="w-fit max-w-full overflow-x-auto">
            {EXPOSURE_FILTERS.map((kind) => (
              <TabsTrigger key={kind} value={kind}>
                {kind === ALL_KINDS ? 'All' : ObjectAssociationMap[kind].label} ({itemsFor(kind).length})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap items-center gap-4">
          <label htmlFor="asset-exposure-open-only" className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox id="asset-exposure-open-only" checked={openOnly} onCheckedChange={(checked) => setOpenOnly(checked === true)} />
            Open only
          </label>
          <Input
            icon={isSearching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
            placeholder="Search by ID or title"
            aria-label="Search exposure"
            value={searchText}
            onChange={(event) => setSearchText(event.currentTarget.value)}
            variant="searchTable"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered.isPlaceholderData ? [] : sliceByPagination(rows, pagination)}
        loading={filtered.isPending || filtered.isPlaceholderData}
        getRowId={(row) => `${row.kind}:${row.id}`}
        noResultsText="No matching exposure"
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={{ totalCount: rows.length, isLoading: filtered.isFetching }}
        tableKey={undefined}
      />
      {filtered.isTruncated && <p className="text-xs text-muted-foreground">Showing the first {ASSET_EXPOSURE_LIMIT} of each kind. Search to reach the rest.</p>}
    </div>
  )
}

export default AssetExposureTab
