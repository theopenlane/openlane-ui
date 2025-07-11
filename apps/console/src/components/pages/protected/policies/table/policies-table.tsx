'use client'

import { useRouter } from 'next/navigation'
import { DataTable } from '@repo/ui/data-table'
import React, { useState, useMemo, useEffect, useContext } from 'react'
import { GetInternalPoliciesListQueryVariables, InternalPolicy, InternalPolicyOrderField, InternalPolicyWhereInput, Maybe, OrderDirection } from '@repo/codegen/src/schema'
import PoliciesTableToolbar from '@/components/pages/protected/policies/table/policies-table-toolbar.tsx'
import { INTERNAL_POLICIES_SORTABLE_FIELDS } from '@/components/pages/protected/policies/table/table-config.ts'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useDebounce } from '@uidotdev/usehooks'
import { useInternalPolicies } from '@/lib/graphql-hooks/policy'
import { exportToCSV } from '@/utils/exportToCSV'
import { ColumnDef } from '@tanstack/react-table'
import { formatDateTime } from '@/utils/date'
import { useGetOrgUserList } from '@/lib/graphql-hooks/members.ts'
import { getPoliciesColumns } from '@/components/pages/protected/policies/table/columns.tsx'
import { useGetApiTokensByIds } from '@/lib/graphql-hooks/tokens.ts'
import { VisibilityState } from '@tanstack/react-table'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

export const PoliciesTable = () => {
  const router = useRouter()
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [filters, setFilters] = useState<InternalPolicyWhereInput | null>(null)
  const [memberIds, setMemberIds] = useState<(Maybe<string> | undefined)[]>()
  const [searchTerm, setSearchTerm] = useState('')
  const { setCrumbs } = useContext(BreadcrumbContext)

  const [orderBy, setOrderBy] = useState<GetInternalPoliciesListQueryVariables['orderBy']>([
    {
      field: InternalPolicyOrderField.name,
      direction: OrderDirection.ASC,
    },
  ])
  const debouncedSearch = useDebounce(searchTerm, 300)

  const where = useMemo(() => {
    const conditions: InternalPolicyWhereInput = {
      ...filters,
      nameContainsFold: debouncedSearch,
    }

    return conditions
  }, [filters, debouncedSearch])

  const userListWhere = useMemo(() => {
    if (!memberIds) {
      return {}
    }

    const conditions = {
      hasUserWith: [{ idIn: memberIds }],
    }

    return conditions
  }, [memberIds])

  const tokensWhere = useMemo(() => {
    if (!memberIds) {
      return {}
    }

    const conditions = {
      idIn: memberIds,
    }

    return conditions
  }, [memberIds])

  const orderByFilter = useMemo(() => {
    return orderBy || undefined
  }, [orderBy])

  const { policies, isLoading: fetching, paginationMeta } = useInternalPolicies({ where, orderBy: orderByFilter, pagination, enabled: !!filters })
  const { users } = useGetOrgUserList({ where: userListWhere })
  const { tokens } = useGetApiTokensByIds({ where: tokensWhere })
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    approvalRequired: false,
    approver: false,
    delegate: false,
    policyType: false,
    reviewDue: false,
    reviewFrequency: false,
    revision: false,
    status: false,
    tags: false,
    createdAt: false,
    createdBy: false,
  })

  const { columns, mappedColumns } = getPoliciesColumns({ users, tokens })

  const handleCreateNew = async () => {
    router.push(`/policies/create`)
  }

  const handleRowClick = (rowData: InternalPolicy) => {
    router.push(`/policies/${rowData.id}/view`)
  }

  function isVisibleColumn<T>(col: ColumnDef<T>): col is ColumnDef<T> & { accessorKey: string; header: string } {
    return 'accessorKey' in col && typeof col.accessorKey === 'string' && typeof col.header === 'string' && columnVisibility[col.accessorKey] !== false
  }

  const handleExport = () => {
    if (!policies || policies.length === 0) return
    const exportableColumns = columns.filter(isVisibleColumn).map((col) => {
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

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Policies', href: '/policies' },
    ])
  }, [setCrumbs])

  useEffect(() => {
    if (!policies || policies.length === 0) {
      return
    }
    if (memberIds && memberIds.length > 0) {
      return
    }

    const userIds = [...new Set(policies.map((item) => item.updatedBy).filter(Boolean))]
    setMemberIds(userIds)
  }, [policies, memberIds])

  return (
    <>
      <PoliciesTableToolbar
        searching={fetching}
        handleCreateNew={handleCreateNew}
        setFilters={setFilters}
        searchTerm={searchTerm}
        setSearchTerm={(inputVal) => {
          setSearchTerm(inputVal)
          setPagination(DEFAULT_PAGINATION)
        }}
        handleExport={handleExport}
        mappedColumns={mappedColumns}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        exportEnabled={policies && policies.length > 0}
      />

      <DataTable
        sortFields={INTERNAL_POLICIES_SORTABLE_FIELDS}
        onSortChange={setOrderBy}
        columns={columns}
        data={policies}
        onRowClick={handleRowClick}
        loading={fetching}
        pagination={pagination}
        onPaginationChange={(pagination: TPagination) => setPagination(pagination)}
        paginationMeta={paginationMeta}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
      />
    </>
  )
}
