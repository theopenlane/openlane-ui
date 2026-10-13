import { type ColumnDef } from '@repo/ui/table-types'
import ColorCell from './color-cell'

const COLOR_COLUMN_WIDTH = 160

type TColorRow = {
  id: string
  name: string
  color?: string | null
  systemOwned?: boolean | null
}

type TColorColumnParams = {
  canEdit: boolean
  onSave: (id: string, color: string) => Promise<void>
}

export const colorColumn = <TRow extends TColorRow>({ canEdit, onSave }: TColorColumnParams): ColumnDef<TRow> => ({
  id: 'color',
  accessorKey: 'color',
  header: 'Color',
  cell: ({ row }) => <ColorCell id={row.original.id} label={row.original.name} initialColor={row.original.color} disabled={!!row.original.systemOwned || !canEdit} onSave={onSave} />,
  size: COLOR_COLUMN_WIDTH,
  minSize: COLOR_COLUMN_WIDTH,
})
