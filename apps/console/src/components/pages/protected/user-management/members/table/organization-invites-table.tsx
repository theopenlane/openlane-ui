'use client'

import { GetInvitesQueryVariables, InviteInviteStatus, InviteOrderField, InviteRole, InviteWhereInput, OrderDirection } from '@repo/codegen/src/schema'
import { DataTable, getInitialSortConditions, getInitialPagination } from '@repo/ui/data-table'
import { useGetInvites } from '@/lib/graphql-hooks/organization'
import { InvitesColumns } from '@/components/pages/protected/user-management/members/table/columns.tsx'
import OrganizationInvitesTableToolbar from '@/components/pages/protected/user-management/members/table/organization-invites-table-toolbar.tsx'
import { useMemo, useState } from 'react'
import { INVITES_SORT_FIELDS } from '@/components/pages/protected/user-management/members/table/table-config.ts'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { TableKeyEnum } from '@repo/ui/table-key'

type InviteNode = {
  __typename?: 'Invite' | undefined
  id: string
  recipient: string
  status: InviteInviteStatus
  createdAt?: string
  role: InviteRole
  sendAttempts?: number
}

export const OrganizationInvitesTable = () => {
  const [filters, setFilters] = useState<InviteWhereInput | null>(null)
  const [pagination, setPagination] = useState<TPagination>(getInitialPagination(TableKeyEnum.ORG_INVITE, DEFAULT_PAGINATION))
  const { columns } = InvitesColumns()
  const defaultSorting = getInitialSortConditions(TableKeyEnum.ORG_INVITE, InviteOrderField, [
    {
      field: InviteOrderField.created_at,
      direction: OrderDirection.DESC,
    },
  ])
  const [orderBy, setOrderBy] = useState<GetInvitesQueryVariables['orderBy']>(defaultSorting)

  const whereFilter = useMemo(() => {
    const conditions: InviteWhereInput = {
      ...filters,
    }

    return conditions
  }, [filters])

  const orderByFilter = useMemo(() => {
    return orderBy || undefined
  }, [orderBy])

  const { data, isLoading, isFetching } = useGetInvites({ where: whereFilter, orderBy: orderByFilter, pagination, enabled: !!filters })

  const invites: InviteNode[] = data?.invites.edges?.filter((edge) => edge !== null && edge.node !== null).map((edge) => edge?.node as InviteNode) || []

  return (
    <>
      <OrganizationInvitesTableToolbar onFilterChange={setFilters} />
      <DataTable
        loading={isLoading}
        sortFields={INVITES_SORT_FIELDS}
        defaultSorting={defaultSorting}
        onSortChange={setOrderBy}
        columns={columns}
        data={invites}
        pagination={pagination}
        onPaginationChange={(pagination: TPagination) => setPagination(pagination)}
        paginationMeta={{ totalCount: data?.invites.totalCount, pageInfo: data?.invites?.pageInfo, isLoading: isFetching }}
        tableKey={TableKeyEnum.ORG_INVITE}
      />
    </>
  )
}
