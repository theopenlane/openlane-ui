import React, { useState } from 'react'
import { ColumnDef } from '@tanstack/table-core'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { DataTable } from '@repo/ui/data-table'
import { useMyGroupsStore } from '@/hooks/useMyGroupsStore'
import { Permission, useGetGroupPermissionsQuery, useUpdateGroupMutation } from '@repo/codegen/src/schema'
import { useToast } from '@repo/ui/use-toast'

const permissionLabels: Record<Permission, string> = {
  [Permission.VIEWER]: 'View',
  [Permission.EDITOR]: 'Edit',
  [Permission.BLOCKED]: 'Blocked',
  [Permission.CREATOR]: 'Create',
}

const roleOptions: { value: Permission; label: string }[] = Object.entries(permissionLabels).map(([key, label]) => ({
  value: key as Permission,
  label,
}))

const MyGroupsPermissionsTable = () => {
  const { selectedGroup } = useMyGroupsStore()
  const [{ data }] = useGetGroupPermissionsQuery({ variables: { groupId: selectedGroup || '' }, pause: !selectedGroup })
  const [{}, updateGroup] = useUpdateGroupMutation()
  const { toast } = useToast()

  const [roles, setRoles] = useState<Record<string, Permission>>({})

  // Function to generate the correct GraphQL key based on object type and permission
  const getPermissionKey = (permission: Permission, action: 'add' | 'remove', objectType: string) => {
    const objectKey = objectType.replace(/\s+/g, '')
    const roleKey = permission === Permission.BLOCKED ? 'BlockedGroup' : permission.charAt(0) + permission.slice(1).toLowerCase() // First letter uppercase

    return `${action}${objectKey}${roleKey}IDs`
  }

  const permissions =
    data?.group?.permissions?.map((perm) => ({
      id: perm.id ?? 'unknown-id',
      displayID: perm.displayID || 'N/A',
      name: perm.name || 'Unknown',
      objectType: perm.objectType || 'Unknown',
      role: perm.permissions as Permission,
    })) || []

  const handleRoleChange = async (id: string, newRole: Permission, objectType: string) => {
    if (!selectedGroup) return

    const previousRole = roles[id] || permissions.find((p) => p.id === id)?.role || Permission.VIEWER

    if (previousRole === newRole) return

    setRoles((prev) => ({ ...prev, [id]: newRole }))

    const removeRoleField = getPermissionKey(previousRole, 'remove', objectType)
    const addRoleField = getPermissionKey(newRole, 'add', objectType)

    try {
      await updateGroup({
        updateGroupId: selectedGroup,
        input: {
          [removeRoleField]: [id],
          [addRoleField]: [id],
        },
      })

      toast({
        title: 'Permissions updated successfully',
        variant: 'success',
      })
    } catch (error) {
      console.error('Failed to update permissions:', error)
      toast({
        title: 'Failed to update permissions',
        description: 'Something went wrong',
        variant: 'destructive',
      })
    }
  }

  const columns: ColumnDef<{ id: string; displayID: string; name: string; objectType: string; role: Permission }>[] = [
    {
      header: 'Display ID',
      accessorKey: 'displayID',
    },
    {
      header: 'Name',
      accessorKey: 'name',
    },
    {
      header: 'Object Type',
      accessorKey: 'objectType',
    },
    {
      header: 'Role',
      accessorKey: 'role',
      cell: ({ row }) => (
        <Select defaultValue={row.original.role} onValueChange={(value) => handleRoleChange(row.original.id, value as Permission, row.original.objectType)}>
          <SelectTrigger className="w-full">{permissionLabels[row.original.role]}</SelectTrigger>
          <SelectContent>
            {roleOptions.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
  ]

  return <DataTable columns={columns} data={permissions} />
}

export default MyGroupsPermissionsTable
