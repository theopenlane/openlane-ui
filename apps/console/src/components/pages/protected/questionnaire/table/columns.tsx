import { ColumnDef } from '@tanstack/react-table'
import { Actions } from '@/components/pages/protected/questionnaire/actions/actions.tsx'
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
  {
    accessorKey: 'id',
    header: '',
    cell: ({ cell }) => <Actions templateId={cell.getValue() as string} />,
    size: 40,
  },
]
