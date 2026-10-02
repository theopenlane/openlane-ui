'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { type VisibilityState } from '@repo/ui/table-types'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { CampaignTargetOrderField, OrderDirection, type CampaignTargetWhereInput } from '@repo/codegen/src/schema'
import { useCampaignTargetsWithCampaign } from '@/lib/graphql-hooks/campaign-target'
import { useOrgTablePagination, useOrgTableSort } from '@/hooks/use-org-table-state'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { useAsyncCommandSearch } from '@/hooks/useAsyncCommandSearch'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import ColumnVisibilityMenu, { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { getMappedColumns } from '@/components/shared/crud-base/columns/get-mapped-columns'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import { SearchFilterBar, mergeWhere } from '@/components/shared/crud-base/tabs/shared'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { PERSONNEL_CAMPAIGN_HIDDEN_COLUMNS, personnelCampaignColumns, toPersonnelCampaignRow } from './campaign-columns'
import { PERSONNEL_CAMPAIGN_FILTER_FIELDS, campaignNameSearchWhere, mapPersonnelCampaignFilterKey } from './campaign-filters'

interface CampaignsTabProps {
  personnelEmail: string
  searchTerm: string
  onSearchTermChange: (value: string) => void
}

const SORT_FIELDS = [
  { label: 'Status', key: CampaignTargetOrderField.STATUS },
  { label: 'Sent At', key: CampaignTargetOrderField.sent_at },
  { label: 'Completed At', key: CampaignTargetOrderField.completed_at },
]

const DEFAULT_SORT = [
  { field: CampaignTargetOrderField.STATUS, direction: OrderDirection.DESC },
  { field: CampaignTargetOrderField.completed_at, direction: OrderDirection.DESC },
  { field: CampaignTargetOrderField.sent_at, direction: OrderDirection.DESC },
]

const mappedColumns = getMappedColumns(personnelCampaignColumns)

const CampaignsTab: React.FC<CampaignsTabProps> = ({ personnelEmail, searchTerm, onSearchTermChange }) => {
  const [pagination, setPagination, resetPagination] = useOrgTablePagination(DEFAULT_PAGINATION, TableKeyEnum.PERSONNEL_CAMPAIGNS)
  const [orderBy, setOrderBy] = useOrgTableSort(TableKeyEnum.PERSONNEL_CAMPAIGNS, CampaignTargetOrderField, DEFAULT_SORT)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableKeyEnum.PERSONNEL_CAMPAIGNS, PERSONNEL_CAMPAIGN_HIDDEN_COLUMNS))
  const [filters, setFilters] = useState<CampaignTargetWhereInput | null>(null)

  const handleSearchTermChange = useCallback(
    (value: string) => {
      onSearchTermChange(value)
      resetPagination()
    },
    [onSearchTermChange, resetPagination],
  )

  const { searchText, setSearchText, debouncedTerm, getIsSearching } = useAsyncCommandSearch({ controlled: { value: searchTerm, onValueChange: handleSearchTermChange } })

  const handleFilterChange = useCallback(
    (next: CampaignTargetWhereInput) => {
      setFilters(next)
      resetPagination()
    },
    [resetPagination],
  )

  const email = personnelEmail.trim()

  const where = useMemo(
    () =>
      filters
        ? mergeWhere<CampaignTargetWhereInput>([{ emailEqualFold: email }, whereGenerator(filters, mapPersonnelCampaignFilterKey), debouncedTerm ? campaignNameSearchWhere(debouncedTerm) : undefined])
        : null,
    [filters, debouncedTerm, email],
  )

  const { data, campaignTargets, isLoading, isFetching, isPlaceholderData, error } = useCampaignTargetsWithCampaign({
    where: where ?? undefined,
    orderBy,
    pagination,
    enabled: !!email && !!where,
  })

  useQueryErrorNotification({ error, description: 'Failed to load campaigns' })

  const rows = useMemo(() => campaignTargets.map(toPersonnelCampaignRow), [campaignTargets])

  const isFiltered = !!debouncedTerm || Object.keys(filters ?? {}).length > 0

  if (!email) {
    return <EmptyTabState description="This person has no email address, so no campaigns can be matched to them." />
  }

  return (
    <div className="mt-5">
      <div className="mb-3">
        <SearchFilterBar
          placeholder="Search by name"
          isSearching={getIsSearching(isFetching && !!debouncedTerm)}
          searchValue={searchText}
          onSearchChange={setSearchText}
          filterFields={PERSONNEL_CAMPAIGN_FILTER_FIELDS}
          onFilterChange={handleFilterChange}
          pageKey={TableKeyEnum.PERSONNEL_CAMPAIGNS}
          actionButtons={
            <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} storageKey={TableKeyEnum.PERSONNEL_CAMPAIGNS} />
          }
        />
      </div>

      <DataTable
        columns={personnelCampaignColumns}
        data={rows}
        loading={!where || isLoading || (isPlaceholderData && rows.length === 0)}
        sortFields={SORT_FIELDS}
        sorting={orderBy}
        onSortChange={(next) => {
          setOrderBy(next)
          resetPagination()
        }}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={{ totalCount: data?.campaignTargets?.totalCount, pageInfo: data?.campaignTargets?.pageInfo, isLoading: isFetching }}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        noResultsText={isFiltered ? 'No campaigns match the current search or filters.' : 'No campaigns have been sent to this person.'}
        tableKey={TableKeyEnum.PERSONNEL_CAMPAIGNS}
      />
    </div>
  )
}

export default CampaignsTab
