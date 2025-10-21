'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/table-core'
import { Avatar } from '@/components/shared/avatar/avatar'
import { useInternalPolicies } from '@/lib/graphql-hooks/policy'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { TPagination } from '@repo/ui/pagination-types'
import { formatDate } from '@/utils/date'
import { addDays } from 'date-fns'
import { InternalPolicyWhereInput, InternalPolicyOrderField, OrderDirection, Organization, GetInternalPoliciesListQueryVariables } from '@repo/codegen/src/schema'
import { wherePoliciesDashboard } from '../dashboard-config'

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
    cell: ({ row }) => {
      const policy = row.original
      return (
        <div>
          <Link href={`/policies?id=${policy.id}`} className="text-blue-500 hover:underline">
            {policy.name}
          </Link>
          {policy.tags && policy.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {policy.tags.map((tag) => (
                <span key={tag} className="bg-muted text-xs px-2 py-0.5 rounded-md text-muted-foreground border border-border">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )
    },
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
]

export default function ReviewDueSoonTable() {
  const [pagination, setPagination] = useState<TPagination>({ ...DEFAULT_PAGINATION, pageSize: 5 })

  const where: InternalPolicyWhereInput = {
    ...wherePoliciesDashboard,
    reviewDueLTE: dueSoonLimit.toISOString(),
  }

  const [orderBy, setOrderBy] = useState<GetInternalPoliciesListQueryVariables['orderBy']>([
    {
      field: InternalPolicyOrderField.review_due,
      direction: OrderDirection.ASC,
    },
  ])

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
      />
    </div>
  )
}
