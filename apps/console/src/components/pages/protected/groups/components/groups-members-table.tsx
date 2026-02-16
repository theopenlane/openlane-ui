'use client'

import React, { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Trash2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { GroupMembershipRole, User } from '@repo/codegen/src/schema'
import { useGroupsStore } from '@/hooks/useGroupsStore'
import { useSession } from 'next-auth/react'
import { useDeleteGroupMembership, useGetGroupDetails, useUpdateGroupMembership } from '@/lib/graphql-hooks/group'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification.tsx'
import { canEdit } from '@/lib/authz/utils'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { TableKeyEnum } from '@repo/ui/table-key'
import { ObjectTypes } from '@repo/codegen/src/type-names'

interface Member {
  id: string
  name: string
  role: GroupMembershipRole
  avatar?: string
  userId?: string
}

const GroupsMembersTable = () => {
  const { data: session } = useSession()
  const { selectedGroup } = useGroupsStore()
  const { data: permission } = useAccountRoles(ObjectTypes.GROUP, selectedGroup!)
  const { data } = useGetGroupDetails(selectedGroup)
  const { members, isManaged } = data?.group || {}
  const [users, setUsers] = useState<Member[]>([])
  const { mutateAsync: updateMembership } = useUpdateGroupMembership()
  const { mutateAsync: deleteMembership, isPending: isDeleting } = useDeleteGroupMembership()
  const { successNotification, errorNotification } = useNotification()

  const queryClient = useQueryClient()

  useEffect(() => {
    if (selectedGroup) {
      const membersList =
        members?.edges?.map((edge) => ({
          user: edge?.node?.user as User,
          role: edge?.node?.role,
          membershipID: edge?.node?.id,
        })) || []

      const sortedMembers = membersList
        .map((member) => ({
          id: member.membershipID || '',
          name: member.user.displayName || 'Unknown Member',
          role: member.role as GroupMembershipRole,
          avatar: member.user.avatarFile?.presignedURL || member.user.avatarRemoteURL || '',
          userId: member.user.id,
        }))
        .sort((a, b) => {
          if (a.role === GroupMembershipRole.ADMIN && b.role !== GroupMembershipRole.ADMIN) return -1
          if (a.role !== GroupMembershipRole.ADMIN && b.role === GroupMembershipRole.ADMIN) return 1
          return 0
        })

      setUsers(sortedMembers)
    }
  }, [selectedGroup, members])

  const handleRoleChange = async (id: string, newRole: GroupMembershipRole) => {
    setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, role: newRole } : user)))
    try {
      await updateMembership({
        updateGroupMembershipId: id,
        input: {
          role: newRole,
        },
      })
      successNotification({ title: `Group membership updated successfully.` })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
    queryClient.invalidateQueries({ queryKey: ['groups', id] })
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMembership({ deleteGroupMembershipId: id })
      successNotification({ title: `Group membership deleted successfully.` })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const userRoleOptions = Object.values(GroupMembershipRole)

  const columns: ColumnDef<Member>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar variant="small">
              {user.avatar ? <AvatarImage src={user.avatar} /> : null}
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{user.name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const user = row.original
        return (
          <Select value={user.role} onValueChange={(value) => handleRoleChange(user.id, value as GroupMembershipRole)}>
            <SelectTrigger disabled={!!isManaged || !canEdit(permission?.roles) || user?.userId === session?.user?.userId} className="w-28">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {userRoleOptions.map((role) => (
                <SelectItem key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      },
    },
    {
      accessorKey: 'actions',
      header: '',
      cell: ({ row }) => {
        const user = row.original

        return (
          <button
            disabled={!!isManaged || !canEdit(permission?.roles) || isDeleting}
            type="button"
            onClick={() => handleDelete(user.id)}
            className={`text-brand flex justify-end mt-2.5 ${isManaged || !canEdit(permission?.roles) ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )
      },
      meta: { className: 'flex justify-end' },
    },
  ]

  return <DataTable columns={columns} data={users} tableKey={TableKeyEnum.GROUP_MEMBERS} />
}

export default GroupsMembersTable
