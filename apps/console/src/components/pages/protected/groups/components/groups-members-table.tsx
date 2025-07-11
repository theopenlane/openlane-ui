'use client'

import React, { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Trash2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { GroupMembershipRole, User } from '@repo/codegen/src/schema'
import { useGroupsStore } from '@/hooks/useGroupsStore'
import { useSession } from 'next-auth/react'
import { useDeleteGroupMembership, useGetGroupDetails, useUpdateGroupMembership } from '@/lib/graphql-hooks/groups'
import { useQueryClient } from '@tanstack/react-query'
import { useNotification } from '@/hooks/useNotification.tsx'

interface Member {
  id: string
  name: string
  role: GroupMembershipRole
  avatar?: string
}

const GroupsMembersTable = () => {
  const { data: session } = useSession()
  const { selectedGroup, isAdmin } = useGroupsStore()
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
        .filter((member) => member.user.id !== session?.user?.userId)
        .map((member) => ({
          id: member.membershipID || '',
          name: member.user.displayName || 'Unknown Member',
          role: member.role as GroupMembershipRole,
          avatar: member.user.avatarFile?.presignedURL || member.user.avatarRemoteURL || '',
        }))
        .sort((a, b) => {
          if (a.role === GroupMembershipRole.ADMIN && b.role !== GroupMembershipRole.ADMIN) return -1
          if (a.role !== GroupMembershipRole.ADMIN && b.role === GroupMembershipRole.ADMIN) return 1
          return 0
        })

      setUsers(sortedMembers)
    }
  }, [selectedGroup, members, session?.user?.userId])

  const handleRoleChange = async (id: string, newRole: GroupMembershipRole) => {
    setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, role: newRole } : user)))
    updateMembership({
      updateGroupMembershipId: id,
      input: {
        role: newRole,
      },
    })
    queryClient.invalidateQueries({ queryKey: ['groups', id] })
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMembership({ deleteGroupMembershipId: id })
      successNotification({ title: `Group membership deleted successfully.` })
    } catch {
      errorNotification({ title: 'Failed to delete group membership.' })
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
            <SelectTrigger disabled={!!isManaged || !isAdmin} className="w-28">
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
            disabled={!!isManaged || !isAdmin || isDeleting}
            type="button"
            onClick={() => handleDelete(user.id)}
            className={`text-brand flex justify-end mt-2.5 ${isManaged || !isAdmin ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )
      },
      meta: { className: 'flex justify-end' },
    },
  ]

  return <DataTable columns={columns} data={users} />
}

export default GroupsMembersTable
