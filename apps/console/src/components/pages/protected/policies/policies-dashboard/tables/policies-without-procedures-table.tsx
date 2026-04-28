'use client'

import React, { useMemo, useState } from 'react'
import { Button } from '@repo/ui/button'
import { DataTable, getInitialPagination } from '@repo/ui/data-table'
import { type ColumnDef } from '@tanstack/table-core'
import { useInternalPolicies } from '@/lib/graphql-hooks/internal-policy'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { type TPagination } from '@repo/ui/pagination-types'
import { formatDate } from '@/utils/date'
import { type InternalPolicyWhereInput } from '@repo/codegen/src/schema'
import { wherePoliciesDashboard } from '../dashboard-config'
import { SetPolicyAssociationDialog } from '@/components/pages/protected/policies/set-policy-association-dialog'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import Link from 'next/link'
import { TableKeyEnum } from '@repo/ui/table-key'

type FormattedPolicy = {
  id: string
  name: string
  createdAt?: string
  updatedAt?: string
}

export default function PoliciesWithoutProceduresTable() {
  const [pagination, setPagination] = useState<TPagination>(() =>
    getInitialPagination(TableKeyEnum.POLICY_WITHOUT_PROCEDURE, {
      ...DEFAULT_PAGINATION,
      pageSize: 5,
    }),
  )
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null)

  const where: InternalPolicyWhereInput = {
    ...wherePoliciesDashboard,
    hasProcedures: false,
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
      updatedAt: policy.updatedAt,
    }))
  }, [policies])

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
      header: 'Last Updated',
      accessorKey: 'updatedAt',
      cell: ({ row }) => formatDate(row.original.updatedAt),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-self-end gap-1">
          <Button className="flex" variant="outline" onClick={() => setSelectedPolicyId(row.original.id)}>
            Link procedures
          </Button>
          <Link href={`/procedures/create?policyId=${row.original.id}`}>
            <Button className="flex" variant="outline">
              Create Procedure
            </Button>
          </Link>
        </div>
      ),
    },
  ]

  return (
    <div className="py-6 rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Policies without procedures</h2>

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
        tableKey={TableKeyEnum.POLICY_WITHOUT_PROCEDURE}
      />

      {selectedPolicyId && (
        <SetPolicyAssociationDialog
          key={selectedPolicyId}
          policyId={selectedPolicyId}
          defaultSelectedObject={ObjectTypeObjects.PROCEDURE}
          allowedObjectTypes={[ObjectTypeObjects.PROCEDURE]}
          open={true}
          onOpenChange={(isOpen) => {
            if (!isOpen) setSelectedPolicyId(null)
          }}
        />
      )}
    </div>
  )
}
