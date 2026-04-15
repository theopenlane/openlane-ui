import { type ColumnDef } from '@tanstack/react-table'
import { type ActionPlansNodeNonNull } from '@/lib/graphql-hooks/action-plan'
import { type ColumnOptions } from '@/components/shared/crud-base/page'
import { createSelectColumn } from '@/components/shared/crud-base/columns/select-column'
import { UserCell } from '@/components/shared/crud-base/columns/user-cell'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { TruncatedCell } from '@repo/ui/data-table'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { type ActionPlanDocumentStatus, type ActionPlanPriority } from '@repo/codegen/src/schema'

export const getColumns = ({ userMap, selectedItems, setSelectedItems }: ColumnOptions): ColumnDef<ActionPlansNodeNonNull>[] => {
  return [
    createSelectColumn<ActionPlansNodeNonNull>(selectedItems, setSelectedItems),
    { accessorKey: 'id', header: 'ID', size: 120, cell: ({ row }) => <div className="text-muted-foreground">{row.original.id}</div> },
    { accessorKey: 'name', header: 'Name', size: 200, cell: ({ cell }) => cell.getValue() || '' },
    { accessorKey: 'title', header: 'Title', size: 200, cell: ({ cell }) => cell.getValue() || '' },
    {
      accessorKey: 'summary',
      header: 'Summary',
      size: 250,
      cell: ({ row }) => <TruncatedCell>{row.original.summary || '-'}</TruncatedCell>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 130,
      cell: ({ cell }) => getEnumLabel(cell.getValue() as ActionPlanDocumentStatus) || '-',
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      size: 110,
      cell: ({ cell }) => getEnumLabel(cell.getValue() as ActionPlanPriority) || '-',
    },
    { accessorKey: 'source', header: 'Source', size: 120 },
    { accessorKey: 'dueDate', header: 'Due Date', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
    { accessorKey: 'reviewDue', header: 'Review Due', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
    { accessorKey: 'completedAt', header: 'Completed At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
    { accessorKey: 'createdAt', header: 'Created At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} /> },
    {
      accessorKey: 'createdBy',
      header: 'Created By',
      size: 160,
      cell: ({ row }) => <UserCell user={userMap[row.original.createdBy ?? '']} />,
    },
    { accessorKey: 'updatedAt', header: 'Updated At', size: 130, cell: ({ cell }) => <DateCell value={cell.getValue() as string} variant="timesince" /> },
    {
      accessorKey: 'updatedBy',
      header: 'Updated By',
      size: 160,
      cell: ({ row }) => <UserCell user={userMap[row.original.updatedBy ?? '']} />,
    },
  ]
}
