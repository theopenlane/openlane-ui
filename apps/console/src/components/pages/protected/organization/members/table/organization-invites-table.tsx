'use client'

import { GetInvitesQueryVariables, InviteInviteStatus, InviteOrderField, InviteRole, OrderDirection, TaskOrderField } from '@repo/codegen/src/schema'
import { DataTable } from '@repo/ui/data-table'
import { useGetInvites } from '@/lib/graphql-hooks/organization'
import { invitesColumns } from '@/components/pages/protected/organization/members/table/columns.tsx'
import OrganizationInvitesTableToolbar from '@/components/pages/protected/organization/members/table/organization-invites-table-toolbar.tsx'
import { useMemo, useState } from 'react'

type InviteNode = {
  __typename?: 'Invite' | undefined
  id: string
  recipient: string
  status: InviteInviteStatus
  createdAt?: any
  role: InviteRole
  sendAttempts?: number
}

export const OrganizationInvitesTable = () => {
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [orderBy, setOrderBy] = useState<GetInvitesQueryVariables['orderBy']>([
    {
      field: InviteOrderField.created_at,
      direction: OrderDirection.ASC,
    },
  ])

  const whereFilter = useMemo(() => {
    const conditions: Record<string, any> = {
      ...filters,
    }

    return conditions
  }, [filters])

  const orderByFilter = useMemo(() => {
    return orderBy || undefined
  }, [orderBy])

  const { data, isLoading, isError } = useGetInvites(whereFilter, orderByFilter)

  if (isLoading) return <p>Loading...</p>
  if (isError || !data) return null

  const invites: InviteNode[] = data.invites.edges?.filter((edge) => edge !== null && edge.node !== null).map((edge) => edge?.node as InviteNode) || []

  return (
    <>
      <OrganizationInvitesTableToolbar onFilterChange={setFilters} onSortChange={setOrderBy} />
      <DataTable columns={invitesColumns} data={invites} noResultsText="No invites found" />
    </>
  )
}
