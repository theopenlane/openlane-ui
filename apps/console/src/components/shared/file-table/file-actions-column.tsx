'use client'

import React from 'react'
import { Download, Eye } from 'lucide-react'
import { activatable } from '@repo/ui/lib/a11y'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import type { ColumnDef } from '@repo/ui/table-types'
import { fileDownload } from '@/components/shared/lib/export'
import { isPreviewableFile } from '@/components/shared/file-preview/preview-mime'
import { useNotification } from '@/hooks/useNotification'

export type TFileActionsRow = {
  id: string
  providedFileName: string
  providedFileExtension: string
  detectedMimeType?: string | null
  presignedURL?: string | null
}

type TFileActionsCellProps<TRow extends TFileActionsRow> = {
  file: TRow
  onPreview?: (file: TRow) => void
  trailingAction?: (file: TRow) => React.ReactNode
}

const FileActionsCell = <TRow extends TFileActionsRow>({ file, onPreview, trailingAction }: TFileActionsCellProps<TRow>) => {
  const { errorNotification } = useNotification()
  const canPreview = !!onPreview && isPreviewableFile(file) && !!file.presignedURL

  return (
    <div role="presentation" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} className="flex items-center justify-end gap-3">
      {canPreview && (
        <SystemTooltip
          icon={
            <p className="flex items-center cursor-pointer" aria-label={`Preview ${file.providedFileName}`} {...activatable(() => onPreview(file))}>
              <Eye size={16} />
            </p>
          }
          content={<p>Preview</p>}
        />
      )}

      <SystemTooltip
        icon={
          <p
            className="flex items-center cursor-pointer"
            aria-label={`Download ${file.providedFileName}`}
            {...activatable(() => fileDownload(file.presignedURL ?? '', file.providedFileName, errorNotification))}
          >
            <Download size={16} />
          </p>
        }
        content={<p>Download</p>}
      />

      {trailingAction?.(file)}
    </div>
  )
}

export const getFileActionsColumn = <TRow extends TFileActionsRow>({
  onPreview,
  trailingAction,
}: {
  onPreview?: (file: TRow) => void
  trailingAction?: (file: TRow) => React.ReactNode
}): ColumnDef<TRow> => ({
  id: 'actions',
  header: '',
  size: 90,
  cell: ({ row }) => <FileActionsCell file={row.original} onPreview={onPreview} trailingAction={trailingAction} />,
})
