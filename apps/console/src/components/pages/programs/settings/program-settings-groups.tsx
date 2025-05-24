'use client'

import React, { useState } from 'react'
import { Button } from '@repo/ui/button'
import { DataTable } from '@repo/ui/data-table'
import { EllipsisVertical } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { ColumnDef } from '@tanstack/react-table'
import { useGetProgramGroups, useUpdateProgram } from '@/lib/graphql-hooks/programs'
import { Avatar } from '@/components/shared/avatar/avatar'
import { Group as GroupType } from '@repo/codegen/src/schema'
import { useSearchParams } from 'next/navigation'
import { ProgramSettingsAssignGroupDialog } from './program-settings-assign-groups-dialog'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { EditGroupRoleDialog } from './program-settings-edit-role-dialog'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'

type GroupRow = {
  id: string
  name: string
  membersCount?: number
  role: string
  group: GroupType
}

export const ProgramSettingsGroups = () => {
  const searchParams = useSearchParams()
  const programId = searchParams.get('id')
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<GroupRow | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const { mutateAsync: updateProgram, isPending: isRemoving } = useUpdateProgram()

  const { data, isLoading } = useGetProgramGroups(programId ?? null)

  const blockedGroups = data?.program?.blockedGroups ?? []

  const groups: GroupRow[] = blockedGroups.map((group) => {
    return {
      id: group?.id,
      name: group?.displayName,
      membersCount: group?.members?.totalCount ?? 0,
      role: 'TODO', // replace this with derived logic from `permissions` if needed
      group,
    } as GroupRow
  })

  const handleRemove = async (groupId: string) => {
    if (!programId) return

    try {
      await updateProgram({
        updateProgramId: programId,
        input: {
          removeBlockedGroupIDs: [groupId],
        },
      })

      queryClient.invalidateQueries({
        predicate: (query) => {
          const [resource] = query.queryKey
          return resource === 'programGroups'
        },
      })

      toast.success('Group removed from program.')
    } catch (error) {
      console.error(error)
      toast.error('Failed to remove group.')
    }
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
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-8 h-7 !p-0">
              <EllipsisVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onSelect={() => {
                setSelectedGroup(row.original)
                setIsDialogOpen(true)
              }}
            >
              Edit role
            </DropdownMenuItem>{' '}
            <DropdownMenuItem
              className="text-destructive"
              onSelect={() => {
                setSelectedGroup(row.original)
                setIsDeleteDialogOpen(true)
              }}
            >
              Remove group
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <>
      {selectedGroup && (
        <>
          <EditGroupRoleDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            groupName={selectedGroup.name}
            currentRole={selectedGroup.role}
            onSubmit={async (newRole) => {
              // TODO: Replace with your real mutation call
              // await updateProgram({ ... })

              toast.success(`Role updated to ${newRole}`)
              setIsDialogOpen(false)
            }}
          />
          <ConfirmationDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            title="Remove group"
            description={`Are you sure you want to remove ${selectedGroup.name} from the program?`}
            confirmationText="Remove group"
            confirmationTextVariant="destructive"
            onConfirm={() => handleRemove(selectedGroup.id)}
          />
        </>
      )}
      <section className="flex gap-14">
        <div className="w-48 shrink-0">
          <h3 className="font-medium text-xl mb-2">Groups</h3>
          <p className="text-sm">Assign groups access to the program</p>
        </div>

        <div className="space-y-2 w-full max-w-[847px]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg">Assigned groups</h2>
            <ProgramSettingsAssignGroupDialog />
          </div>

          <DataTable columns={groupColumns} data={groups} loading={isLoading} />
        </div>
      </section>
    </>
  )
}
