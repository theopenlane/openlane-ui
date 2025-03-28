import { ColumnDef } from '@tanstack/react-table'
import { GetAllTemplatesQuery } from '@repo/codegen/src/schema.ts'
import { format } from 'date-fns'
import { Actions } from '@/components/pages/protected/questionnaire/actions/actions.tsx'

type TemplateEdge = NonNullable<NonNullable<GetAllTemplatesQuery['templates']>['edges']>[number]

export type Template = NonNullable<TemplateEdge>['node']

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
    cell: ({ cell }) => format(new Date(cell.getValue() as string), 'dd MMM yyyy'),
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ cell }) => format(new Date(cell.getValue() as string), 'dd MMM yyyy'),
  },
  {
    accessorKey: 'id',
    header: '',
    cell: ({ cell }) => <Actions templateId={cell.getValue() as string} />,
    size: 40,
  },
]
