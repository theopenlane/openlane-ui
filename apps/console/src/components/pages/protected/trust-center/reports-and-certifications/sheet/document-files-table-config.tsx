import { activatable } from '@repo/ui/lib/a11y'
import { type ColumnDef } from '@repo/ui/table-types'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Trash2 } from 'lucide-react'
import { getFileActionsColumn, type TFileActionsRow } from '@/components/shared/file-table/file-actions-column'
import type { TFile } from '@/components/shared/file-table/columns'
import { formatFileSize } from '@/utils/strings'

export type TDocumentFile = TFileActionsRow & Pick<TFile, 'providedFileSize'>

type TFilesColumnsParams = {
  onPreview: (file: TDocumentFile) => void
  onDelete?: (file: TDocumentFile) => void
}

export const getFilesColumns = ({ onPreview, onDelete }: TFilesColumnsParams): ColumnDef<TDocumentFile>[] => [
  {
    accessorKey: 'providedFileName',
    header: 'Filename',
  },
  {
    accessorKey: 'providedFileSize',
    header: 'Size',
    cell: ({ row }) => {
      const size = row.original.providedFileSize
      return <span>{size == null ? '-' : formatFileSize(size)}</span>
    },
  },
  getFileActionsColumn<TDocumentFile>({
    onPreview,
    trailingAction: onDelete
      ? (file) => (
          <SystemTooltip
            icon={
              <p className="flex items-center gap-1 cursor-pointer" aria-label={`Delete ${file.providedFileName}`} {...activatable(() => onDelete(file))}>
                <Trash2 size={16} />
              </p>
            }
            content={<p>Delete</p>}
          />
        )
      : undefined,
  }),
]
