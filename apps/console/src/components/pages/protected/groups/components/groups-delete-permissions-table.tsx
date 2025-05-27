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
    data?.group?.permissions?.edges?.map((edge) => ({
      id: edge?.node?.id ?? 'unknown-id',
      displayId: edge?.node?.displayID || 'N/A',
      objectType: edge?.node?.objectType || 'Unknown',
      permissions: edge?.node?.permissions as Permission,
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
