'use client'

import { useRouter } from 'next/navigation'
import { DataTable } from '@repo/ui/data-table'
import React, { useState, useMemo, useEffect, useContext } from 'react'
import { GetProceduresListQueryVariables, Maybe, OrderDirection, OrgMembershipWhereInput, Procedure, ProcedureOrderField, ProcedureWhereInput } from '@repo/codegen/src/schema'
import { getProceduresColumns } from '@/components/pages/protected/procedures/table/columns.tsx'
import ProceduresTableToolbar from '@/components/pages/protected/procedures/table/procedures-table-toolbar.tsx'
import { PROCEDURES_SORTABLE_FIELDS } from '@/components/pages/protected/procedures/table/table-config.ts'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useProcedures } from '@/lib/graphql-hooks/procedures'
import { useDebounce } from '@uidotdev/usehooks'
import { ColumnDef } from '@tanstack/react-table'
import { exportToCSV } from '@/utils/exportToCSV'
import { formatDateTime } from '@/utils/date'
import { useGetOrgUserList } from '@/lib/graphql-hooks/members.ts'
import { useGetApiTokensByIds } from '@/lib/graphql-hooks/tokens.ts'
import { VisibilityState } from '@tanstack/react-table'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

export const ProceduresTable = () => {
  const router = useRouter()
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [filters, setFilters] = useState<ProcedureWhereInput | null>(null)
  const [memberIds, setMemberIds] = useState<(Maybe<string> | undefined)[] | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const { setCrumbs } = useContext(BreadcrumbContext)
  const [orderBy, setOrderBy] = useState<GetProceduresListQueryVariables['orderBy']>([
    {
      field: ProcedureOrderField.name,
      direction: OrderDirection.ASC,
    },
  ])

  const debouncedSearch = useDebounce(searchTerm, 300)

  const whereFilter = useMemo(() => {
    return {
      ...filters,
      nameContainsFold: debouncedSearch,
    }
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

  const { procedures, isLoading: fetching, paginationMeta } = useProcedures({ where: whereFilter, orderBy, pagination, enabled: !!filters })
  const { users } = useGetOrgUserList({ where: userListWhere })
  const { tokens } = useGetApiTokensByIds({ where: tokensWhere })
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    approvalRequired: false,
    approver: false,
    delegate: false,
    procedureType: false,
    reviewDue: false,
    reviewFrequency: false,
    revision: false,
    status: false,
    tags: false,
    createdAt: false,
    createdBy: false,
  })
  const { columns, mappedColumns } = getProceduresColumns({ users, tokens })

  const handleCreateNew = async () => {
    router.push(`/procedures/create`)
  }

  const handleRowClick = (rowData: Procedure) => {
    router.push(`/procedures/${rowData.id}/view`)
  }

  function isVisibleColumn<T>(col: ColumnDef<T>): col is ColumnDef<T> & { accessorKey: string; header: string } {
    return 'accessorKey' in col && typeof col.accessorKey === 'string' && typeof col.header === 'string' && columnVisibility[col.accessorKey] !== false
  }

  const handleExport = () => {
    const exportableColumns = columns.filter(isVisibleColumn).map((col) => {
      const key = col.accessorKey as keyof Procedure
      const label = col.header

      return {
        label,
        accessor: (procedure: Procedure) => {
          const value = procedure[key]

          if ((key === 'updatedAt' || key === 'createdAt') && value) {
            return formatDateTime(value as string)
          }

          if (key === 'summary') {
            return (value as string) ?? ''
          }

          return typeof value === 'string' || typeof value === 'number' ? value : ''
        },
      }
    })

    exportToCSV(procedures, exportableColumns, 'procedures')
  }

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
        handleExport={handleExport}
        mappedColumns={mappedColumns}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        exportEnabled={procedures && procedures.length > 0}
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
      />
    </>
  )
}
