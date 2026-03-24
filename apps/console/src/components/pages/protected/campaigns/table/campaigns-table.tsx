'use client'

import { DataTable } from '@repo/ui/data-table'
import React, { useEffect, useMemo } from 'react'
import { type CampaignOrder, type CampaignWhereInput, type OrderDirection } from '@repo/codegen/src/schema'
import { type TPagination } from '@repo/ui/pagination-types'
import { getCampaignColumns } from '@/components/pages/protected/campaigns/table/columns'
import { CAMPAIGN_SORT_FIELDS } from '@/components/pages/protected/campaigns/table/table-config'
import { useCampaignsWithFilter } from '@/lib/graphql-hooks/campaign'
import { useGetOrgUserList } from '@/lib/graphql-hooks/member'
import { type VisibilityState } from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import { type TAccessRole, type TPermissionData } from '@/types/authz'
import { useNotification } from '@/hooks/useNotification'
import { TableKeyEnum } from '@repo/ui/table-key'

type TCampaignsTableProps = {
  onSortChange?: (sortCondition: CampaignOrder[] | CampaignOrder | undefined) => void
  pagination: TPagination
  onPaginationChange: (pagination: TPagination) => void
  whereFilter: CampaignWhereInput | null
  orderByFilter: CampaignOrder[] | CampaignOrder | undefined
  columnVisibility?: VisibilityState
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>
  onHasCampaignsChange?: (hasCampaigns: boolean) => void
  selectedCampaigns: { id: string }[]
  setSelectedCampaigns: React.Dispatch<React.SetStateAction<{ id: string }[]>>
  canEdit: (accessRole: TAccessRole[] | undefined) => boolean
  permission: TPermissionData | undefined
  defaultSorting: { field: string; direction?: OrderDirection }[] | undefined
}

const CampaignsTable = ({
  onSortChange,
  pagination,
  onPaginationChange,
  whereFilter,
  orderByFilter,
  columnVisibility,
  setColumnVisibility,
  onHasCampaignsChange,
  selectedCampaigns,
  setSelectedCampaigns,
  canEdit,
  permission,
  defaultSorting,
}: TCampaignsTableProps) => {
  const router = useRouter()
  const { CampaignsNodes: campaigns, isLoading: fetching, data, isFetching, isError } = useCampaignsWithFilter({ where: whereFilter, orderBy: orderByFilter, pagination, enabled: !!whereFilter })

  const { errorNotification } = useNotification()

  const userIds = useMemo(() => {
    if (!campaigns) return []
    const ids = new Set<string>()
    campaigns.forEach((campaign) => {
      if (campaign.createdBy) ids.add(campaign.createdBy)
      if (campaign.updatedBy) ids.add(campaign.updatedBy)
    })
    return Array.from(ids)
  }, [campaigns])

  const hasCampaigns = useMemo(() => {
    return campaigns && campaigns.length > 0
  }, [campaigns])

  useEffect(() => {
    if (onHasCampaignsChange) {
      onHasCampaignsChange(hasCampaigns)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCampaigns])

  useEffect(() => {
    if (permission?.roles) {
      setColumnVisibility((prev) => ({
        ...prev,
        select: canEdit(permission.roles),
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permission?.roles])

  useEffect(() => {
    if (isError) {
      errorNotification({
        title: 'Error',
        description: 'Failed to load campaigns',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isError])

  const { users, isFetching: fetchingUsers } = useGetOrgUserList({
    where: { hasUserWith: [{ idIn: userIds }] },
  })

  const userMap = useMemo(() => {
    const map: Record<string, (typeof users)[0]> = {}
    users?.forEach((u) => {
      map[u.id] = u
    })
    return map
  }, [users])

  const columns = useMemo(() => getCampaignColumns({ userMap, selectedCampaigns, setSelectedCampaigns }), [userMap, selectedCampaigns, setSelectedCampaigns])

  return (
    <DataTable
      columns={columns}
      sortFields={CAMPAIGN_SORT_FIELDS}
      onSortChange={onSortChange}
      data={campaigns}
      loading={fetching || fetchingUsers}
      defaultSorting={defaultSorting}
      onRowClick={(campaign) => {
        router.push(`/automation/campaigns/${campaign.id}`)
      }}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      paginationMeta={{
        totalCount: data?.campaigns.totalCount,
        pageInfo: data?.campaigns?.pageInfo,
        isLoading: isFetching,
      }}
      columnVisibility={columnVisibility}
      setColumnVisibility={setColumnVisibility}
      tableKey={TableKeyEnum.CAMPAIGN}
    />
  )
}

export default CampaignsTable
