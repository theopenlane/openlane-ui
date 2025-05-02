'use client'

import { useRouter } from 'next/navigation'
import { DataTable } from '@repo/ui/data-table'
import React, { useState, useMemo } from 'react'
import { GetProceduresListQueryVariables, OrderDirection, Procedure, ProcedureOrderField } from '@repo/codegen/src/schema'
import { proceduresColumns } from '@/components/pages/protected/procedures/table/columns.tsx'
import ProceduresTableToolbar from '@/components/pages/protected/procedures/table/procedures-table-toolbar.tsx'
import { PROCEDURES_SORTABLE_FIELDS } from '@/components/pages/protected/procedures/table/table-config.ts'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useProcedures } from '@/lib/graphql-hooks/procedures'
import { useDebounce } from '@uidotdev/usehooks'
import { ColumnDef } from '@tanstack/react-table'
import { exportToCSV } from '@/utils/exportToCSV'
import { formatDateTime } from '@/utils/date'

export const ProceduresTable = () => {
  const router = useRouter()
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [orderBy, setOrderBy] = useState<GetProceduresListQueryVariables['orderBy']>([
    {
      field: ProcedureOrderField.name,
      direction: OrderDirection.DESC,
    },
  ])

  const debouncedSearch = useDebounce(searchTerm, 300)

  const whereFilter = useMemo(() => {
    return {
      ...filters,
      nameContainsFold: debouncedSearch,
    }
  }, [filters, debouncedSearch])

  const { procedures, isLoading: fetching, paginationMeta } = useProcedures({ where: whereFilter, orderBy, pagination })

  const handleCreateNew = async () => {
    router.push(`/procedures/create`)
  }

  const handleRowClick = (rowData: Procedure) => {
    router.push(`/procedures/${rowData.id}/view`)
  }

  function isAccessorKeyColumn<T>(col: ColumnDef<T>): col is ColumnDef<T> & { accessorKey: string; header: string } {
    return 'accessorKey' in col && typeof col.accessorKey === 'string' && typeof col.header === 'string'
  }

  const handleExport = () => {
    const exportableColumns = proceduresColumns
      .filter((col): col is ColumnDef<Procedure> & { accessorKey: string; header: string } => isAccessorKeyColumn(col))
      .map((col) => {
        const key = col.accessorKey as keyof Procedure
        const label = col.header

        return {
          label,
          accessor: (procedure: Procedure) => {
            const value = procedure[key]

            if ((key === 'updatedAt' || key === 'createdAt') && value) {
              return formatDateTime(value as string)
            }

            if (key === 'details') {
              return (value as string) ?? ''
            }

            return typeof value === 'string' || typeof value === 'number' ? value : ''
          },
        }
      })

    exportToCSV(procedures, exportableColumns, 'procedures')
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
        handleExport={handleExport}
      />

      <DataTable
        sortFields={PROCEDURES_SORTABLE_FIELDS}
        onSortChange={setOrderBy}
        columns={proceduresColumns}
        data={procedures}
        onRowClick={handleRowClick}
        loading={fetching}
        pagination={pagination}
        onPaginationChange={(pagination: TPagination) => setPagination(pagination)}
        paginationMeta={paginationMeta}
      />
    </>
  )
}
