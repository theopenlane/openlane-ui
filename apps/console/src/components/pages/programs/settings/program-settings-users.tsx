'use client'

import { Button } from '@repo/ui/button'
import { DataTable } from '@repo/ui/data-table'
import { MoreHorizontal } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { ColumnDef } from '@tanstack/react-table'
import React from 'react'

type User = {
  id: string
  name: string
  email: string
  role: string
}

// todo: role part will data will be admin/member and we need to render edit/view so make an enum

const users: User[] = [
  { id: '1', name: 'Sally Roberts', email: 'sally.roberts@gmail.com', role: 'Edit' },
  { id: '2', name: 'Sandy Ross', email: 'sandy.ross.uk92@gmail.com', role: 'View' },
]

const userColumns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Users',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.name}</div>
        <div className="text-muted-foreground text-sm">{row.original.email}</div>
      </div>
    ),
  },
  {
    accessorKey: 'role',
    header: 'Permissions',
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
          <DropdownMenuItem className="text-destructive">Remove user</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export const ProgramSettingsUsers = () => {
  return (
    <section className="flex gap-14">
      <div className="max-w-48">
        <h3 className=" text-xl mb-2">Users</h3>
        <p className="text-base">Assign users as admins or members to the program</p>
      </div>

      <div className="space-y-2 w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-lg">Assigned users</h2>
          <Button className="h-8 !px-2">Assign</Button>
        </div>

        <DataTable wrapperClass="min-w-[847px]" columns={userColumns} data={users} />
      </div>
    </section>
  )
}
