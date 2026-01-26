'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '@repo/ui/button'
import { DataTable, getInitialPagination } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/table-core'
import { useGetInternalPolicyAssociationsById, useGetInternalPolicyDetailsById, useInternalPolicies } from '@/lib/graphql-hooks/policy'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { TPagination } from '@repo/ui/pagination-types'
import { formatDate } from '@/utils/date'
import { InternalPolicyWhereInput } from '@repo/codegen/src/schema'
import { wherePoliciesDashboard } from '../dashboard-config'
import SetObjectAssociationPoliciesDialog from '../../modal/set-object-association-modal'
import { usePolicy } from '../../create/hooks/use-policy'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap'
import Link from 'next/link'
import { TableKeyEnum } from '@repo/ui/table-key'

type FormattedPolicy = {
  id: string
  name: string
  createdAt?: string
  updatedAt?: string
}

export default function PoliciesWithoutProceduresTable() {
  const [pagination, setPagination] = useState<TPagination>(
    getInitialPagination(TableKeyEnum.POLICY_WITHOUT_PROCEDURE, {
      ...DEFAULT_PAGINATION,
      pageSize: 5,
    }),
  )
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null)

  const setAssociations = usePolicy((state) => state.setAssociations)
  const setAssociationRefCodes = usePolicy((state) => state.setAssociationRefCodes)

  const { data: policyData } = useGetInternalPolicyDetailsById(selectedPolicyId)
  const { data: assocData } = useGetInternalPolicyAssociationsById(selectedPolicyId)

  const policy = policyData?.internalPolicy

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

  useEffect(() => {
    if (policy && assocData) {
      const policyAssociations: TObjectAssociationMap = {
        controlIDs: (assocData?.internalPolicy.controls?.edges?.map((item) => item?.node?.id).filter(Boolean) as string[]) || [],
        procedureIDs: (assocData?.internalPolicy.procedures?.edges?.map((item) => item?.node?.id).filter(Boolean) as string[]) || [],
        programIDs: (assocData?.internalPolicy.programs?.edges?.map((item) => item?.node?.id).filter(Boolean) as string[]) || [],
        controlObjectiveIDs: (assocData?.internalPolicy.controlObjectives?.edges?.map((item) => item?.node?.id).filter(Boolean) as string[]) || [],
        taskIDs: (assocData?.internalPolicy.tasks?.edges?.map((item) => item?.node?.id).filter(Boolean) as string[]) || [],
      }

      const policyAssociationsRefCodes: TObjectAssociationMap = {
        controlIDs: (assocData?.internalPolicy.controls?.edges?.map((item) => item?.node?.refCode).filter(Boolean) as string[]) || [],
        procedureIDs: (assocData?.internalPolicy.procedures?.edges?.map((item) => item?.node?.displayID).filter(Boolean) as string[]) || [],
        programIDs: (assocData?.internalPolicy.programs?.edges?.map((item) => item?.node?.displayID).filter(Boolean) as string[]) || [],
        controlObjectiveIDs: (assocData?.internalPolicy.controlObjectives?.edges?.map((item) => item?.node?.displayID).filter(Boolean) as string[]) || [],
        taskIDs: (assocData?.internalPolicy.tasks?.edges?.map((item) => item?.node?.displayID).filter(Boolean) as string[]) || [],
      }

      setAssociations(policyAssociations)
      setAssociationRefCodes(policyAssociationsRefCodes)
    }
  }, [policy, setAssociations, setAssociationRefCodes, assocData])

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

      {selectedPolicyId && <SetObjectAssociationPoliciesDialog fromTable policyId={selectedPolicyId} key={selectedPolicyId} onClose={() => setSelectedPolicyId(null)} />}
    </div>
  )
}
