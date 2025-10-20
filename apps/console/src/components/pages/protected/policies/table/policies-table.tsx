'use client'

import { useRouter } from 'next/navigation'
import { DataTable } from '@repo/ui/data-table'
import React, { useState, useMemo, useEffect, useContext } from 'react'
import {
  ExportExportFormat,
  ExportExportType,
  GetInternalPoliciesListQueryVariables,
  InternalPolicy,
  InternalPolicyDocumentStatus,
  InternalPolicyOrderField,
  InternalPolicyWhereInput,
  OrderDirection,
} from '@repo/codegen/src/schema'
import PoliciesTableToolbar from '@/components/pages/protected/policies/table/policies-table-toolbar.tsx'
import { INTERNAL_POLICIES_SORTABLE_FIELDS } from '@/components/pages/protected/policies/table/table-config.ts'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useDebounce } from '@uidotdev/usehooks'
import { useInternalPolicies } from '@/lib/graphql-hooks/policy'
import { useGetOrgUserList } from '@/lib/graphql-hooks/members.ts'
import { getPoliciesColumns } from '@/components/pages/protected/policies/table/columns.tsx'
import { useGetApiTokensByIds } from '@/lib/graphql-hooks/tokens.ts'
import { ColumnDef, VisibilityState } from '@tanstack/react-table'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { canEdit } from '@/lib/authz/utils.ts'
import useFileExport from '@/components/shared/export/use-file-export.ts'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { useNotification } from '@/hooks/useNotification'

export const PoliciesTable = () => {
  const router = useRouter()
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [filters, setFilters] = useState<InternalPolicyWhereInput | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const { setCrumbs } = useContext(BreadcrumbContext)
  const { data: permission } = useOrganizationRoles()
  const { handleExport } = useFileExport()

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

    // Only apply the default archived filter if no status filter is explicitly set
    if (!filters?.status && !filters?.statusIn && !filters?.statusNotIn && !filters?.statusNEQ) {
      conditions.statusNotIn = [InternalPolicyDocumentStatus.ARCHIVED]
    }

    return conditions
  }, [filters, debouncedSearch])

  const orderByFilter = useMemo(() => {
    return orderBy || undefined
  }, [orderBy])

  const { policies, isError, isLoading: fetching, paginationMeta } = useInternalPolicies({ where, orderBy: orderByFilter, pagination, enabled: !!filters })

  const memberIds = useMemo(() => {
    if (!policies || policies.length === 0) {
      return []
    }

    return [...new Set(policies.map((item) => item.updatedBy).filter(Boolean))]
  }, [policies])

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
  const { users } = useGetOrgUserList({ where: userListWhere })
  const { tokens } = useGetApiTokensByIds({ where: tokensWhere })
  const [selectedPolicies, setSelectedPolicies] = useState<{ id: string }[]>([])
  const { errorNotification } = useNotification()
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    approvalRequired: false,
    approver: false,
    delegate: false,
    policyType: false,
    reviewDue: false,
    reviewFrequency: false,
    revision: false,
    status: true,
    tags: false,
    createdAt: false,
    createdBy: false,
  })

  const { columns, mappedColumns } = useMemo(() => getPoliciesColumns({ users, tokens, selectedPolicies, setSelectedPolicies }), [users, tokens, selectedPolicies])

  const handleCreateNew = async () => {
    router.push(`/policies/create`)
  }

  const handleRowClick = (rowData: InternalPolicy) => {
    router.push(`/policies/${rowData.id}/view`)
  }

  function isVisibleColumn<T>(col: ColumnDef<T>): col is ColumnDef<T> & { accessorKey: string; header: string } {
    return 'accessorKey' in col && typeof col.accessorKey === 'string' && typeof col.header === 'string' && columnVisibility[col.accessorKey] !== false
  }

  const handleExportFile = async () => {
    if (!policies || policies.length === 0) {
      return
    }

    handleExport({
      exportType: ExportExportType.INTERNAL_POLICY,
      filters: JSON.stringify(where),
      fields: columns.filter(isVisibleColumn).map((item) => item.accessorKey),
      format: ExportExportFormat.CSV,
    })
  }

  useEffect(() => {
    if (isError) {
      errorNotification({
        title: 'Error',
        description: 'Failed to load policies',
      })
    }
  }, [isError, errorNotification])

  useEffect(() => {
    if (permission?.roles) {
      setColumnVisibility((prev) => ({
        ...prev,
        select: canEdit(permission.roles),
      }))
    }
  }, [permission?.roles])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Policies', href: '/policies' },
    ])
  }, [setCrumbs])

  const handleBulkEdit = () => {
    setSelectedPolicies([])
  }

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
        handleExport={handleExportFile}
        mappedColumns={mappedColumns}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        exportEnabled={policies && policies.length > 0}
        handleBulkEdit={handleBulkEdit}
        selectedPolicies={selectedPolicies}
        setSelectedPolicies={setSelectedPolicies}
        canEdit={canEdit}
        permission={permission}
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
