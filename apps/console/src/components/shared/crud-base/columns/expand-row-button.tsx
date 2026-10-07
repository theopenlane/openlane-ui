import { ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { type Row, type RowData } from '@repo/ui/table-types'

type TExpandRowButtonProps<TData extends RowData> = {
  row: Row<TData>
  label: string
}

export const ExpandRowButton = <TData extends RowData>({ row, label }: TExpandRowButtonProps<TData>) => {
  const isExpanded = row.getIsExpanded()
  return (
    <Button
      type="button"
      variant="icon"
      size="icon-sm"
      aria-expanded={isExpanded}
      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${label}`}
      icon={isExpanded ? <ChevronDown /> : <ChevronRight />}
      onClick={(event) => {
        event.stopPropagation()
        row.toggleExpanded()
      }}
    />
  )
}
