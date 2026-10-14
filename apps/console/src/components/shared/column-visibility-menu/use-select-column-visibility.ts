import { useMemo } from 'react'
import { type VisibilityState } from '@repo/ui/table-types'
import { SELECT_COLUMN_ID } from '@repo/ui/pinned-columns'

export const useSelectColumnVisibility = (columnVisibility: VisibilityState | undefined, canSelect: boolean): VisibilityState =>
  useMemo(() => ({ ...columnVisibility, [SELECT_COLUMN_ID]: canSelect }), [columnVisibility, canSelect])
