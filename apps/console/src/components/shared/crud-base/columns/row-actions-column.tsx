'use client'

import React from 'react'
import { type ColumnDef, type RowData } from '@repo/ui/table-types'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Button } from '@repo/ui/button'
import { MoreHorizontal } from 'lucide-react'
import { ROW_ACTIONS_COLUMN_ID } from '@repo/ui/pinned-columns'

type RowPredicate<T> = boolean | ((row: T) => boolean)

type RowAction<T> = {
  label: string
  icon?: React.ReactNode
  onClick: (row: T) => void
  disabled?: RowPredicate<T>
  hidden?: RowPredicate<T>
}

type RowActionsColumnOptions<T> = {
  actions: RowAction<T>[]
  label?: string
}

const ROW_ACTIONS_COLUMN_WIDTH = 72

const resolvePredicate = <T,>(predicate: RowPredicate<T> | undefined, row: T): boolean => (typeof predicate === 'function' ? predicate(row) : !!predicate)

export const createRowActionsColumn = <T extends RowData>({ actions, label = 'Row actions' }: RowActionsColumnOptions<T>): ColumnDef<T> => ({
  id: ROW_ACTIONS_COLUMN_ID,
  header: '',
  size: ROW_ACTIONS_COLUMN_WIDTH,
  minSize: ROW_ACTIONS_COLUMN_WIDTH,
  maxSize: ROW_ACTIONS_COLUMN_WIDTH,
  enableSorting: false,
  enableHiding: false,
  enableResizing: false,
  cell: ({ row }) => {
    const visibleActions = actions.filter((action) => !resolvePredicate(action.hidden, row.original))
    if (visibleActions.length === 0) return null

    return (
      <div role="presentation" onClick={(e) => e.stopPropagation()} className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" aria-label={label} className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            {visibleActions.map((action) => (
              <DropdownMenuItem key={action.label} onClick={() => action.onClick(row.original)} disabled={resolvePredicate(action.disabled, row.original)}>
                {action.icon}
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  },
})
