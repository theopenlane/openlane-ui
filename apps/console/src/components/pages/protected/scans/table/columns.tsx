import { ColumnDef } from '@tanstack/react-table'
import { formatDate } from '@/utils/date'
import { ScansNodeNonNull } from '@/lib/graphql-hooks/scan'
import { ColumnOptions } from '@/components/shared/crud-base/page'
import { createSelectColumn } from '@/components/shared/crud-base/columns/select-column'
import { UserCell } from '@/components/shared/crud-base/columns/user-cell'

export const getColumns = ({ userMap, selectedItems, setSelectedItems }: ColumnOptions): ColumnDef<ScansNodeNonNull>[] => {
  return [
    createSelectColumn<ScansNodeNonNull>(selectedItems, setSelectedItems),
    { accessorKey: 'id', header: 'ID', size: 120, cell: ({ row }) => <div className="text-muted-foreground">{row.original.id}</div> },
    { accessorKey: 'target', header: 'Target', size: 220 },
    { accessorKey: 'scanType', header: 'Scan Type', size: 130 },
    { accessorKey: 'status', header: 'Status', size: 110 },
    { accessorKey: 'scanDate', header: 'Scan Date', size: 130, cell: ({ cell }) => formatDate(cell.getValue() as string) },
    { accessorKey: 'scanSchedule', header: 'Schedule', size: 160 },
    { accessorKey: 'nextScanRunAt', header: 'Next Run', size: 130, cell: ({ cell }) => formatDate(cell.getValue() as string) },
    { accessorKey: 'environmentName', header: 'Environment', size: 120 },
    { accessorKey: 'scopeName', header: 'Scope', size: 120 },
    { accessorKey: 'assignedTo', header: 'Assigned To', size: 140 },
    { accessorKey: 'performedBy', header: 'Performed By', size: 140 },
    { accessorKey: 'reviewedBy', header: 'Reviewed By', size: 140 },
    { accessorKey: 'createdAt', header: 'Created At', size: 130, cell: ({ cell }) => formatDate(cell.getValue() as string) },
    {
      accessorKey: 'createdBy',
      header: 'Created By',
      size: 160,
      cell: ({ row }) => <UserCell user={userMap[row.original.createdBy ?? '']} />,
    },
    { accessorKey: 'updatedAt', header: 'Updated At', size: 130, cell: ({ cell }) => formatDate(cell.getValue() as string) },
    {
      accessorKey: 'updatedBy',
      header: 'Updated By',
      size: 160,
      cell: ({ row }) => <UserCell user={userMap[row.original.updatedBy ?? '']} />,
    },
  ]
}
