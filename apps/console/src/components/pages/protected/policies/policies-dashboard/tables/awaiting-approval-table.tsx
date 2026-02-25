'use client'

import React, { useMemo, useState } from 'react'
import { DataTable, getInitialPagination } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/table-core'
import { Avatar } from '@/components/shared/avatar/avatar'
import { useInternalPolicies } from '@/lib/graphql-hooks/internal-policy'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { TPagination } from '@repo/ui/pagination-types'
import { formatDate } from '@/utils/date'
import { Group, InternalPolicyDocumentStatus, InternalPolicyWhereInput } from '@repo/codegen/src/schema'
import { wherePoliciesDashboard } from '../dashboard-config'
import { Button } from '@repo/ui/button'
import Link from 'next/link'
import { TableKeyEnum } from '@repo/ui/table-key'

type FormattedPolicy = {
  id: string
  name: string
  createdAt?: string
  approver?: Group | null
}

const columns: ColumnDef<FormattedPolicy>[] = [
  {
    header: 'Submitted',
    accessorKey: 'createdAt',
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    header: 'Name',
    accessorKey: 'name',
  },
  {
    header: 'Approver',
    accessorKey: 'approver',
    cell: ({ row }) => {
      const approver = row.original.approver
      return (
        <div className="flex items-center gap-2">
          <Avatar entity={approver as Group} />
          {approver?.displayName || '-'}
        </div>
      )
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <Link href={`/policies/${row.original.id}/view`}>
        <Button className="flex justify-self-end" variant="outline">
          Review
        </Button>
      </Link>
    ),
  },
]

export default function AwaitingApprovalTable() {
  const [pagination, setPagination] = useState<TPagination>(
    getInitialPagination(TableKeyEnum.POLICY_AWAITING_APPROVAL, {
      ...DEFAULT_PAGINATION,
      pageSize: 5,
    }),
  )

  const where: InternalPolicyWhereInput = {
    ...wherePoliciesDashboard,
    status: InternalPolicyDocumentStatus.NEEDS_APPROVAL,
  }

  const { data, policies, isLoading, isFetching } = useInternalPolicies({
    where,
    pagination,
  })

  const formattedPolicies: FormattedPolicy[] = useMemo(() => {
    return policies.map((policy) => ({
      id: policy.id,
      name: policy.name,
      createdAt: policy.createdAt,
      approver: policy.approver as Group,
    }))
  }, [policies])

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Awaiting Approval</h2>

      <DataTable
        columns={columns}
        data={formattedPolicies}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={{
          totalCount: data?.internalPolicies.totalCount,
          pageInfo: data?.internalPolicies.pageInfo,
          isLoading: isFetching,
        }}
        loading={isLoading}
        tableKey={TableKeyEnum.POLICY_AWAITING_APPROVAL}
      />
    </div>
  )
}
