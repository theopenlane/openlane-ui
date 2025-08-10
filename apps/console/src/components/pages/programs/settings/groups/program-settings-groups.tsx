'use client'

import React, { useMemo, useState } from 'react'
import { Button } from '@repo/ui/button'
import { DataTable } from '@repo/ui/data-table'
import { EllipsisVertical } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { ColumnDef } from '@tanstack/react-table'
import { useGetProgramGroups, useUpdateProgram } from '@/lib/graphql-hooks/programs'
import { Avatar } from '@/components/shared/avatar/avatar'
import { Group as GroupType, UpdateProgramInput } from '@repo/codegen/src/schema'
import { useSearchParams } from 'next/navigation'
import { ProgramSettingsAssignGroupDialog } from './program-settings-assign-groups-dialog'
import { useQueryClient } from '@tanstack/react-query'
import { EditGroupRoleDialog } from '../program-settings-edit-role-dialog'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useNotification } from '@/hooks/useNotification'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import Pagination from '@repo/ui/pagination'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

type GroupRow = {
  id: string
  name: string
  membersCount?: number
  role: 'Viewer' | 'Editor'
  group: GroupType
}

export const ProgramSettingsGroups = () => {
  const searchParams = useSearchParams()
  const programId = searchParams.get('id')
  const queryClient = useQueryClient()
  const [pagination, setPagination] = useState<TPagination>({
    ...DEFAULT_PAGINATION,
    pageSize: 5,
    page: 1,
    query: {},
  })

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<GroupRow | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const { mutateAsync: updateProgram } = useUpdateProgram()
  const { successNotification, errorNotification } = useNotification()

  const { data, isLoading } = useGetProgramGroups({
    programId: programId ?? null,
  })

  const groups: GroupRow[] = useMemo(() => {
    const viewers = data?.program?.viewers?.edges ?? []
    const editors = data?.program?.editors?.edges ?? []

    return [
      ...((viewers.map((edge) => ({
        id: edge?.node?.id,
        name: edge?.node?.name,
        membersCount: data?.program?.viewers.totalCount,
        role: 'Viewer',
        group: edge?.node,
      })) as GroupRow[]) || []),
      ...((editors.map((edge) => ({
        id: edge?.node?.id,
        name: edge?.node?.name,
        membersCount: data?.program?.editors.totalCount,
        role: 'Editor',
        group: edge?.node,
      })) as GroupRow[]) || []),
    ]
  }, [data])

  const paginatedGroups = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    return groups.slice(start, end)
  }, [groups, pagination])

  const handleRemove = async (groupId: string, role: GroupRow['role']) => {
    if (!programId) return

    const input: UpdateProgramInput = {}

    if (role === 'Viewer') {
      input.removeViewerIDs = [groupId]
    } else if (role === 'Editor') {
      input.removeEditorIDs = [groupId]
    }

    try {
      await updateProgram({
        updateProgramId: programId,
        input,
      })

      queryClient.invalidateQueries({ queryKey: ['programs', programId, 'groups'] })
      queryClient.invalidateQueries({ queryKey: ['groups'] })

      successNotification({
        title: 'Group removed',
        description: 'The group has been successfully removed from the program.',
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleRoleChange = async (newRole: 'Viewer' | 'Editor') => {
    if (!programId || !selectedGroup) return
    if (newRole === selectedGroup.role) {
      setIsDialogOpen(false)
      return
    }

    try {
      const input: UpdateProgramInput = {}

      if (selectedGroup.role === 'Viewer') {
        input.removeViewerIDs = [selectedGroup.id]
      } else if (selectedGroup.role === 'Editor') {
        input.removeEditorIDs = [selectedGroup.id]
      }

      if (newRole === 'Viewer') {
        input.addViewerIDs = [selectedGroup.id]
      } else if (newRole === 'Editor') {
        input.addEditorIDs = [selectedGroup.id]
      }

      await updateProgram({
        updateProgramId: programId,
        input,
      })

      queryClient.invalidateQueries({ queryKey: ['programs', programId, 'groups'] })

      successNotification({
        title: 'Role Updated',
        description: `Role updated to ${newRole}`,
      })

      setIsDialogOpen(false)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
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
              <div className="font-medium">{group.name}</div>
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
            </DropdownMenuItem>
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
          <EditGroupRoleDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} groupName={selectedGroup.name} currentRole={selectedGroup.role} onSubmit={handleRoleChange} />
          <ConfirmationDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            title="Remove Group"
            description={
              <>
                Removing <b>{selectedGroup.name}</b> from the program will revoke all group members permissions to this program.
              </>
            }
            confirmationText="Remove"
            confirmationTextVariant="destructive"
            onConfirm={() => handleRemove(selectedGroup.id, selectedGroup.role)}
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

          <DataTable columns={groupColumns} data={paginatedGroups} loading={isLoading} />
          <Pagination
            currentPage={pagination.page}
            totalPages={Math.ceil(groups.length / pagination.pageSize)}
            pageSize={pagination.pageSize}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
            onPageSizeChange={(size) => setPagination({ page: 1, pageSize: size, query: {} })}
          />
        </div>
      </section>
    </>
  )
}
