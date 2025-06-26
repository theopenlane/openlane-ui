'use client'

import React, { useMemo, useState, useEffect, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { getRiskColumns } from '@/components/pages/protected/risks/table/columns.tsx'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination.ts'
import { GetAllRisksQueryVariables, OrderDirection, RiskFieldsFragment, RiskOrderField } from '@repo/codegen/src/schema.ts'
import { ColumnDef, VisibilityState } from '@tanstack/react-table'
import { useDebounce } from '@uidotdev/usehooks'
import { useTableRisks } from '@/lib/graphql-hooks/risks.ts'
import { exportToCSV } from '@/utils/exportToCSV.ts'
import { PageHeading } from '@repo/ui/page-heading'
import RisksTableToolbar from '@/components/pages/protected/risks/table/risks-table-toolbar.tsx'
import { DataTable } from '@repo/ui/data-table'
import { RISKS_SORT_FIELDS } from '@/components/pages/protected/risks/table/table-config.ts'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

const RiskTable: React.FC = () => {
  const router = useRouter()
  const { columns, mappedColumns } = getRiskColumns()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Record<string, any> | null>(null)
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const { setCrumbs } = useContext(BreadcrumbContext)
  const [orderBy, setOrderBy] = useState<GetAllRisksQueryVariables['orderBy']>([
    {
      field: RiskOrderField.name,
      direction: OrderDirection.ASC,
    },
  ])

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const debouncedSearch = useDebounce(searchQuery, 300)
  const searching = searchQuery !== debouncedSearch

  const where = useMemo(() => {
    return {
      ...filters,
      nameContainsFold: debouncedSearch || undefined,
    }
  }, [filters, debouncedSearch])

  const orderByFilter = useMemo(() => {
    return orderBy || undefined
  }, [orderBy])

  const { risks, paginationMeta, isError } = useTableRisks({
    where,
    orderBy: orderByFilter,
    pagination,
    enabled: !!filters,
  })

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Risks', href: '/risks' },
    ])
  }, [setCrumbs])

  function isVisibleColumn<T>(col: ColumnDef<T>): col is ColumnDef<T> & { accessorKey: string; header: string } {
    return 'accessorKey' in col && typeof col.accessorKey === 'string' && typeof col.header === 'string' && columnVisibility[col.accessorKey] !== false
  }

  const handleRowClick = (rowData: RiskFieldsFragment) => {
    router.push(`/risks/${rowData.id}`)
  }

  const handleCreateNew = async () => {
    router.push(`/risks/create`)
  }

  const handleExport = () => {
    const exportableColumns = columns.filter(isVisibleColumn).map((col) => {
      const key = col.accessorKey as keyof RiskFieldsFragment
      const label = col.header

      return {
        label,
        accessor: (risk: RiskFieldsFragment) => {
          const value = risk[key]

          if (key === 'details') {
            return (value as string) ?? ''
          }

          if (key === 'score') {
            return typeof value === 'number' ? value.toFixed(2) : ''
          }

          return typeof value === 'string' || typeof value === 'number' ? value : ''
        },
      }
    })

    exportToCSV(risks, exportableColumns, 'risk_list')
  }

  return (
    <div className="space-y-6">
      <PageHeading heading="Risks" />

      <RisksTableToolbar
        handleCreateNew={handleCreateNew}
        searchTerm={searchQuery}
        setSearchTerm={(val) => {
          setSearchQuery(val)
          setPagination(DEFAULT_PAGINATION)
        }}
        searching={searching}
        onFilterChange={setFilters}
        handleExport={handleExport}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        mappedColumns={mappedColumns}
      />
      <DataTable
        sortFields={RISKS_SORT_FIELDS}
        onSortChange={setOrderBy}
        columns={columns}
        data={risks || []}
        onRowClick={handleRowClick}
        loading={!risks && !isError}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
      />
    </div>
  )
}

export default RiskTable
