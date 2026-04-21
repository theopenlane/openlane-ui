'use client'

import React from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Button } from '@repo/ui/button'
import { MoreHorizontal } from 'lucide-react'

type RowAction<T> = {
  label: string
  icon?: React.ReactNode
  onClick: (row: T) => void
  disabled?: boolean | ((row: T) => boolean)
}

type RowActionsColumnOptions<T> = {
  actions: RowAction<T>[]
}

export function createRowActionsColumn<T>({ actions }: RowActionsColumnOptions<T>): ColumnDef<T> {
  return {
    id: 'actions',
    header: '',
    size: 50,
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            {actions.map((action) => {
              const disabled = typeof action.disabled === 'function' ? action.disabled(row.original) : action.disabled
              return (
                <DropdownMenuItem key={action.label} onClick={() => action.onClick(row.original)} disabled={disabled}>
                  {action.icon}
                  {action.label}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
  }
}
