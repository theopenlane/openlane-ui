import { type ColumnDef } from '@tanstack/react-table'
import { type WorkflowDefinitionsNodeNonNull } from '@/lib/graphql-hooks/workflow-definition'
import { type ColumnOptions } from '@/components/shared/crud-base/page'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { BooleanCell } from '@/components/shared/crud-base/columns/boolean-cell'
import { DateCell } from '@/components/shared/crud-base/columns/date-cell'
import { createSelectColumn } from '@/components/shared/crud-base/columns/select-column'

export const getColumns = ({ selectedItems, setSelectedItems }: ColumnOptions): ColumnDef<WorkflowDefinitionsNodeNonNull>[] => {
  return [
    createSelectColumn<WorkflowDefinitionsNodeNonNull>(selectedItems, setSelectedItems),
    {
      accessorKey: 'displayID',
      header: 'ID',
      size: 120,
      cell: ({ row }) => <div className="text-muted-foreground">{row.original.displayID}</div>,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      size: 200,
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      size: 250,
      cell: ({ row }) => <span className="text-muted-foreground truncate block max-w-[240px]">{row.original.description || '-'}</span>,
    },
    {
      accessorKey: 'schemaType',
      header: 'Schema',
      size: 150,
      cell: ({ cell }) => getEnumLabel(cell.getValue() as string),
    },
    {
      accessorKey: 'workflowKind',
      header: 'Kind',
      size: 150,
      cell: ({ cell }) => getEnumLabel(cell.getValue() as string),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 140,
      cell: ({ row }) => {
        const { draft, active, isDefault } = row.original
        const status = draft ? 'Draft' : active ? 'Active' : 'Inactive'
        return `${status}${isDefault ? ' / Default' : ''}`
      },
    },
    {
      accessorKey: 'revision',
      header: 'Revision',
      size: 100,
      cell: ({ row }) => row.original.revision ?? '-',
    },
    {
      accessorKey: 'systemOwned',
      header: 'System Owned',
      size: 130,
      cell: ({ row }) => <BooleanCell value={row.original.systemOwned ?? false} />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      size: 130,
      cell: ({ cell }) => <DateCell value={cell.getValue() as string} />,
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated At',
      size: 130,
      cell: ({ cell }) => <DateCell value={cell.getValue() as string} variant="timesince" />,
    },
  ]
}
