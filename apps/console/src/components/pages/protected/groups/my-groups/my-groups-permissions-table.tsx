import React from 'react'
import { ColumnDef } from '@tanstack/table-core'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { DataTable } from '@repo/ui/data-table'
import { useMyGroupsStore } from '@/hooks/useMyGroupsStore'
import { Permission, useGetGroupPermissionsQuery } from '@repo/codegen/src/schema'

// Mapping GraphQL Enum values to readable labels
const permissionLabels: Record<Permission, string> = {
  [Permission.VIEWER]: 'View',
  [Permission.EDITOR]: 'Edit',
  [Permission.BLOCKED]: 'Blocked',
  [Permission.CREATOR]: 'Create',
}

// Reverse mapping to match Select values when changing roles
const roleOptions: { value: Permission; label: string }[] = Object.entries(permissionLabels).map(([key, label]) => ({
  value: key as Permission,
  label,
}))

console.log('roleOptions', roleOptions)

const MyGroupsPermissionsTable = () => {
  const { selectedGroup } = useMyGroupsStore()
  const [{ data }] = useGetGroupPermissionsQuery({ variables: { groupId: selectedGroup || '' }, pause: !selectedGroup })

  const permissions =
    data?.group?.permissions?.map((perm) => ({
      id: perm.id ?? 'unknown-id',
      displayID: perm.displayID || 'N/A',
      name: perm.name || 'Unknown',
      objectType: perm.objectType || 'Unknown',
      role: (perm.permissions as Permission) || Permission.VIEWER,
    })) || []

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
        <Select defaultValue={row.original.role}>
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
