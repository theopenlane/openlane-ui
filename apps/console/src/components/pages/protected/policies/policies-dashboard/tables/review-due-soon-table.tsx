'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { DataTable, getInitialSortConditions, getInitialPagination } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/table-core'
import { Avatar } from '@/components/shared/avatar/avatar'
import { useInternalPolicies } from '@/lib/graphql-hooks/policy'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { TPagination } from '@repo/ui/pagination-types'
import { formatDate } from '@/utils/date'
import { addDays } from 'date-fns'
import { GetInternalPoliciesListQueryVariables, InternalPolicyOrderField, InternalPolicyWhereInput, OrderDirection, Organization } from '@repo/codegen/src/schema'
import { wherePoliciesDashboard } from '../dashboard-config'
import { Button } from '@repo/ui/button'
import { TableKeyEnum } from '@repo/ui/table-key'

const now = new Date()
const dueSoonLimit = addDays(now, 7)

type FormattedPolicy = {
  id: string
  name: string
  reviewDue?: string
  updatedAt?: string
  owner?: Organization | null
  tags?: string[] | null
}

const columns: ColumnDef<FormattedPolicy>[] = [
  {
    header: 'Name',
    accessorKey: 'name',
  },

  {
    header: 'Next review date',
    accessorKey: 'reviewDue',
    cell: ({ row }) => formatDate(row.original.reviewDue),
  },
  {
    header: 'Last review date',
    accessorKey: 'updatedAt',
    cell: ({ row }) => formatDate(row.original.updatedAt),
  },
  {
    header: 'Owner',
    accessorKey: 'owner',
    cell: ({ row }) => {
      const owner = row.original.owner
      return owner ? (
        <div className="flex items-center gap-2">
          <Avatar entity={owner as Organization} />
          {owner.displayName}
        </div>
      ) : (
        '—'
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

export default function ReviewDueSoonTable() {
  const [pagination, setPagination] = useState<TPagination>(
    getInitialPagination(TableKeyEnum.POLICIES_REVIEW_DUE_SOON, {
      ...DEFAULT_PAGINATION,
      pageSize: 5,
    }),
  )

  const where: InternalPolicyWhereInput = {
    ...wherePoliciesDashboard,
    reviewDueLTE: dueSoonLimit.toISOString(),
  }

  const defaultSorting = getInitialSortConditions(TableKeyEnum.POLICIES_REVIEW_DUE_SOON, InternalPolicyOrderField, [
    {
      field: InternalPolicyOrderField.review_due,
      direction: OrderDirection.ASC,
    },
  ])

  const [orderBy, setOrderBy] = useState<GetInternalPoliciesListQueryVariables['orderBy']>(defaultSorting)

  const { data, policies, isLoading, isFetching } = useInternalPolicies({
    where,
    pagination,
    orderBy,
  })

  const formattedPolicies: FormattedPolicy[] = useMemo(() => {
    return policies.map((policy) => ({
      id: policy.id,
      name: policy.name,
      reviewDue: policy.reviewDue,
      updatedAt: policy.updatedAt,
      owner: policy.owner,
      tags: policy.tags,
    }))
  }, [policies])

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Review due soon</h2>

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
        onSortChange={setOrderBy}
        defaultSorting={defaultSorting}
        tableKey={TableKeyEnum.POLICIES_REVIEW_DUE_SOON}
      />
    </div>
  )
}
