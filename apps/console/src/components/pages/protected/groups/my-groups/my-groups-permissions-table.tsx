import React, { useState } from 'react'
import { ColumnDef } from '@tanstack/table-core'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { DataTable } from '@repo/ui/data-table'
import { useMyGroupsStore } from '@/hooks/useMyGroupsStore'
import { Permission, useGetGroupPermissionsQuery, useUpdateGroupMutation } from '@repo/codegen/src/schema'
import { useToast } from '@repo/ui/use-toast'
import { Trash2 } from 'lucide-react'
import { OBJECT_TYPE_CONFIG, ObjectTypes } from '@/constants/groups'

const permissionLabels: Record<Permission, string> = {
  [Permission.VIEWER]: 'View',
  [Permission.EDITOR]: 'Edit',
  [Permission.BLOCKED]: 'Blocked',
  [Permission.CREATOR]: 'Create',
}

const labelToPermission: Record<string, Permission> = Object.fromEntries(Object.entries(permissionLabels).map(([key, value]) => [value, key as Permission]))

const MyGroupsPermissionsTable = () => {
  const { selectedGroup } = useMyGroupsStore()
  const [{ data }] = useGetGroupPermissionsQuery({ variables: { groupId: selectedGroup || '' }, pause: !selectedGroup })
  const [{}, updateGroup] = useUpdateGroupMutation()
  const { toast } = useToast()
  const [roles, setRoles] = useState<Record<string, Permission>>({})

  const getPermissionKey = (permission: Permission, action: 'add' | 'remove', objectType: string) => {
    const objectKey = objectType.replace(/\s+/g, '') // Remove spaces for the prefix

    const roleKeyMap: Record<Permission, string> = {
      [Permission.VIEWER]: 'Viewer',
      [Permission.EDITOR]: 'Editor',
      [Permission.BLOCKED]: 'BlockedGroup',
      [Permission.CREATOR]: 'Creator', // Adjust if 'Creator' is not used in the schema
    }

    return `${action}${objectKey}${roleKeyMap[permission]}IDs`
  }

  const permissions =
    data?.group?.permissions?.map((perm) => ({
      id: perm.id ?? 'unknown-id',
      displayID: perm.displayID || 'N/A',
      name: perm.name || 'Unknown',
      objectType: perm.objectType || 'Unknown',
      role: perm.permissions as Permission,
    })) || []

  const handleRoleChange = async (id: string, newRoleLabel: string, objectType: string) => {
    if (!selectedGroup) return

    // Convert label back to Permission enum
    const newRole = labelToPermission[newRoleLabel] || Permission.VIEWER
    const previousRole = roles[id] ?? permissions.find((p) => p.id === id)?.role ?? Permission.VIEWER

    if (previousRole === newRole) return

    setRoles((prev) => ({ ...prev, [id]: newRole }))

    console.log('handleRoleChange - previousRole:', previousRole)
    console.log('handleRoleChange - newRole:', newRole)

    try {
      await updateGroup({
        updateGroupId: selectedGroup,
        input: {
          [getPermissionKey(previousRole, 'remove', objectType)]: [id],
          [getPermissionKey(newRole, 'add', objectType)]: [id],
        },
      })

      toast({ title: 'Permissions updated successfully', variant: 'success' })
    } catch (error) {
      console.error('Failed to update permissions:', error)
      toast({ title: 'Failed to update permissions', description: 'Something went wrong', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string, objectType: string, role: Permission) => {
    if (!selectedGroup) return

    try {
      await updateGroup({
        updateGroupId: selectedGroup,
        input: {
          [getPermissionKey(role, 'remove', objectType)]: [id],
        },
      })

      toast({ title: 'Permission removed successfully', variant: 'success' })
    } catch (error) {
      console.error('Failed to remove permission:', error)
      toast({ title: 'Failed to remove permission', description: 'Something went wrong', variant: 'destructive' })
    }
  }

  const columns: ColumnDef<{ id: string; displayID: string; name: string; objectType: string; role: Permission }>[] = [
    { header: 'Display ID', accessorKey: 'displayID' },
    { header: 'Name', accessorKey: 'name' },
    { header: 'Object Type', accessorKey: 'objectType' },
    {
      header: 'Role',
      accessorKey: 'role',
      cell: ({ row }) => {
        const objectType = row.original.objectType as ObjectTypes
        const roleOptions = OBJECT_TYPE_CONFIG[objectType]?.roleOptions || []

        return (
          <Select defaultValue={permissionLabels[row.original.role]} onValueChange={(value) => handleRoleChange(row.original.id, value, row.original.objectType)}>
            <SelectTrigger className="w-full">{permissionLabels[row.original.role]}</SelectTrigger>
            <SelectContent>
              {roleOptions.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="cursor-pointer hover:text-red-500" onClick={() => handleDelete(row.original.id, row.original.objectType, row.original.role)}>
          <Trash2 className="h-4 w-4" />
        </div>
      ),
    },
  ]

  return <DataTable columns={columns} data={permissions} />
}

export default MyGroupsPermissionsTable
