import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { format } from 'date-fns'
import React from 'react'
import { Actions } from '@/components/pages/protected/policies/actions/actions.tsx'
import { InternalPolicy } from '@repo/codegen/src/schema.ts'
import usePlateEditor from '@/components/shared/plate/usePlateEditor.tsx'

export const policiesColumns: ColumnDef<InternalPolicy>[] = [
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
      return (
        <Link href={'/policies/' + row.original.id} className="underline">
          {cell.getValue() as string}
        </Link>
      )
    },
  },
  {
    accessorKey: 'details',
    header: 'Details',
    cell: ({ cell }) => {
      const plateEditorHelper = usePlateEditor()

      return <div>{plateEditorHelper.convertToReadOnly(cell.getValue() as string, 0)}</div>
    },
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated At',
    cell: ({ cell }) => <span className="whitespace-nowrap">{format(new Date(cell.getValue() as string), 'MMM dd, yyyy')}</span>,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    cell: ({ cell }) => <span className="whitespace-nowrap">{format(new Date(cell.getValue() as string), 'MMM dd, yyyy')}</span>,
  },
  {
    accessorKey: 'id',
    header: '',
    cell: ({ cell }) => <Actions policyId={cell.getValue() as string} />,
    size: 40,
  },
]
