import { ColumnDef } from '@tanstack/table-core'
import { Badge } from '@repo/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import React from 'react'
import { Control } from '@repo/codegen/src/schema'

export const controlColumns: ColumnDef<Control>[] = [
  {
    header: 'Name',
    accessorKey: 'name',
    cell: ({ row }) => <div>{row.getValue('name')}</div>,
  },
  {
    header: 'Ref',
    accessorKey: 'ref',
    cell: ({ row }) => <div>{row.getValue('ref')}</div>,
  },
  {
    header: 'Description',
    accessorKey: 'description',
    cell: ({ row }) => (
      <div>
        <p>{row.getValue('description')}</p>
        <div className="mt-2 border-t border-dotted pt-2 flex flex-wrap gap-2">
          {row.original.tags?.map((tag: string, index: number) => (
            <Badge key={index} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    ),
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }) => <span className="flex items-center gap-2">{row.getValue('status')}</span>,
  },
  {
    header: 'Owners',
    accessorKey: 'owners',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {/* @ts-ignore */}
        {row.getValue('owners').map((owner: any, index: number) => (
          <Avatar key={index}>
            <AvatarImage src={owner.avatar} alt={owner.fallback} />
            <AvatarFallback>{owner.fallback}</AvatarFallback>
          </Avatar>
        ))}
      </div>
    ),
  },
]
