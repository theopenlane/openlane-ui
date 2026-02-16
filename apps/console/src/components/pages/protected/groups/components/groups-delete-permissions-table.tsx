import React from 'react'
import { ColumnDef } from '@tanstack/table-core'
import { DataTable } from '@repo/ui/data-table'
import { Permission } from '@repo/codegen/src/schema'
import { useGroupsStore } from '@/hooks/useGroupsStore'
import { useGetGroupPermissions } from '@/lib/graphql-hooks/group'
import { TableKeyEnum } from '@repo/ui/table-key'

interface GroupPermission {
  id: string
  objectType: string
  permissions: Permission
  name: string
}

const GroupDeletePermissionsTable: React.FC = () => {
  const { selectedGroup } = useGroupsStore()

  const { data } = useGetGroupPermissions(selectedGroup)

  const groupPermissions: GroupPermission[] =
    data?.group?.permissions?.edges?.map((edge) => ({
      name: edge?.node?.name ?? 'name',
      id: edge?.node?.id ?? 'unknown-id',
      objectType: edge?.node?.objectType || 'Unknown',
      permissions: edge?.node?.permissions as Permission,
    })) || []

  const columns: ColumnDef<GroupPermission>[] = [
    {
      header: 'Name',
      accessorKey: 'name',
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

  return <DataTable columns={columns} data={groupPermissions} tableKey={TableKeyEnum.GROUP_DELETE_PERMISSION} />
}

export default GroupDeletePermissionsTable
