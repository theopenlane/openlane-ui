'use client'

import React, { useMemo, useState, useEffect, useContext } from 'react'
import { useGetAllControls } from '@/lib/graphql-hooks/controls'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/table-core'
import { ControlListFieldsFragment, ControlOrderField, ControlWhereInput, GetAllControlsQueryVariables, OrderDirection } from '@repo/codegen/src/schema'
import { useRouter } from 'next/navigation'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import ControlsTableToolbar from './controls-table-toolbar'
import { CONTROLS_SORT_FIELDS, getControlColumns } from './table-config'
import { useDebounce } from '@uidotdev/usehooks'
import { VisibilityState } from '@tanstack/react-table'
import { exportToCSV } from '@/utils/exportToCSV'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useGetOrgUserList } from '@/lib/graphql-hooks/members'

const ControlsTable: React.FC = () => {
  const { push } = useRouter()
  const { convertToReadOnly } = usePlateEditor()
  const [filters, setFilters] = useState<ControlWhereInput | null>(null)
  const { setCrumbs } = useContext(BreadcrumbContext)
  const [orderBy, setOrderBy] = useState<GetAllControlsQueryVariables['orderBy']>([
    {
      field: ControlOrderField.ref_code,
      direction: OrderDirection.ASC,
    },
  ])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    referenceID: false,
    auditorReferenceID: false,
    category: false,
    subcategory: false,
    source: false,
    controlType: false,
    referenceFramework: false,
    delegate: false,
    createdBy: false,
    createdAt: false,
    updatedBy: false,
    updatedAt: false,
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const debouncedSearch = useDebounce(searchTerm, 300)
  const whereFilter = useMemo(() => {
    const conditions: ControlWhereInput = {}

    console.log('filters', filters)
    const mapCustomKey = (key: string, value: string): Partial<ControlWhereInput> => {
      if (key === 'programContains') {
        return { hasProgramsWith: [{ nameContainsFold: value as string }] }
      }
      if (key === 'standardContains' && value === 'CUSTOM') {
        return { referenceFrameworkIsNil: true }
      }
      if (key === 'standardContains') {
        return { hasStandardWith: [{ nameContainsFold: value as string }] }
      }
      return { [key]: value } as Partial<ControlWhereInput>
    }

    Object.entries(filters || {}).forEach(([key, value]) => {
      if (!value) return

      if ((key === 'and' || key === 'or') && Array.isArray(value)) {
        conditions[key] = value.map((entry) => {
          const subCondition: ControlWhereInput = {}
          Object.entries(entry).forEach(([innerKey, innerValue]) => {
            Object.assign(subCondition, mapCustomKey(innerKey, innerValue as string))
          })
          return subCondition
        })
      } else {
        Object.assign(conditions, mapCustomKey(key, value))
      }
    })

    return conditions
  }, [filters])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Controls', href: '/controls' },
    ])
  }, [setCrumbs])

  const { controls, isError, paginationMeta, isLoading, isFetching } = useGetAllControls({
    where: { ownerIDNEQ: '', refCodeContainsFold: debouncedSearch, ...whereFilter },
    orderBy,
    pagination,
    enabled: !!filters,
  })

  const userIds = useMemo(() => {
    if (!controls) return []
    const ids = new Set<string>()
    controls.forEach((task) => {
      if (task.createdBy) ids.add(task.createdBy)
      if (task.updatedBy) ids.add(task.updatedBy)
    })
    return Array.from(ids)
  }, [controls])

  const { users, isFetching: fetchingUsers } = useGetOrgUserList({
    where: { hasUserWith: [{ idIn: userIds }] },
  })

  const userMap = useMemo(() => {
    const map: Record<string, (typeof users)[0]> = {}
    users?.forEach((u) => {
      map[u.id] = u
    })
    return map
  }, [users])

  const columns = useMemo(() => getControlColumns({ convertToReadOnly, userMap }), [convertToReadOnly, userMap])

  const mappedColumns: { accessorKey: string; header: string }[] = columns
    .filter((column): column is { accessorKey: string; header: string } => 'accessorKey' in column && typeof column.accessorKey === 'string' && typeof column.header === 'string')
    .map((column) => ({
      accessorKey: column.accessorKey,
      header: column.header,
    }))

  function isVisibleColumn<T>(col: ColumnDef<T>): col is ColumnDef<T> & { accessorKey: string; header: string } {
    return 'accessorKey' in col && typeof col.accessorKey === 'string' && typeof col.header === 'string' && columnVisibility[col.accessorKey] !== false
  }

  const handleRowClick = (row: ControlListFieldsFragment) => {
    push(`/controls/${row.id}`)
  }

  const handleExport = () => {
    if (!controls || controls.length === 0) return
    const exportableColumns = columns.filter(isVisibleColumn).map((col) => {
      const key = col.accessorKey as keyof ControlListFieldsFragment
      const label = col.header

      return {
        label,
        accessor: (control: ControlListFieldsFragment) => {
          const value = control[key]

          return typeof value === 'string' || typeof value === 'number' ? value : ''
        },
      }
    })

    exportToCSV(controls, exportableColumns, 'controls_list')
  }

  if (isError) return <div>Failed to load Controls</div>

  return (
    <div>
      <ControlsTableToolbar
        handleExport={handleExport}
        onFilterChange={setFilters}
        searchTerm={searchTerm}
        setSearchTerm={(inputVal) => {
          setSearchTerm(inputVal)
          setPagination(DEFAULT_PAGINATION)
        }}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        mappedColumns={mappedColumns}
        exportEnabled={controls && controls.length > 0}
      />
      <DataTable
        columns={columns}
        data={controls}
        onRowClick={handleRowClick}
        pagination={pagination}
        onPaginationChange={(pagination: TPagination) => setPagination(pagination)}
        paginationMeta={paginationMeta}
        sortFields={CONTROLS_SORT_FIELDS}
        onSortChange={setOrderBy}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        loading={fetchingUsers || isLoading || isFetching}
      />
    </div>
  )
}

export default ControlsTable
