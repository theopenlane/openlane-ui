import { ColumnDef } from '@tanstack/react-table'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { Download, Trash2 } from 'lucide-react'
import React from 'react'
import { fileDownload } from '@/components/shared/lib/export'
import { useNotification } from '@/hooks/useNotification'

export type TDocumentFile = {
  id?: string
  providedFileName: string
  providedFileSize?: number | null
  presignedURL: string
}

/**
 * Returns table column definitions for document files.
 */
export const useGetFilesColumns = ({ onDelete }: { onDelete: (file: TDocumentFile) => void }): ColumnDef<TDocumentFile>[] => {
  const { errorNotification } = useNotification()

  return [
    {
      accessorKey: 'providedFileName',
      header: 'Filename',
    },
    {
      accessorKey: 'providedFileSize',
      header: 'Size',
      cell: ({ row }) => {
        const bytes = row.original.providedFileSize ?? 0
        const sizeInMB = (bytes / (1024 * 1024)).toFixed(2)
        return <span>{sizeInMB} MB</span>
      },
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-3">
          <SystemTooltip
            icon={
              <p className="flex items-center gap-1 cursor-pointer" onClick={() => fileDownload(row.original.presignedURL || '', row.original.providedFileName, errorNotification)}>
                <Download size={16} />
              </p>
            }
            content={<p>Download</p>}
          />

          <SystemTooltip
            icon={
              <p className="flex items-center gap-1 cursor-pointer" onClick={() => onDelete(row.original)}>
                <Trash2 size={16} />
              </p>
            }
            content={<p>Delete</p>}
          />
        </div>
      ),
    },
  ]
}
