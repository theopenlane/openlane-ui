import React from 'react'
import { type ColumnDef } from '@repo/ui/table-types'
import { DataTable } from '@repo/ui/data-table'
import { type Permission } from '@repo/codegen/src/schema'
import { TableKeyEnum } from '@repo/ui/table-key'

export interface GroupPermissionRow {
  id: string
  objectType: string
  permissions: Permission
  name: string
}

type GroupDeletePermissionsTableProps = {
  permissions: GroupPermissionRow[]
}

const columns: ColumnDef<GroupPermissionRow>[] = [
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

const GroupDeletePermissionsTable: React.FC<GroupDeletePermissionsTableProps> = ({ permissions }) => <DataTable columns={columns} data={permissions} tableKey={TableKeyEnum.GROUP_DELETE_PERMISSION} />

export default GroupDeletePermissionsTable
