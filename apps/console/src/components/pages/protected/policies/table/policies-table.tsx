'use client'

import { useRouter } from 'next/navigation'
import { DataTable } from '@repo/ui/data-table'
import React, { useState, useEffect, useMemo } from 'react'
import { useCreateInternalPolicy, useGetInternalPoliciesList, useSearchInternalPolicies } from '@/lib/graphql-hooks/policy'
import { useDebounce } from '@uidotdev/usehooks'
import { GetInternalPoliciesListQueryVariables, InternalPolicyOrderField, OrderDirection } from '@repo/codegen/src/schema'
import { Policies, policiesColumns } from '@/components/pages/protected/policies/table/columns.tsx'
import PoliciesTableToolbar from '@/components/pages/protected/policies/table/policies-table-toolbar.tsx'
import { INTERNAL_POLICIES_SORTABLE_FIELDS } from '@/components/pages/protected/policies/table/table-config.ts'

export const PoliciesTable = () => {
  const router = useRouter()

  const [filteredPolicies, setFilteredPolicies] = useState<Policies[]>([])
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

  const { data, isLoading: fetching } = useGetInternalPoliciesList(whereFilter, orderByFilter)

  const { isPending: creating, mutateAsync: createPolicy } = useCreateInternalPolicy()

  const [searchTerm, setSearchTerm] = useState('')

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const { data: searchData, isLoading: searching } = useSearchInternalPolicies(debouncedSearchTerm)

  useEffect(() => {
    if (data && !searchTerm) {
      const policies = data?.internalPolicies?.edges?.map((e) => e?.node)
      if (policies) {
        setFilteredPolicies(policies)
      }
    }
  }, [data, searchTerm])

  useEffect(() => {
    if (searchTerm && searchData) {
      setFilteredPolicies(searchData?.internalPolicySearch?.internalPolicies || [])
      return
    }

    const policies = data?.internalPolicies?.edges?.map((e) => e?.node)
    if (policies) {
      setFilteredPolicies(policies)
    }
  }, [searchData])

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
      <PoliciesTableToolbar
        className="my-5"
        creating={creating}
        searching={searching}
        handleCreateNew={handleCreateNew}
        setFilters={setFilters}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <DataTable sortFields={INTERNAL_POLICIES_SORTABLE_FIELDS} onSortChange={setOrderBy} columns={policiesColumns} data={filteredPolicies} loading={fetching} />
    </>
  )
}
