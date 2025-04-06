'use client'

import React, { Fragment, useState } from 'react'
import { useGetAllControls } from '@/lib/graphql-hooks/controls'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/table-core'
import { DownloadIcon } from 'lucide-react'
import { ControlFieldsFragment, Organization, User } from '@repo/codegen/src/schema'
import { Avatar } from '@/components/shared/avatar/avatar'
import { useRouter } from 'next/navigation'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { Value } from '@udecode/plate-common'

const ControlsTable: React.FC = () => {
  const { data: controlsData, isLoading, isError } = useGetAllControls({})
  const { push } = useRouter()
  const plateEditorHelper = usePlateEditor()

  const columns: ColumnDef<ControlFieldsFragment>[] = [
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
          return plateEditorHelper.convertToReadOnly(row.getValue('description') as Value | any)
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
      accessorKey: 'owner',
      cell: ({ row }) => {
        const owner = row.getValue<ControlFieldsFragment['owner']>('owner')
        const users = owner?.users ?? []

        return (
          <div className="flex items-center gap-2">
            {users.map((user, index) => (
              <Fragment key={index}>
                <Avatar entity={user as Organization} variant="small" />
                <span>{`${user.firstName} ${user.lastName}`}</span>
              </Fragment>
            ))}
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
  ]

  if (isLoading) return <div>Loading Controls...</div>
  if (isError) return <div>Failed to load Controls</div>

  const edges = controlsData?.controls?.edges || []
  const tableData = edges.map((edge) => edge?.node).filter((node): node is ControlFieldsFragment => node !== null && node !== undefined)

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

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Controls Table</h1>
        <Button onClick={() => exportToCSV(tableData, 'control_list')} icon={<DownloadIcon />} iconPosition="left">
          Export
        </Button>
      </div>
      <DataTable columns={columns} data={tableData} onRowClick={handleRowClick} />
    </div>
  )
}

export default ControlsTable
