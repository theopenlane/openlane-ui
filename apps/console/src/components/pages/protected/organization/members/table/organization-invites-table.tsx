'use client'

import { GetInvitesQueryVariables, InviteInviteStatus, InviteOrderField, InviteRole, InviteWhereInput, OrderDirection } from '@repo/codegen/src/schema'
import { DataTable } from '@repo/ui/data-table'
import { useGetInvites } from '@/lib/graphql-hooks/organization'
import { invitesColumns } from '@/components/pages/protected/organization/members/table/columns.tsx'
import OrganizationInvitesTableToolbar from '@/components/pages/protected/organization/members/table/organization-invites-table-toolbar.tsx'
import { useMemo, useState } from 'react'
import { INVITES_SORT_FIELDS } from '@/components/pages/protected/organization/members/table/table-config.ts'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'

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
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)

  const [orderBy, setOrderBy] = useState<GetInvitesQueryVariables['orderBy']>([
    {
      field: InviteOrderField.created_at,
      direction: OrderDirection.DESC,
    },
  ])

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
        onSortChange={setOrderBy}
        columns={invitesColumns}
        data={invites}
        pagination={pagination}
        onPaginationChange={(pagination: TPagination) => setPagination(pagination)}
        paginationMeta={{ totalCount: data?.invites.totalCount, pageInfo: data?.invites?.pageInfo, isLoading: isFetching }}
      />
    </>
  )
}
