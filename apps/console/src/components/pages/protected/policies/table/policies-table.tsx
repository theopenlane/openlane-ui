'use client'

import { useRouter } from 'next/navigation'
import { DataTable } from '@repo/ui/data-table'
import React, { useState, useMemo } from 'react'
import { useFilteredInternalPolicies } from '@/lib/graphql-hooks/policy'
import { GetInternalPoliciesListQueryVariables, InternalPolicyOrderField, OrderDirection } from '@repo/codegen/src/schema'
import { policiesColumns } from '@/components/pages/protected/policies/table/columns.tsx'
import PoliciesTableToolbar from '@/components/pages/protected/policies/table/policies-table-toolbar.tsx'
import { INTERNAL_POLICIES_SORTABLE_FIELDS } from '@/components/pages/protected/policies/table/table-config.ts'

export const PoliciesTable = () => {
  const router = useRouter()

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

  const [searchTerm, setSearchTerm] = useState('')
  const { policies, isLoading: fetching } = useFilteredInternalPolicies(searchTerm, whereFilter, orderByFilter)

  const handleCreateNew = async () => {
    router.push(`/policies/create`)
  }

  return (
    <>
      <PoliciesTableToolbar className="my-5" searching={fetching} handleCreateNew={handleCreateNew} setFilters={setFilters} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      <DataTable sortFields={INTERNAL_POLICIES_SORTABLE_FIELDS} onSortChange={setOrderBy} columns={policiesColumns} data={policies} loading={fetching} />
    </>
  )
}
