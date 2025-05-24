'use client'

import React, { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { DataTable } from '@repo/ui/data-table'
import { EllipsisVertical } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { ColumnDef } from '@tanstack/react-table'
import { useGetProgramMembers, useUpdateProgram } from '@/lib/graphql-hooks/programs'
import { Avatar } from '@/components/shared/avatar/avatar'
import { ProgramMembershipRole, User } from '@repo/codegen/src/schema'
import { ProgramSettingsAssignUserDialog } from './program-settings-assign-user-dialog'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { EditGroupRoleDialog } from './program-settings-edit-role-dialog' // You can reuse for users
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'

type MemberRow = {
  id: string
  role: 'Edit' | 'View'
  user: User
}

export const ProgramSettingsUsers = () => {
  const searchParams = useSearchParams()
  const programId = searchParams.get('id')
  const queryClient = useQueryClient()

  const [pagination, setPagination] = useState<TPagination>({
    ...DEFAULT_PAGINATION,
    pageSize: 5,
    query: { first: 5 },
  })

  const [selectedUser, setSelectedUser] = useState<MemberRow | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const { mutateAsync: updateProgram, isPending: isUpdating } = useUpdateProgram()

  const where = { programID: programId || undefined }

  const { data, isLoading, isFetching } = useGetProgramMembers({
    pagination,
    where,
    enabled: !!programId,
  })

  const handleRemove = async () => {
    if (!programId || !selectedUser) return

    try {
      await updateProgram({
        updateProgramId: programId,
        input: {
          removeProgramMembers: [selectedUser.id],
        },
      })

      queryClient.invalidateQueries({
        predicate: (query) => {
          const [resource] = query.queryKey
          return resource === 'memberships' || resource === 'programMemberships'
        },
      })

      toast.success('User removed from program.')
    } catch (error) {
      console.error(error)
      toast.error('Failed to remove user.')
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  const handleRoleChange = async (newRole: 'Edit' | 'View') => {
    // if (!programId || !selectedUser) return
    // try {
    //   await updateProgram({
    //     updateProgramId: programId,
    //     input: {
    //       updateProgramMembers: [
    //         {
    //           programMemberID: selectedUser.id,
    //           role: newRole === 'Edit' ? ProgramMembershipRole.ADMIN : ProgramMembershipRole.MEMBER,
    //         },
    //       ],
    //     },
    //   })
    //   toast.success('User role updated.')
    //   queryClient.invalidateQueries({ queryKey: ['programMemberships'] })
    // } catch (error) {
    //   console.error(error)
    //   toast.error('Failed to update user role.')
    // } finally {
    //   setIsEditDialogOpen(false)
    // }
  }

  const users: MemberRow[] =
    (data?.programMemberships?.edges?.map((edge) => ({
      id: edge?.node?.id,
      role: edge?.node?.role === ProgramMembershipRole.ADMIN ? 'Edit' : 'View',
      user: edge?.node?.user,
    })) as MemberRow[]) ?? []

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
                setSelectedUser(row.original)
                setIsEditDialogOpen(true)
              }}
            >
              Edit role
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onSelect={() => {
                setSelectedUser(row.original)
                setIsDeleteDialogOpen(true)
              }}
              disabled={isUpdating}
            >
              Remove user
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <>
      {selectedUser && (
        <>
          <EditGroupRoleDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} groupName={selectedUser.user.displayName} currentRole={selectedUser.role} onSubmit={handleRoleChange} />

          <ConfirmationDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            title="Remove user"
            description={`Are you sure you want to remove ${selectedUser.user.displayName} from the program?`}
            confirmationText="Remove user"
            confirmationTextVariant="destructive"
            onConfirm={handleRemove}
          />
        </>
      )}

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

          <DataTable
            columns={userColumns}
            data={users}
            loading={isLoading}
            pagination={pagination}
            onPaginationChange={setPagination}
            paginationMeta={{
              totalCount: data?.programMemberships?.totalCount ?? 0,
              pageInfo: data?.programMemberships?.pageInfo,
              isLoading: isFetching,
            }}
          />
        </div>
      </section>
    </>
  )
}
