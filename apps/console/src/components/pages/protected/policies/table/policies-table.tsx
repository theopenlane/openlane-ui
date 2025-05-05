'use client'

import { useRouter } from 'next/navigation'
import { DataTable } from '@repo/ui/data-table'
import React, { useState, useMemo } from 'react'
import { GetInternalPoliciesListQueryVariables, InternalPolicy, InternalPolicyOrderField, OrderDirection } from '@repo/codegen/src/schema'
import { policiesColumns } from '@/components/pages/protected/policies/table/columns.tsx'
import PoliciesTableToolbar from '@/components/pages/protected/policies/table/policies-table-toolbar.tsx'
import { INTERNAL_POLICIES_SORTABLE_FIELDS } from '@/components/pages/protected/policies/table/table-config.ts'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useDebounce } from '@uidotdev/usehooks'
import { useInternalPolicies } from '@/lib/graphql-hooks/policy'
import { exportToCSV } from '@/utils/exportToCSV'
import { ColumnDef } from '@tanstack/react-table'
import { formatDateTime } from '@/utils/date'

export const PoliciesTable = () => {
  const router = useRouter()
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [filters, setFilters] = useState<Record<string, any> | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [orderBy, setOrderBy] = useState<GetInternalPoliciesListQueryVariables['orderBy']>([
    {
      field: InternalPolicyOrderField.name,
      direction: OrderDirection.DESC,
    },
  ])
  const debouncedSearch = useDebounce(searchTerm, 300)

  const where = useMemo(() => {
    const conditions: Record<string, any> = {
      ...filters,
      nameContainsFold: debouncedSearch,
    }

    return conditions
  }, [filters, debouncedSearch])

  const orderByFilter = useMemo(() => {
    return orderBy || undefined
  }, [orderBy])

  const { policies, isLoading: fetching, paginationMeta } = useInternalPolicies({ where, orderBy: orderByFilter, pagination, enabled: !!filters })

  const handleCreateNew = async () => {
    router.push(`/policies/create`)
  }

  const handleRowClick = (rowData: InternalPolicy) => {
    router.push(`/policies/${rowData.id}/view`)
  }

  const handleExport = () => {
    const exportableColumns = policiesColumns
      .filter(
        (col): col is ColumnDef<InternalPolicy> & { accessorKey: string; header: string } =>
          'accessorKey' in col && typeof col.accessorKey === 'string' && typeof col.header === 'string' && col.accessorKey !== 'id', // ✅ skip the action column
      )
      .map((col) => {
        const key = col.accessorKey as keyof InternalPolicy
        const label = col.header

        return {
          label,
          accessor: (policy: InternalPolicy) => {
            const value = policy[key]

            if (key === 'updatedAt' || key === 'createdAt') {
              return formatDateTime(value as string)
            }

            if (key === 'summary') {
              return (value as string) ?? ''
            }

            return typeof value === 'string' || typeof value === 'number' ? value : ''
          },
        }
      })

    exportToCSV(policies, exportableColumns, 'internal_policies')
  }

  return (
    <>
      <PoliciesTableToolbar
        className="my-5"
        searching={fetching}
        handleCreateNew={handleCreateNew}
        setFilters={setFilters}
        searchTerm={searchTerm}
        setSearchTerm={(inputVal) => {
          setSearchTerm(inputVal)
          setPagination(DEFAULT_PAGINATION)
        }}
        handleExport={handleExport}
      />

      <DataTable
        sortFields={INTERNAL_POLICIES_SORTABLE_FIELDS}
        onSortChange={setOrderBy}
        columns={policiesColumns}
        data={policies}
        onRowClick={handleRowClick}
        loading={fetching}
        pagination={pagination}
        onPaginationChange={(pagination: TPagination) => setPagination(pagination)}
        paginationMeta={paginationMeta}
      />
    </>
  )
}
