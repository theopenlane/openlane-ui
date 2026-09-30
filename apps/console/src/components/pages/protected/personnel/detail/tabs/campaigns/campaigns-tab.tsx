'use client'

import React, { useMemo, useState } from 'react'
import { type VisibilityState } from '@repo/ui/table-types'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { CampaignTargetOrderField, OrderDirection } from '@repo/codegen/src/schema'
import { useCampaignTargetsWithCampaign } from '@/lib/graphql-hooks/campaign-target'
import { useOrgTablePagination, useOrgTableSort } from '@/hooks/use-org-table-state'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import ColumnVisibilityMenu, { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { getMappedColumns } from '@/components/shared/crud-base/columns/get-mapped-columns'
import EmptyTabState from '@/components/shared/crud-base/tabs/empty-tab-state'
import { PERSONNEL_CAMPAIGN_HIDDEN_COLUMNS, personnelCampaignColumns, toPersonnelCampaignRow } from './campaign-columns'

interface CampaignsTabProps {
  personnelEmail: string
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

const CampaignsTab: React.FC<CampaignsTabProps> = ({ personnelEmail }) => {
  const [pagination, setPagination, resetPagination] = useOrgTablePagination(DEFAULT_PAGINATION, TableKeyEnum.PERSONNEL_CAMPAIGNS)
  const [orderBy, setOrderBy] = useOrgTableSort(TableKeyEnum.PERSONNEL_CAMPAIGNS, CampaignTargetOrderField, DEFAULT_SORT)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableKeyEnum.PERSONNEL_CAMPAIGNS, PERSONNEL_CAMPAIGN_HIDDEN_COLUMNS))

  const email = personnelEmail.trim()

  const { data, campaignTargets, isLoading, isFetching, error } = useCampaignTargetsWithCampaign({
    where: { emailEqualFold: email },
    orderBy,
    pagination,
    enabled: !!email,
  })

  useQueryErrorNotification({ error, description: 'Failed to load campaigns' })

  const rows = useMemo(() => campaignTargets.map(toPersonnelCampaignRow), [campaignTargets])

  if (!email) {
    return <EmptyTabState description="This person has no email address, so no campaigns can be matched to them." />
  }

  return (
    <div className="mt-5">
      <div className="mb-3 flex items-center justify-end gap-2">
        <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} storageKey={TableKeyEnum.PERSONNEL_CAMPAIGNS} />
      </div>

      <DataTable
        columns={personnelCampaignColumns}
        data={rows}
        loading={isLoading}
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
        noResultsText="No campaigns have been sent to this person."
        tableKey={TableKeyEnum.PERSONNEL_CAMPAIGNS}
      />
    </div>
  )
}

export default CampaignsTab
