'use client'

import React, { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Trash2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { UserRole } from '@repo/codegen/src/schema'
import { useMyGroupsStore } from '@/hooks/useMyGroupsStore'

interface Member {
  id: string
  name: string
  role: UserRole
  avatar?: string
}

const MyGroupsMembersTable = () => {
  const { selectedGroup } = useMyGroupsStore()

  const [users, setUsers] = useState<Member[]>([])

  useEffect(() => {
    if (selectedGroup) {
      setUsers(
        selectedGroup.members.map((member, index) => ({
          id: `${selectedGroup.id}-${index}`,
          name: member.user.firstName || 'Unknown Member',
          role: UserRole.MEMBER,
          avatar: member.user.avatarFile?.presignedURL || member.user.avatarRemoteURL || '',
        })),
      )
    }
  }, [selectedGroup])

  const handleRoleChange = (id: string, newRole: UserRole) => {
    setUsers((prev) => prev.map((user) => (user.id === id ? { ...user, role: newRole } : user)))
  }

  const handleDelete = (id: string) => {
    setUsers((prev) => prev.filter((user) => user.id !== id))
  }

  // Convert UserRole enum to an array for dropdown options
  const userRoleOptions = Object.values(UserRole)

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
          <Select value={user.role} onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}>
            <SelectTrigger className="w-28 border border-brand ">
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
          <button onClick={() => handleDelete(user.id)} className="text-brand flex justify-end mt-2.5 ">
            <Trash2 className="h-5 w-5" />
          </button>
        )
      },
      meta: { className: 'flex justify-end' },
    },
  ]

  return <DataTable columns={columns} data={users} noResultsText="No users found" />
}

export default MyGroupsMembersTable
