import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { format } from 'date-fns'
import React from 'react'
import { Actions } from '@/components/pages/protected/policies/actions/actions.tsx'

type PoliciesEdge = any
export type Policies = NonNullable<PoliciesEdge>['node']

export const policiesColumns: ColumnDef<Policies>[] = [
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
    accessorKey: 'policyType',
    header: 'Type',
  },
  {
    accessorKey: 'description',
    header: 'Description',
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
