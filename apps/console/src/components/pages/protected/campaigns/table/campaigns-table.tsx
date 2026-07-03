'use client'

import { DataTable } from '@repo/ui/data-table'
import React, { useEffect, useMemo } from 'react'
import { type CampaignOrder, type CampaignWhereInput, type OrderDirection } from '@repo/codegen/src/schema'
import { type TPagination } from '@repo/ui/pagination-types'
import { getCampaignColumns } from '@/components/pages/protected/campaigns/table/columns'
import { CAMPAIGN_SORT_FIELDS } from '@/components/pages/protected/campaigns/table/table-config'
import { useCampaignsWithFilter } from '@/lib/graphql-hooks/campaign'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { type VisibilityState } from '@tanstack/react-table'

import { type TAccessRole, type TPermissionData } from '@/types/authz'
import { useNotification } from '@/hooks/useNotification'
import { TableKeyEnum } from '@repo/ui/table-key'
import { useSession } from 'next-auth/react'
import { type Session } from 'next-auth'

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
  canEdit: (accessRole: TAccessRole[] | undefined, session?: Session | null) => boolean
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
  const { CampaignsNodes: campaigns, isLoading: fetching, data, isFetching, isError } = useCampaignsWithFilter({ where: whereFilter, orderBy: orderByFilter, pagination, enabled: !!whereFilter })

  const { data: session } = useSession()
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
  }, [hasCampaigns, onHasCampaignsChange])

  useEffect(() => {
    if (permission?.roles) {
      setColumnVisibility((prev) => ({
        ...prev,
        select: canEdit(permission.roles, session),
      }))
    }
  }, [permission?.roles, session, canEdit, setColumnVisibility])

  useEffect(() => {
    if (isError) {
      errorNotification({
        title: 'Error',
        description: 'Failed to load campaigns',
      })
    }
  }, [isError, errorNotification])

  const { userMap, tokenMap, isLoading: fetchingUsers } = useAuthorMaps(userIds)

  const columns = useMemo(() => getCampaignColumns({ userMap, tokenMap, selectedCampaigns, setSelectedCampaigns }), [userMap, tokenMap, selectedCampaigns, setSelectedCampaigns])

  return (
    <DataTable
      columns={columns}
      sortFields={CAMPAIGN_SORT_FIELDS}
      onSortChange={onSortChange}
      data={campaigns}
      loading={fetching || fetchingUsers}
      defaultSorting={defaultSorting}
      rowHref={(campaign) => `/automation/campaigns/${campaign.id}`}
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
