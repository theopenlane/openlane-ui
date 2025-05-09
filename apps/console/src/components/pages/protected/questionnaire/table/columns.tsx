import { ColumnDef } from '@tanstack/react-table'
import { Template } from '@repo/codegen/src/schema'
import { formatTimeSince } from '@/utils/date'

export const questionnaireColumns: ColumnDef<Template>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'description',
    header: 'Description',
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated At',
    cell: ({ cell }) => formatTimeSince(cell.getValue() as string),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ cell }) => formatTimeSince(cell.getValue() as string),
  },
]
