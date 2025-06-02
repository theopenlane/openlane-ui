import { ColumnDef } from '@tanstack/react-table'
import { Template } from '@repo/codegen/src/schema'
import { formatTimeSince } from '@/utils/date'

export const getQuestionnaireColumns = () => {
  const columns: ColumnDef<Template>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ cell }) => {
        return <div className="font-bold">{cell.getValue() as string}</div>
      },
      size: 180,
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated At',
      cell: ({ cell }) => formatTimeSince(cell.getValue() as string),
      size: 120,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ cell }) => formatTimeSince(cell.getValue() as string),
      size: 120,
    },
  ]

  const mappedColumns = columns
    .filter((column): column is { accessorKey: string; header: string } => 'accessorKey' in column && typeof column.accessorKey === 'string' && 'header' in column && typeof column.header === 'string')
    .map((column) => ({
      accessorKey: column.accessorKey,
      header: column.header,
    }))

  return { columns, mappedColumns }
}

// export const questionnaireColumns: ColumnDef<Template>[] = [
//   {
//     accessorKey: 'name',
//     header: 'Name',
//     cell: ({ cell }) => {
//       return <div className="font-bold">{cell.getValue() as string}</div>
//     },
//     size: 180,
//   },
//   {
//     accessorKey: 'description',
//     header: 'Description',
//   },
//   {
//     accessorKey: 'updatedAt',
//     header: 'Updated At',
//     cell: ({ cell }) => formatTimeSince(cell.getValue() as string),
//     size: 120,
//   },
//   {
//     accessorKey: 'createdAt',
//     header: 'Created At',
//     cell: ({ cell }) => formatTimeSince(cell.getValue() as string),
//     size: 120,
//   },
// ]
