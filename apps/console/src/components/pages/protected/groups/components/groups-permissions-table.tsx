import React, { useState } from 'react'
import { ColumnDef } from '@tanstack/table-core'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { DataTable } from '@repo/ui/data-table'
import { useNotification } from '@/hooks/useNotification'
import { Trash2 } from 'lucide-react'
import { OBJECT_TYPE_CONFIG, objectTypeInputToEnumMap, ObjectTypes } from '@/constants/groups'
import { useGroupsStore } from '@/hooks/useGroupsStore'
import { useGetGroupPermissions, useUpdateGroup } from '@/lib/graphql-hooks/groups'
import { useQueryClient } from '@tanstack/react-query'
import { Permission } from '@repo/codegen/src/schema'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { TableKeyEnum } from '@repo/ui/table-key'

const PERMISSION_LABELS: Record<Permission, string> = {
  [Permission.VIEWER]: 'View',
  [Permission.EDITOR]: 'Edit',
  [Permission.BLOCKED]: 'Blocked',
  [Permission.CREATOR]: 'Create',
}

const LABEL_TO_PERMISSION: Record<string, Permission> = Object.fromEntries(Object.entries(PERMISSION_LABELS).map(([key, value]) => [value, key as Permission]))

const GroupsPermissionsTable = () => {
  const { selectedGroup } = useGroupsStore()
  const { data } = useGetGroupPermissions(selectedGroup)
  const { mutateAsync: updateGroup } = useUpdateGroup()
  const { successNotification, errorNotification } = useNotification()
  const [roles, setRoles] = useState<Record<string, Permission>>({})
  const queryClient = useQueryClient()

  const getPermissionKey = (permission: Permission, action: 'add' | 'remove', objectType: string) => {
    const objectKey = objectType.replace(/\s+/g, '')
    const roleKeyMap: Record<Permission, string> = {
      [Permission.VIEWER]: 'Viewer',
      [Permission.EDITOR]: 'Editor',
      [Permission.BLOCKED]: 'BlockedGroup',
      [Permission.CREATOR]: 'Creator',
    }
    return `${action}${objectKey}${roleKeyMap[permission]}IDs`
  }

  const permissions =
    data?.group.permissions.edges?.map((edge) => ({
      id: edge?.node?.id ?? 'unknown-id',
      name: edge?.node?.name || 'Unknown',
      objectType: edge?.node?.objectType || 'Unknown',
      role: edge?.node?.permissions as Permission,
    })) || []

  const handleRoleChange = async (id: string, newRoleLabel: string, objectType: string) => {
    if (!selectedGroup) return

    const newRole = LABEL_TO_PERMISSION[newRoleLabel] || Permission.VIEWER
    const previousRole = roles[id] ?? permissions.find((p) => p.id === id)?.role ?? Permission.VIEWER

    if (previousRole === newRole) return

    setRoles((prev) => ({ ...prev, [id]: newRole }))

    try {
      await updateGroup({
        updateGroupId: selectedGroup,
        input: {
          [getPermissionKey(previousRole, 'remove', objectType)]: [id],
          [getPermissionKey(newRole, 'add', objectType)]: [id],
        },
      })
      queryClient.invalidateQueries({ queryKey: ['groups', selectedGroup] })

      successNotification({ title: 'Permissions updated successfully' })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleDelete = async (id: string, objectType: string, role: Permission) => {
    if (!selectedGroup) return

    try {
      await updateGroup({
        updateGroupId: selectedGroup,
        input: { [getPermissionKey(role, 'remove', objectType)]: [id] },
      })
      queryClient.invalidateQueries({ queryKey: ['groups', selectedGroup] })

      successNotification({ title: 'Permission removed successfully' })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const columns: ColumnDef<{ id: string; name: string; objectType: string; role: Permission }>[] = [
    { header: 'Name', accessorKey: 'name' },
    { header: 'Object Type', accessorKey: 'objectType' },
    {
      header: 'Role',
      accessorKey: 'role',
      cell: ({ row }) => {
        const rawObjectType = row.original.objectType as ObjectTypes
        const objectType = objectTypeInputToEnumMap[rawObjectType]
        const roleOptions = objectType ? OBJECT_TYPE_CONFIG[objectType].roleOptions : []

        return (
          <Select defaultValue={PERMISSION_LABELS[row.original.role]} onValueChange={(value) => handleRoleChange(row.original.id, value, row.original.objectType)}>
            <SelectTrigger className="w-full">{PERMISSION_LABELS[row.original.role]}</SelectTrigger>
            <SelectContent>
              {roleOptions.map((role: string) => (
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
        <button type="button" className="text-brand flex justify-self-end " onClick={() => handleDelete(row.original.id, row.original.objectType, row.original.role)}>
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ]

  return <DataTable columns={columns} data={permissions} tableKey={TableKeyEnum.GROUP_PERMISSION} />
}

export default GroupsPermissionsTable
