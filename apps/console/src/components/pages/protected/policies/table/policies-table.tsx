'use client'

import { useRouter } from 'next/navigation'
import { DataTable } from '@repo/ui/data-table'
import React, { useState, useMemo } from 'react'
import { useCreateInternalPolicy, useFilteredInternalPolicies } from '@/lib/graphql-hooks/policy'
import { GetInternalPoliciesListQueryVariables, InternalPolicyOrderField, OrderDirection } from '@repo/codegen/src/schema'
import { policiesColumns } from '@/components/pages/protected/policies/table/columns.tsx'
import PoliciesTableToolbar from '@/components/pages/protected/policies/table/policies-table-toolbar.tsx'
import { INTERNAL_POLICIES_SORTABLE_FIELDS } from '@/components/pages/protected/policies/table/table-config.ts'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'

export const PoliciesTable = () => {
  const router = useRouter()
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [orderBy, setOrderBy] = useState<GetInternalPoliciesListQueryVariables['orderBy']>([
    {
      field: InternalPolicyOrderField.name,
      direction: OrderDirection.DESC,
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

  const { isPending: creating, mutateAsync: createPolicy } = useCreateInternalPolicy()
  const [searchTerm, setSearchTerm] = useState('')
  const { policies, isLoading: fetching, isFetching, data } = useFilteredInternalPolicies({ where: whereFilter, search: searchTerm, orderBy: orderByFilter, pagination })

  const handleCreateNew = async () => {
    const data = await createPolicy({
      input: { name: 'Untitled Policy' },
    })

    if (data.createInternalPolicy) {
      editPolicy(data.createInternalPolicy.internalPolicy.id)
      return
    }

    if (data.createInternalPolicy) {
      //TODO: add error toast
    }
  }

  const editPolicy = (policyId: string) => {
    router.push(`/policies/${policyId}/edit`)
  }

  return (
    <>
      <PoliciesTableToolbar className="my-5" creating={creating} searching={fetching} handleCreateNew={handleCreateNew} setFilters={setFilters} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      <DataTable
        sortFields={INTERNAL_POLICIES_SORTABLE_FIELDS}
        onSortChange={setOrderBy}
        columns={policiesColumns}
        data={policies}
        loading={fetching}
        pagination={pagination}
        onPaginationChange={(pagination: TPagination) => setPagination(pagination)}
        // paginationMeta={{ totalCount: data. , pageInfo: data?.tasks?.pageInfo, isLoading: isFetching }}
      />
    </>
  )
}
