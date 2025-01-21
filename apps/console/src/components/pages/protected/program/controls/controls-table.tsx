'use client'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/table-core'
import { DownloadIcon } from 'lucide-react'
import React from 'react'

// Sample data
const data = [
  {
    name: 'CC1.2',
    ref: 'CC1.2',
    description: 'The board of directors demonstrates independence from management and exercises oversight of the development and performance of internal control. (COSO Principle 2)',
    tags: ['Security', 'CC1.2', 'Control Environment'],
    status: 'Overdue',
    owners: [{ avatar: '/path/to/avatar1.png', fallback: 'K' }],
  },
  {
    name: 'CC1.2',
    ref: 'CC1.2',
    description: 'The board of directors demonstrates independence from management and exercises oversight of the development and performance of internal control. (COSO Principle 2)',
    tags: ['Security', 'CC1.2', 'Control Environment'],
    status: 'Overdue',
    owners: [{ avatar: '/path/to/avatar1.png', fallback: 'K' }],
  },
  {
    name: 'CC1.2',
    ref: 'CC1.2',
    description: 'The board of directors demonstrates independence from management and exercises oversight of the development and performance of internal control. (COSO Principle 2)',
    tags: ['Security', 'CC1.2', 'Control Environment'],
    status: 'Overdue',
    owners: [
      { avatar: '/path/to/avatar1.png', fallback: 'K' },
      { avatar: '/path/to/avatar2.png', fallback: 'S' },
    ],
  },
  {
    name: 'CC1.2',
    ref: 'CC1.2',
    description: 'The board of directors demonstrates independence from management and exercises oversight of the development and performance of internal control. (COSO Principle 2)',
    tags: ['Security', 'CC1.2', 'Control Environment'],
    status: 'Overdue',
    owners: [{ avatar: '/path/to/avatar1.png', fallback: 'K' }],
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
        <div className="mt-2 border-t border-dotted border-gray-300 pt-2 flex flex-wrap gap-2">
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
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }) => (
      <span className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0 4.142-3.358 7.5-7.5 7.5S4.5 16.142 4.5 12 7.858 4.5 12 4.5s7.5 3.358 7.5 7.5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v4.5m0 2.25h.008v.008H12v-.008z" />
        </svg>
        {row.getValue('status')}
      </span>
    ),
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

  // Add header row
  csvRows.push(['Name', 'Ref', 'Description', 'Tags', 'Status', 'Owners'].join(','))

  // Add data rows
  data.forEach((row) => {
    const owners = row.owners.map((o: any) => o.fallback).join(' | ') // Concatenate owner initials
    csvRows.push(
      [
        row.name,
        row.ref,
        row.description,
        row.tags.join('; '), // Join tags with a semicolon
        row.status,
        owners,
      ].join(','),
    )
  })

  // Create and download the CSV file
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileName}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const ControlsTable: React.FC = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Controls Table</h1>
        <Button onClick={() => exportToCSV(data, 'control_list')} icon={<DownloadIcon />} iconPosition="left">
          Export
        </Button>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  )
}

export default ControlsTable
