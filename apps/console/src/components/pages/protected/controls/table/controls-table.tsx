'use client'

import React, { useMemo, useState } from 'react'
import { useGetAllControls } from '@/lib/graphql-hooks/controls'
import { Badge } from '@repo/ui/badge'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/table-core'
import { ControlControlStatus, ControlListFieldsFragment, ControlOrderField, GetAllControlsQueryVariables, Group, OrderDirection } from '@repo/codegen/src/schema'
import { Avatar } from '@/components/shared/avatar/avatar'
import { useRouter } from 'next/navigation'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { Value } from '@udecode/plate-common'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import ControlsTableToolbar from './controls-table-toolbar'
import { CONTROLS_SORT_FIELDS } from './table-config'
import { useDebounce } from '@uidotdev/usehooks'
import { ControlIconMapper } from '@/components/shared/icon-enum/control-enum.tsx'
import { VisibilityState } from '@tanstack/react-table'
import { exportToCSV } from '@/utils/exportToCSV'

export const ControlStatusLabels: Record<ControlControlStatus, string> = {
  [ControlControlStatus.APPROVED]: 'Approved',
  [ControlControlStatus.ARCHIVED]: 'Archived',
  [ControlControlStatus.CHANGES_REQUESTED]: 'Changes Requested',
  [ControlControlStatus.NEEDS_APPROVAL]: 'Needs Approval',
  [ControlControlStatus.NOT_IMPLEMENTED]: 'Not Implemented',
  [ControlControlStatus.PREPARING]: 'Preparing',
}

const ControlsTable: React.FC = () => {
  const { push } = useRouter()
  const plateEditorHelper = usePlateEditor()
  const [filters, setFilters] = useState<Record<string, any> | null>(null)
  const [orderBy, setOrderBy] = useState<GetAllControlsQueryVariables['orderBy']>([
    {
      field: ControlOrderField.ref_code,
      direction: OrderDirection.ASC,
    },
  ])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const debouncedSearch = useDebounce(searchTerm, 300)
  const whereFilter = useMemo(() => {
    const conditions: Record<string, any> = {}
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (!value) {
        return
      }

      if (key === 'programContains') {
        conditions.hasProgramsWith = [{ nameContainsFold: value }]
      } else if (key === 'standardContains') {
        conditions.hasStandardWith = [{ nameContainsFold: value }]
      } else {
        conditions[key] = value
      }
    })

    return conditions
  }, [filters])

  const { controls, isError, paginationMeta } = useGetAllControls({
    where: { ownerIDNEQ: '', refCodeContainsFold: debouncedSearch, ...whereFilter },
    orderBy,
    pagination,
    enabled: !!filters,
  })

  const columns: ColumnDef<ControlListFieldsFragment>[] = useMemo(
    () => [
      {
        header: 'Name',
        accessorKey: 'refCode',
        cell: ({ row }) => <div className="font-bold">{row.getValue('refCode')}</div>,
        size: 50,
        maxSize: 90,
      },
      {
        header: 'Description',
        accessorKey: 'description',
        size: 400,
        cell: ({ row }) => {
          const tags = row.original.tags
          const description = () => {
            return plateEditorHelper.convertToReadOnly(row.getValue('description') as Value | any, 0)
          }

          return (
            <div>
              <div className="line-clamp-3 text-justify">{description()}</div>
              <div className="mt-2 border-t border-dotted pt-2 flex flex-wrap gap-2">
                {tags?.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )
        },
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => {
          const value: ControlControlStatus = row.getValue('status')
          const label = ControlStatusLabels[value] ?? value

          return (
            <div className="flex items-center space-x-2">
              {ControlIconMapper[value]}
              <p>{label}</p>
            </div>
          )
        },
        size: 100,
      },
      {
        header: 'Category',
        accessorKey: 'category',
        cell: ({ row }) => <div>{row.getValue('category') || '-'}</div>,
        size: 120,
      },
      {
        header: 'Subcategory',
        accessorKey: 'subcategory',
        cell: ({ row }) => <div>{row.getValue('subcategory') || '-'}</div>,
        size: 120,
      },
      {
        header: 'Owner',
        accessorKey: 'controlOwner',
        cell: ({ row }) => {
          const owner = row.getValue<ControlListFieldsFragment['controlOwner']>('controlOwner')

          return (
            <div className="flex items-center gap-2">
              <Avatar entity={owner as Group} variant="small" />
              <span>{owner?.displayName ?? '-'}</span>
            </div>
          )
        },
        size: 100,
      },
    ],
    [plateEditorHelper],
  )

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
      />
    </div>
  )
}

export default ControlsTable
