'use client'

import { useRouter } from 'next/navigation'
import { DataTable, getInitialSortConditions, getInitialPagination } from '@repo/ui/data-table'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import {
  ExportExportFormat,
  ExportExportType,
  GetProceduresListQueryVariables,
  Maybe,
  OrderDirection,
  OrgMembershipWhereInput,
  Procedure,
  ProcedureDocumentStatus,
  ProcedureOrderField,
  ProcedureWhereInput,
} from '@repo/codegen/src/schema'
import { getProceduresColumns } from '@/components/pages/protected/procedures/table/columns.tsx'
import ProceduresTableToolbar from '@/components/pages/protected/procedures/table/procedures-table-toolbar.tsx'
import { PROCEDURES_SORTABLE_FIELDS } from '@/components/pages/protected/procedures/table/table-config.ts'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useProcedures } from '@/lib/graphql-hooks/procedures'
import { useDebounce } from '@uidotdev/usehooks'
import { ColumnDef, VisibilityState } from '@tanstack/react-table'
import { useGetOrgUserList } from '@/lib/graphql-hooks/members.ts'
import { useGetApiTokensByIds } from '@/lib/graphql-hooks/tokens.ts'
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

export const ProceduresTable = () => {
  const router = useRouter()
  const [pagination, setPagination] = useState<TPagination>(getInitialPagination(TableKeyEnum.PROCEDURE, DEFAULT_PAGINATION))
  const [filters, setFilters] = useState<ProcedureWhereInput | null>(null)
  const [memberIds, setMemberIds] = useState<(Maybe<string> | undefined)[] | null>(null)
  const [searchTerm, setSearchTerm] = useStorageSearch(SearchKeyEnum.PROCEDURES)
  const { setCrumbs } = useContext(BreadcrumbContext)
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
    const base: ProcedureWhereInput = {
      nameContainsFold: debouncedSearch,
    }

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

    return { ...base, ...result }
  }, [filters, debouncedSearch])

  const userListWhere: OrgMembershipWhereInput = useMemo(() => {
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

  const { procedures, isError, isLoading: fetching, paginationMeta } = useProcedures({ where, orderBy, pagination, enabled: !!filters })
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

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableColumnVisibilityKeysEnum.PROCEDURE, defaultVisibility))

  const { enumOptions } = useGetCustomTypeEnums({
    where: {
      objectType: 'procedure',
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
    if (permission?.roles) {
      setColumnVisibility((prev) => ({
        ...prev,
        select: canEdit(permission.roles),
      }))
    }
  }, [permission?.roles])

  useEffect(() => {
    if (procedures.length > 0 && !memberIds) {
      const userIds = [...new Set(procedures.map((item) => item.updatedBy))]
      setMemberIds(userIds)
    }
  }, [procedures, memberIds, filters])

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
        columnVisibility={columnVisibility}
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
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        defaultSorting={defaultSorting}
        tableKey={TableKeyEnum.PROCEDURE}
      />
    </>
  )
}
