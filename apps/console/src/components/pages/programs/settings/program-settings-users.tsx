'use client'

import React from 'react'
import { Button } from '@repo/ui/button'
import { DataTable } from '@repo/ui/data-table'
import { EllipsisVertical } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { ColumnDef } from '@tanstack/react-table'
import { useGetProgramSettings } from '@/lib/graphql-hooks/programs'
import { Avatar } from '@/components/shared/avatar/avatar'
import { ProgramMembershipRole, User } from '@repo/codegen/src/schema'
import { ProgramSettingsAssignUserDialog } from './program-settings-assign-user-dialog'

// Define the type for the member that the table will use
type MemberRow = {
  id: string
  role: 'Edit' | 'View'
  user: User
}

const userColumns: ColumnDef<MemberRow>[] = [
  {
    accessorKey: 'name',
    header: 'Users',
    cell: ({ row }) => {
      const user = row.original.user
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8" entity={user} />
          <div>
            <p>{user.displayName}</p>
            <div className="text-sm">{user.email}</div>
          </div>
        </div>
      )
    },
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
          <Button variant="outline" className="w-8 h-7 !p-0">
            <EllipsisVertical />
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

export const ProgramSettingsUsers = ({ programId }: { programId: string }) => {
  const { data, isLoading } = useGetProgramSettings(programId)

  const users: MemberRow[] =
    (data?.program?.members?.edges?.map((edge) => ({
      id: edge?.node?.user.id,
      role: edge?.node?.role === ProgramMembershipRole.ADMIN ? 'Edit' : 'View',
      user: edge?.node?.user,
    })) as MemberRow[]) ?? []

  return (
    <section className="flex gap-14">
      <div className="w-48 shrink-0">
        <h3 className="text-xl mb-2">Users</h3>
        <p className="text-sm">Assign users as admins or members to the program</p>
      </div>

      <div className="space-y-2 w-full max-w-[847px]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg">Assigned users</h2>
          <ProgramSettingsAssignUserDialog />
        </div>

        <DataTable columns={userColumns} data={users} loading={isLoading} />
      </div>
    </section>
  )
}
