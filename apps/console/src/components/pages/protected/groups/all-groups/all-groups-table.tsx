'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { DataTable } from '@repo/ui/data-table'
// import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { ColumnDef } from '@tanstack/table-core'
import { DownloadIcon, GlobeIcon, LockIcon, PencilIcon } from 'lucide-react'
import React, { useState } from 'react'

// Sample data
const data = [
  {
    name: 'CC1.2',
    ref: 'CC1.2',
    description: 'The board of directors demonstrates independence from management and exercises oversight of the development and performance of internal control. (COSO Principle 2)',
    tags: ['Security', 'CC1.2', 'Control Environment'],
    visibility: 'Public',
    updatedBy: 'Sarah Funkhouser',
    updatedAt: 'less than a day',
    createdBy: 'Kelsey Waters',
    createdAt: 'January 7, 2024 1:22 PM',
    owners: [{ avatar: '/path/to/avatar1.png', fallback: 'K' }],
  },
  {
    name: 'CC1.3',
    ref: 'CC1.3',
    description: 'Management establishes, with board oversight, structures, reporting lines, and appropriate authorities and responsibilities. (COSO Principle 3)',
    tags: ['Governance', 'CC1.3'],
    visibility: 'Private',
    updatedBy: 'John Doe',
    updatedAt: '2 days ago',
    createdBy: 'Kelsey Waters',
    createdAt: 'January 5, 2024 10:15 AM',
    owners: [{ avatar: '/path/to/avatar2.png', fallback: 'S' }],
  },
]

// Columns definition
const columns: ColumnDef<any>[] = [
  {
    header: 'Name',
    accessorKey: 'name',
    cell: ({ row }) => <div>{row.getValue('name')}</div>,
  },
  {
    header: 'Ref',
    accessorKey: 'ref',
    cell: ({ row }) => <div>{row.getValue('ref')}</div>,
  },
  {
    header: 'Description',
    accessorKey: 'description',
    cell: ({ row }) => (
      <div>
        <p>{row.getValue('description')}</p>
        <div className="mt-2 border-t border-dotted pt-2 flex flex-wrap gap-2">
          {row.original.tags.map((tag: string, index: number) => (
            <Badge key={index} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    ),
  },
  {
    header: 'Visibility',
    accessorKey: 'visibility',
    cell: ({ row }) => {
      const value = row.getValue('visibility')
      return (
        <span className="flex items-center gap-2">
          {value === 'Public' ? <GlobeIcon height={18} /> : <LockIcon height={18} />}
          {}value
        </span>
      )
    },
  },
  {
    header: 'Owners',
    accessorKey: 'owners',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.getValue('owners').map((owner: any, index: number) => (
          <Avatar key={index}>
            <AvatarImage src={owner.avatar} alt={owner.fallback} />
            <AvatarFallback>{owner.fallback}</AvatarFallback>
          </Avatar>
        ))}
      </div>
    ),
  },
]

// CSV export utility
const exportToCSV = (data: any[], fileName: string) => {
  const csvRows = []

  csvRows.push(['Name', 'Ref', 'Description', 'Tags', 'Status', 'Owners'].join(','))

  data.forEach((row) => {
    const owners = row.owners.map((o: any) => o.fallback).join(' | ')
    csvRows.push([row.name, row.ref, row.description, row.tags.join('; '), row.status, owners].join(','))
  })

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileName}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const AllGroupsTable: React.FC = () => {
  const [isSheetOpen, setSheetOpen] = useState(false)
  const [currentRow, setCurrentRow] = useState<any>(null)

  const handleRowClick = (row: any) => {
    setCurrentRow(row)
    setSheetOpen(true)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Controls Table</h1>
        <Button onClick={() => exportToCSV(data, 'control_list')} icon={<DownloadIcon />} iconPosition="left">
          Export
        </Button>
      </div>
      <DataTable columns={columns} data={data} onRowClick={(row: any) => handleRowClick(row)} />
    </div>
  )
}

export default AllGroupsTable
