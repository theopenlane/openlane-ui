'use client'

import React, { Fragment, useMemo, useState } from 'react'
import { useGetAllControls } from '@/lib/graphql-hooks/controls'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/table-core'
import { DownloadIcon } from 'lucide-react'
import { ControlFieldsFragment, Group, Organization } from '@repo/codegen/src/schema'
import { Avatar } from '@/components/shared/avatar/avatar'
import { useRouter } from 'next/navigation'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { Value } from '@udecode/plate-common'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'

const ControlsTable: React.FC = () => {
  const { push } = useRouter()
  const plateEditorHelper = usePlateEditor()

  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)

  const {
    data: controlsData,
    isLoading,
    isError,
    isFetching,
  } = useGetAllControls({
    where: { ownerIDNEQ: '' },
    pagination,
  })

  const columns: ColumnDef<ControlFieldsFragment>[] = useMemo(
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
        cell: ({ row }) => <span className="flex items-center gap-2">{row.getValue('status')}</span>,
      },
      {
        header: 'Owner',
        accessorKey: 'controlOwner',
        cell: ({ row }) => {
          const owner = row.getValue<ControlFieldsFragment['controlOwner']>('controlOwner')

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

  const tableData = useMemo(() => {
    const edges = controlsData?.controls?.edges || []
    return edges.map((edge) => edge?.node).filter((node): node is ControlFieldsFragment => !!node)
  }, [controlsData])

  const handleRowClick = (row: ControlFieldsFragment) => {
    push(`/controls/${row.id}`)
  }

  const exportToCSV = (data: ControlFieldsFragment[], fileName: string) => {
    const csvRows = []
    csvRows.push(['Name', 'Ref', 'Description', 'Tags', 'Status', 'Owners'].join(','))

    data.forEach((row) => {
      const owners = row.owner?.users?.map((o) => `${o?.firstName ?? ''} ${o?.lastName ?? ''}`.trim()).join(' | ') || ''
      csvRows.push([row.refCode, row.refCode, row.description || '', row.tags?.join('; ') || '', row.status || '', owners].join(','))
    })

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) return <div>Loading Controls...</div>
  if (isError) return <div>Failed to load Controls</div>

  return (
    <div>
      <div className="flex justify-end items-center mb-4 w-full">
        <Button onClick={() => exportToCSV(tableData, 'control_list')} icon={<DownloadIcon />} iconPosition="left">
          Export
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={tableData}
        onRowClick={handleRowClick}
        pagination={pagination}
        onPaginationChange={(pagination: TPagination) => setPagination(pagination)}
        paginationMeta={{ totalCount: controlsData?.controls.totalCount, pageInfo: controlsData?.controls.pageInfo, isLoading: isFetching }}
      />
    </div>
  )
}

export default ControlsTable
