import React from 'react'
import { ColumnDef } from '@tanstack/table-core'
import { DataTable } from '@repo/ui/data-table'
import { Permission } from '@repo/codegen/src/schema'
import { useGroupsStore } from '@/hooks/useGroupsStore'
import { useGetGroupPermissions } from '@/lib/graphql-hooks/groups'

interface GroupPermission {
  id: string
  displayId: string
  objectType: string
  permissions: Permission
}

const GroupDeletePermissionsTable: React.FC = () => {
  const { selectedGroup } = useGroupsStore()

  const { data } = useGetGroupPermissions(selectedGroup)

  const groupPermissions: GroupPermission[] =
    data?.group?.permissions?.map((permission) => ({
      id: permission.id ?? 'unknown-id',
      displayId: permission.displayID || 'N/A',
      objectType: permission.objectType || 'Unknown',
      permissions: permission.permissions as Permission,
    })) || []

  const columns: ColumnDef<GroupPermission>[] = [
    {
      header: 'Object',
      accessorKey: 'displayId',
    },
    {
      header: 'Object Type',
      accessorKey: 'objectType',
    },
    {
      header: 'Permission',
      accessorKey: 'permissions',
      cell: ({ row }) => <p className="capitalize">{row.original.permissions.toLowerCase()}</p>,
    },
  ]

  return <DataTable columns={columns} data={groupPermissions} />
}

export default GroupDeletePermissionsTable
