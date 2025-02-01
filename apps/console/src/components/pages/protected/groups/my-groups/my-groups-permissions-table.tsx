import React from 'react'
import { ColumnDef } from '@tanstack/table-core'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { DataTable } from '@repo/ui/data-table'

const MyGroupsPermissionsTable = () => {
  const permissions = [{ id: 'CC1.2', type: 'Control', permission: 'Viewer' }]

  const columns: ColumnDef<{ id: string; type: string; permission: string }>[] = [
    {
      header: 'Object',
      accessorKey: 'id',
    },
    {
      header: 'Type',
      accessorKey: 'type',
    },
    {
      header: 'Permission',
      accessorKey: 'permission',
      cell: ({ row }) => (
        <Select>
          <SelectTrigger className="w-full">{row.original.permission}</SelectTrigger>
          <SelectContent>
            <SelectItem value="Viewer">Viewer</SelectItem>
            <SelectItem value="Editor">Editor</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
  ]

  return <DataTable columns={columns} data={permissions} />
}

export default MyGroupsPermissionsTable
