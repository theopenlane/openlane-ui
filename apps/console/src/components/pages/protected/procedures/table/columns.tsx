import { ColumnDef } from '@tanstack/react-table'
import React from 'react'
import { Procedure } from '@repo/codegen/src/schema.ts'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'
import { Actions } from '@/components/pages/protected/procedures/table/actions/actions.tsx'
import { formatTimeSince } from '@/utils/date'

export const proceduresColumns: ColumnDef<Procedure>[] = [
  {
    accessorKey: 'displayID',
    header: 'Display ID',
    cell: ({ cell, row }) => {
      return <span className="whitespace-nowrap">{cell.getValue() as string}</span>
    },
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ cell, row }) => {
      return <div>{cell.getValue() as string}</div>
    },
  },
  {
    accessorKey: 'details',
    header: 'Details',
    cell: ({ cell }) => {
      const plateEditorHelper = usePlateEditor()

      return <div className="line-clamp-4">{plateEditorHelper.convertToReadOnly(cell.getValue() as string, 0)}</div>
    },
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated At',
    cell: ({ cell }) => <span className="whitespace-nowrap">{formatTimeSince(cell.getValue() as string)}</span>,
    size: 140,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ cell }) => <span className="whitespace-nowrap">{formatTimeSince(cell.getValue() as string)}</span>,
    size: 140,
  },
  {
    accessorKey: 'id',
    header: '',
    cell: ({ cell }) => (
      <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        <Actions procedureId={cell.getValue() as string} />
      </div>
    ),
    size: 40,
  },
]
