'use client'

import { useRouter } from 'next/navigation'
import { DataTable, getInitialSortConditions, getInitialPagination } from '@repo/ui/data-table'
import React, { useContext, useEffect, useMemo, useState } from 'react'
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
import { INTERNAL_POLICIES_SORT_FIELDS } from '@/components/pages/protected/policies/table/table-config.ts'
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
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu.tsx'
import { TableColumnVisibilityKeysEnum } from '@/components/shared/table-column-visibility/table-column-visibility-keys.ts'
import { TableKeyEnum } from '@repo/ui/table-key'
import { SearchKeyEnum, useStorageSearch } from '@/hooks/useStorageSearch'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enums'

export const PoliciesTable = () => {
  const router = useRouter()
  const [pagination, setPagination] = useState<TPagination>(getInitialPagination(TableKeyEnum.POLICY, DEFAULT_PAGINATION))
  const [filters, setFilters] = useState<InternalPolicyWhereInput | null>(null)
  const [searchTerm, setSearchTerm] = useStorageSearch(SearchKeyEnum.POLICIES)
  const { setCrumbs } = useContext(BreadcrumbContext)
  const { data: permission } = useOrganizationRoles()
  const { handleExport } = useFileExport()
  const defaultSorting = getInitialSortConditions(TableKeyEnum.POLICY, InternalPolicyOrderField, [
    {
      field: InternalPolicyOrderField.name,
      direction: OrderDirection.ASC,
    },
  ])
  const [orderBy, setOrderBy] = useState<GetInternalPoliciesListQueryVariables['orderBy']>(defaultSorting)
  const debouncedSearch = useDebounce(searchTerm, 300)

  const { enumOptions } = useGetCustomTypeEnums({
    where: {
      objectType: 'internal_policy',
      field: 'kind',
    },
  })

  const where = useMemo(() => {
    const base: InternalPolicyWhereInput = {
      nameContainsFold: debouncedSearch,
    }

    const result = whereGenerator<InternalPolicyWhereInput>(filters, (key, value) => {
      if (key === 'hasControlsWith') {
        return { hasControlsWith: [{ refCodeContainsFold: value as string }] }
      }

      if (key === 'hasProgramsWith') {
        return { hasProgramsWith: [{ idIn: value }] } as InternalPolicyWhereInput
      }

      if (key === 'hasSubcontrolsWith') {
        return { hasSubcontrolsWith: [{ refCodeContainsFold: value as string }] }
      }

      return { [key]: value }
    })

    const hasStatusCondition = (obj: InternalPolicyWhereInput): boolean => {
      if ('status' in obj || 'statusNEQ' in obj || 'statusIn' in obj || 'statusNotIn' in obj) return true
      if (Array.isArray(obj.and) && obj.and.some(hasStatusCondition)) return true
      if (Array.isArray(obj.or) && obj.or.some(hasStatusCondition)) return true
      return false
    }

    if (!hasStatusCondition(result)) {
      result.statusNotIn = [InternalPolicyDocumentStatus.ARCHIVED]
    }

    return { ...base, ...result }
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
  const defaultVisibility: VisibilityState = {
    id: false,
    approvalRequired: false,
    approver: false,
    delegate: false,
    internalPolicyKindName: false,
    reviewDue: false,
    reviewFrequency: false,
    revision: false,
    status: true,
    tags: false,
    createdAt: false,
    createdBy: false,
    linkedProcedures: false,
    linkedControls: false,
  }

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableColumnVisibilityKeysEnum.POLICY, defaultVisibility))

  const { columns, mappedColumns } = useMemo(() => getPoliciesColumns({ users, tokens, selectedPolicies, setSelectedPolicies, enumOptions }), [users, tokens, selectedPolicies, enumOptions])

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
      fields: columns.filter(isVisibleColumn).map((item) => (item.meta as { exportPrefix?: string })?.exportPrefix ?? item.accessorKey),
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

  const handleClearSelectedPolicies = () => {
    setSelectedPolicies([])
  }

  return (
    <>
      <PoliciesTableToolbar
        searching={fetching}
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
        handleClearSelectedPolicies={handleClearSelectedPolicies}
        selectedPolicies={selectedPolicies}
        setSelectedPolicies={setSelectedPolicies}
        canEdit={canEdit}
        permission={permission}
      />

      <DataTable
        sortFields={INTERNAL_POLICIES_SORT_FIELDS}
        onSortChange={setOrderBy}
        defaultSorting={defaultSorting}
        columns={columns}
        data={policies}
        onRowClick={handleRowClick}
        loading={fetching}
        pagination={pagination}
        onPaginationChange={(pagination: TPagination) => setPagination(pagination)}
        paginationMeta={paginationMeta}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        tableKey={TableKeyEnum.POLICY}
      />
    </>
  )
}
