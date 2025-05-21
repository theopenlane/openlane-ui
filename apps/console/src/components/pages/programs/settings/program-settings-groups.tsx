'use client'

import React from 'react'
import { Button } from '@repo/ui/button'
import { DataTable } from '@repo/ui/data-table'
import { MoreHorizontal } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { ColumnDef } from '@tanstack/react-table'

type Group = {
  id: string
  name: string
  membersCount: number
}

const groups: Group[] = [{ id: '1', name: 'Operations', membersCount: 34 }]

const groupColumns: ColumnDef<Group>[] = [
  {
    accessorKey: 'name',
    header: 'Groups',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.name}</div>
        <div className="text-muted-foreground text-sm">{row.original.membersCount} members</div>
      </div>
    ),
  },
  {
    header: 'Permissions',
    cell: () => 'Edit',
  },
  {
    id: 'actions',
    header: 'Action',
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Edit role</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">Remove group</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export const ProgramSettingsGroups = () => {
  return (
    <section className="flex gap-14">
      <div className="max-w-48">
        <h3 className="font-medium text-xl mb-2">Groups</h3>
        <p className="text-sm">Assign groups access to the program</p>
      </div>

      <div className="space-y-2 w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-lg">Assigned groups</h2>
          <Button className="h-8 !px-2">Assign</Button>
        </div>

        <DataTable wrapperClass="min-w-[847px]" columns={groupColumns} data={groups} />
      </div>
    </section>
  )
}
