'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { DataTable } from '@repo/ui/data-table'
// import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { ColumnDef } from '@tanstack/table-core'
import { GlobeIcon, LockIcon, Users2Icon } from 'lucide-react'
import React, { useState } from 'react'
import { TableCell, TableRow } from '../../../../../../../../packages/ui/src/table/table'
import { myGroupsTableStyles } from './my-groups-table-styles'
import CreateGroupDialog from '@/app/(protected)/groups/my-groups/create-group-dialog'

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
    members: [{ avatar: '/path/to/avatar1.png', fallback: 'K' }],
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
    members: [{ avatar: '/path/to/avatar2.png', fallback: 'S' }],
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
    header: 'Description',
    accessorKey: 'description',
    cell: ({ row }) => (
      <div>
        <p>{row.getValue('description')}</p>
        <div className="mt-2 border-t border-dashed pt-2 flex flex-wrap gap-2">
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
    header: 'Members',
    accessorKey: 'members',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.getValue('members').map((owner: any, index: number) => (
          <Avatar key={index}>
            <AvatarImage src={owner.avatar} alt={owner.fallback} />
            <AvatarFallback>{owner.fallback}</AvatarFallback>
          </Avatar>
        ))}
      </div>
    ),
  },
]

const MyGroupsTable: React.FC = () => {
  const { tableRow, keyIcon, message } = myGroupsTableStyles()

  const [isSheetOpen, setSheetOpen] = useState(false)
  const [currentRow, setCurrentRow] = useState<any>(null)

  const handleRowClick = (row: any) => {
    setCurrentRow(row)
    setSheetOpen(true)
  }

  return (
    <DataTable
      columns={columns}
      data={data}
      onRowClick={(row: any) => handleRowClick(row)}
      noDataMarkup={
        <TableRow className={tableRow()}>
          <TableCell colSpan={columns.length}>
            <div className="flex flex-col justify-center items-center">
              <Users2Icon height={89} width={89} className={keyIcon()} strokeWidth={1} color="#DAE3E7" />
              <p className={message()}> You're not part of any group.</p>
              <CreateGroupDialog triggerText />
            </div>
          </TableCell>
        </TableRow>
      }
    />
  )
}

export default MyGroupsTable
