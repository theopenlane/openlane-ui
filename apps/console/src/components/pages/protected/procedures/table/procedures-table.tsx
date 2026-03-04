'use client'

import { useRouter } from 'next/navigation'
import { DataTable, getInitialSortConditions, getInitialPagination } from '@repo/ui/data-table'
import React, { use, useEffect, useMemo, useState } from 'react'
import {
  ExportExportFormat,
  ExportExportType,
  type GetProceduresListQueryVariables,
  OrderDirection,
  type OrgMembershipWhereInput,
  type Procedure,
  ProcedureDocumentStatus,
  ProcedureOrderField,
  type ProcedureWhereInput,
} from '@repo/codegen/src/schema'
import { getProceduresColumns } from '@/components/pages/protected/procedures/table/columns.tsx'
import ProceduresTableToolbar from '@/components/pages/protected/procedures/table/procedures-table-toolbar.tsx'
import { PROCEDURES_SORTABLE_FIELDS } from '@/components/pages/protected/procedures/table/table-config.ts'
import { type TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useProcedures } from '@/lib/graphql-hooks/procedure'
import { useDebounce } from '@uidotdev/usehooks'
import { type ColumnDef, type VisibilityState } from '@tanstack/react-table'
import { useGetOrgUserList } from '@/lib/graphql-hooks/member'
import { useGetApiTokensByIds } from '@/lib/graphql-hooks/tokens.ts'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { canEdit } from '@/lib/authz/utils.ts'
import useFileExport from '@/components/shared/export/use-file-export.ts'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { useNotification } from '@/hooks/useNotification'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu.tsx'
import { TableKeyEnum } from '@repo/ui/table-key'
import { useStorageSearch } from '@/hooks/useStorageSearch'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { objectToSnakeCase } from '@/utils/strings'

export const ProceduresTable = () => {
  const router = useRouter()
  const [pagination, setPagination] = useState<TPagination>(() => getInitialPagination(TableKeyEnum.PROCEDURE, DEFAULT_PAGINATION))
  const [filters, setFilters] = useState<ProcedureWhereInput | null>(null)
  const [searchTerm, setSearchTerm] = useStorageSearch(ObjectTypes.PROCEDURE)
  const { setCrumbs } = use(BreadcrumbContext)
  const { data: permission } = useOrganizationRoles()
  const { errorNotification } = useNotification()
  const { handleExport } = useFileExport()
  const defaultSorting = getInitialSortConditions(TableKeyEnum.PROCEDURE, ProcedureOrderField, [
    {
      field: ProcedureOrderField.name,
      direction: OrderDirection.ASC,
    },
  ])
  const [orderBy, setOrderBy] = useState<GetProceduresListQueryVariables['orderBy']>(defaultSorting)

  const debouncedSearch = useDebounce(searchTerm, 300)

  const where = useMemo(() => {
    const result = whereGenerator<ProcedureWhereInput>(filters, (key, value) => {
      if (key === 'hasControlsWith') {
        return { hasControlsWith: [{ refCodeContainsFold: value as string }] } as ProcedureWhereInput
      }

      if (key === 'hasProgramsWith') {
        return { hasProgramsWith: [{ idIn: value }] } as ProcedureWhereInput
      }

      if (key === 'hasSubcontrolsWith') {
        return { hasSubcontrolsWith: [{ refCodeContainsFold: value as string }] } as ProcedureWhereInput
      }

      return { [key]: value } as ProcedureWhereInput
    })

    const hasStatusCondition = (obj: ProcedureWhereInput): boolean => {
      if ('status' in obj || 'statusNEQ' in obj || 'statusIn' in obj || 'statusNotIn' in obj) return true
      if (Array.isArray(obj.and) && obj.and.some(hasStatusCondition)) return true
      if (Array.isArray(obj.or) && obj.or.some(hasStatusCondition)) return true
      return false
    }

    if (!hasStatusCondition(result)) {
      result.statusNotIn = [ProcedureDocumentStatus.ARCHIVED]
    }

    const merged = { ...result }

    if (debouncedSearch) {
      merged.and = [...(merged.and || []), { or: [{ nameContainsFold: debouncedSearch }, { detailsContainsFold: debouncedSearch }] }]
    }

    return merged
  }, [filters, debouncedSearch])

  const { procedures, isError, isLoading: fetching, paginationMeta } = useProcedures({ where, orderBy, pagination, enabled: !!filters })

  const memberIds = useMemo(() => {
    if (!procedures || procedures.length === 0) {
      return []
    }

    return [...new Set(procedures.map((item) => item.updatedBy).filter(Boolean))]
  }, [procedures])

  const userListWhere: OrgMembershipWhereInput = useMemo(() => {
    if (memberIds.length === 0) {
      return {}
    }

    const conditions = {
      hasUserWith: [{ idIn: memberIds }],
    }

    return conditions
  }, [memberIds])

  const tokensWhere = useMemo(() => {
    if (memberIds.length === 0) {
      return {}
    }

    const conditions = {
      idIn: memberIds,
    }

    return conditions
  }, [memberIds])
  const { users } = useGetOrgUserList({ where: userListWhere })
  const { tokens } = useGetApiTokensByIds({ where: tokensWhere })
  const [selectedProcedures, setSelectedProcedures] = useState<{ id: string }[]>([])
  const defaultVisibility: VisibilityState = {
    id: false,
    approvalRequired: false,
    approver: false,
    delegate: false,
    procedureKindName: false,
    reviewDue: false,
    reviewFrequency: false,
    revision: false,
    status: true,
    tags: false,
    createdAt: false,
    createdBy: false,
    linkedPolicies: false,
    linkedControls: false,
  }

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableKeyEnum.PROCEDURE, defaultVisibility))
  const resolvedColumnVisibility: VisibilityState = permission?.roles ? { ...columnVisibility, select: canEdit(permission.roles) } : columnVisibility

  const { enumOptions } = useGetCustomTypeEnums({
    where: {
      objectType: objectToSnakeCase(ObjectTypes.PROCEDURE),
      field: 'kind',
    },
  })

  const { columns, mappedColumns } = getProceduresColumns({ users, tokens, selectedProcedures, setSelectedProcedures, enumOptions })

  const handleCreateNew = async () => {
    router.push(`/procedures/create`)
  }

  const handleRowClick = (rowData: Procedure) => {
    router.push(`/procedures/${rowData.id}/view`)
  }

  function isVisibleColumn<T>(col: ColumnDef<T>): col is ColumnDef<T> & { accessorKey: string; header: string } {
    return 'accessorKey' in col && typeof col.accessorKey === 'string' && typeof col.header === 'string' && columnVisibility[col.accessorKey] !== false
  }

  const handleExportFile = () => {
    if (!procedures || procedures.length === 0) {
      return
    }

    handleExport({
      exportType: ExportExportType.PROCEDURE,
      filters: JSON.stringify(where),
      fields: columns.filter(isVisibleColumn).map((item) => (item.meta as { exportPrefix?: string })?.exportPrefix ?? item.accessorKey),
      format: ExportExportFormat.CSV,
    })
  }

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Procedures', href: '/procedures' },
    ])
  }, [setCrumbs])

  useEffect(() => {
    if (isError) {
      errorNotification({
        title: 'Error',
        description: 'Failed to load procedures',
      })
    }
  }, [isError, errorNotification])

  const handleClearSelectedProcedures = () => {
    setSelectedProcedures([])
  }

  return (
    <>
      <ProceduresTableToolbar
        className="my-5"
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
        columnVisibility={resolvedColumnVisibility}
        setColumnVisibility={setColumnVisibility}
        exportEnabled={procedures && procedures.length > 0}
        handleClearSelectedProcedures={handleClearSelectedProcedures}
        selectedProcedures={selectedProcedures}
        setSelectedProcedures={setSelectedProcedures}
        canEdit={canEdit}
        permission={permission}
      />

      <DataTable
        sortFields={PROCEDURES_SORTABLE_FIELDS}
        onSortChange={setOrderBy}
        columns={columns}
        data={procedures}
        onRowClick={handleRowClick}
        loading={fetching}
        pagination={pagination}
        onPaginationChange={(pagination: TPagination) => setPagination(pagination)}
        paginationMeta={paginationMeta}
        columnVisibility={resolvedColumnVisibility}
        setColumnVisibility={setColumnVisibility}
        defaultSorting={defaultSorting}
        tableKey={TableKeyEnum.PROCEDURE}
      />
    </>
  )
}
