'use client'

import React from 'react'
import { type ColumnDef, type RowData } from '@repo/ui/table-types'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Button } from '@repo/ui/button'
import { MoreHorizontal } from 'lucide-react'

export const ROW_ACTIONS_COLUMN_ID = 'actions'

type RowAction<T> = {
  label: string
  icon?: React.ReactNode
  onClick: (row: T) => void
  disabled?: boolean | ((row: T) => boolean)
}

type RowActionsColumnOptions<T> = {
  actions: RowAction<T>[]
  label?: string
}

export function createRowActionsColumn<T extends RowData>({ actions, label = 'Row actions' }: RowActionsColumnOptions<T>): ColumnDef<T> {
  return {
    id: ROW_ACTIONS_COLUMN_ID,
    header: '',
    size: 50,
    cell: ({ row }) => (
      <div role="presentation" onClick={(e) => e.stopPropagation()} className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" aria-label={label} className="h-8 w-8 p-0">
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
