'use client'

import React, { Fragment, useMemo, useState } from 'react'
import { useGetAllControls } from '@/lib/graphql-hooks/controls'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/table-core'
import { DownloadIcon } from 'lucide-react'
import { ControlControlStatus, ControlListFieldsFragment, ControlOrderField, GetAllControlsQueryVariables, Group, OrderDirection } from '@repo/codegen/src/schema'
import { Avatar } from '@/components/shared/avatar/avatar'
import { useRouter } from 'next/navigation'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { Value } from '@udecode/plate-common'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import ControlsTableToolbar from './controls-table-toolbar'
import { CONTROLS_SORT_FIELDS } from './table-config'

const ControlsTable: React.FC = () => {
  const { push } = useRouter()
  const plateEditorHelper = usePlateEditor()
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [orderBy, setOrderBy] = useState<GetAllControlsQueryVariables['orderBy']>([
    {
      field: ControlOrderField.ref_code,
      direction: OrderDirection.DESC,
    },
  ])
  const [searchTerm, setSearchTerm] = useState('')

  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)

  const { controls, isLoading, isError, paginationMeta } = useGetAllControls({
    where: { ownerIDNEQ: '' },
    orderBy,
    pagination,
    search: searchTerm,
  })

  const columns: ColumnDef<ControlListFieldsFragment>[] = useMemo(
    () => [
      {
        header: 'Name',
        accessorKey: 'refCode',
        cell: ({ row }) => <div>{row.getValue('refCode')}</div>,
      },
      {
        header: 'Description',
        accessorKey: 'description',
        cell: ({ row }) => {
          const tags = row.original.tags
          const description = () => {
            return plateEditorHelper.convertToReadOnly(row.getValue('description') as Value | any, 0)
          }

          return (
            <div>
              <div className="line-clamp-4">{description()}</div>
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
          let value: ControlControlStatus | '-' = row.getValue('status')
          if (value === ControlControlStatus.NULL) {
            value = '-'
          }
          return <span className="flex items-center gap-2">{value}</span>
        },
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
      },
      {
        header: 'Type',
        accessorKey: 'type',
        cell: ({ row }) => <div>{row.getValue('type') || '-'}</div>,
      },
      {
        header: 'Category',
        accessorKey: 'category',
        cell: ({ row }) => <div>{row.getValue('category') || '-'}</div>,
      },
      {
        header: 'Subcategory',
        accessorKey: 'subcategory',
        cell: ({ row }) => <div>{row.getValue('subcategory') || '-'}</div>,
      },
    ],
    [plateEditorHelper],
  )

  // const tableData = useMemo(() => {
  //   const edges = controlsData?.controls?.edges || []
  //   return edges.map((edge) => edge?.node).filter((node): node is ControlListFieldsFragment => !!node)
  // }, [controlsData])

  const handleRowClick = (row: ControlListFieldsFragment) => {
    push(`/controls/${row.id}`)
  }

  const exportToCSV = (data: ControlListFieldsFragment[], fileName: string) => {
    const csvRows = []
    csvRows.push(['Name', 'Ref', 'Description', 'Tags', 'Status', 'Owners'].join(','))

    data.forEach((row) => {
      const owner = row.controlOwner?.displayName
      csvRows.push([row.refCode, row.refCode, row.description || '', row.tags?.join('; ') || '', row.status || '', owner].join(','))
    })

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isError) return <div>Failed to load Controls</div>

  return (
    <div>
      <div className="flex justify-end items-center mb-4 w-full">
        <Button onClick={() => exportToCSV(controls, 'control_list')} icon={<DownloadIcon />} iconPosition="left">
          Export
        </Button>
      </div>
      <ControlsTableToolbar
        onFilterChange={setFilters}
        searchTerm={searchTerm}
        setSearchTerm={(inputVal) => {
          setSearchTerm(inputVal)
          setPagination(DEFAULT_PAGINATION)
        }}
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
      />
    </div>
  )
}

export default ControlsTable
