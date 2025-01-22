'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { DataTable } from '@repo/ui/data-table'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { ColumnDef } from '@tanstack/table-core'
import { DownloadIcon, PencilIcon } from 'lucide-react'
import React, { useState } from 'react'

// Sample data
const data = [
  {
    name: 'CC1.2',
    ref: 'CC1.2',
    description: 'The board of directors demonstrates independence from management and exercises oversight of the development and performance of internal control. (COSO Principle 2)',
    tags: ['Security', 'CC1.2', 'Control Environment'],
    status: 'Overdue',
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
    status: 'In Progress',
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
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }) => <span className="flex items-center gap-2">{row.getValue('status')}</span>,
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

const ControlsTable: React.FC = () => {
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
      <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          {currentRow && (
            <div>
              {/* Header Section */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold text-oxford-blue-900">{currentRow.name}</h1>
                  <Button variant="outline" icon={<PencilIcon />} iconPosition="left" className="ml-2 py-2 px-2" size="sm">
                    Edit
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center border p-4 rounded-md mb-4">
                {/* Updated Info */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Updated:</span>
                  <span className="text-sm">{currentRow.updatedAt}</span>
                  <Avatar variant="small">
                    <AvatarImage src="/path/to/updated-by-avatar.png" alt="Updated By" />
                    <AvatarFallback>{currentRow.updatedBy[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{currentRow.updatedBy}</span>
                </div>

                <div className="border h-6" />

                {/* Created Info */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Created:</span>
                  <span className="text-sm">{currentRow.createdAt}</span>
                  <Avatar variant="small">
                    <AvatarImage src="/path/to/created-by-avatar.png" alt="Created By" />
                    <AvatarFallback>{currentRow.createdBy[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{currentRow.createdBy}</span>
                </div>
              </div>

              {/* Description Section */}
              <h2 className="text-xl mt-4 font-medium">Point of Focus</h2>
              <p className="text-sm ">{currentRow.description}</p>

              {/* Tags Section */}
              <div className="mt-4">
                <h3 className="text-xl font-medium font-bold">Tags</h3>
                <div className="flex gap-2 mt-2">
                  {currentRow.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default ControlsTable
