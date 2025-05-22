'use client'

import React from 'react'
import { Button } from '@repo/ui/button'
import { DataTable } from '@repo/ui/data-table'
import { EllipsisVertical } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { ColumnDef } from '@tanstack/react-table'
import { useGetProgramSettings } from '@/lib/graphql-hooks/programs'
import { Avatar } from '@/components/shared/avatar/avatar'
import { Group as GroupType } from '@repo/codegen/src/schema'

type GroupRow = {
  id: string
  name: string
  membersCount?: number
  role: 'Edit' | 'View'
  group: GroupType
}

const groupColumns: ColumnDef<GroupRow>[] = [
  {
    accessorKey: 'name',
    header: 'Groups',
    cell: ({ row }) => {
      const group = row.original.group
      return (
        <div className="flex items-center gap-2">
          <Avatar entity={group} className="h-8 w-8" />
          <div>
            <div className="font-medium">{group.displayName}</div>
            <div className="text-muted-foreground text-sm">{row.original.membersCount ?? 0} members</div>
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
          <DropdownMenuItem className="text-destructive">Remove group</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export const ProgramSettingsGroups = ({ programId }: { programId: string }) => {
  const { data, isLoading } = useGetProgramSettings(programId)

  const groups: GroupRow[] = [
    ...(data?.program?.viewers?.map((viewer) => ({
      id: viewer.id,
      name: viewer.displayName,
      membersCount: undefined,
      role: 'View',
      group: viewer,
    })) ?? []),
    ...(data?.program?.editors?.map((editor) => ({
      id: editor.id,
      name: editor.displayName,
      membersCount: undefined,
      role: 'Edit',
      group: editor,
    })) ?? []),
  ]

  return (
    <section className="flex gap-14">
      <div className="w-48 shrink-0">
        <h3 className="font-medium text-xl mb-2">Groups</h3>
        <p className="text-sm">Assign groups access to the program</p>
      </div>

      <div className="space-y-2 w-full max-w-[847px]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg">Assigned groups</h2>
          <Button className="h-8 !px-2">Assign</Button>
        </div>

        <DataTable columns={groupColumns} data={groups} isLoading={isLoading} />
      </div>
    </section>
  )
}
