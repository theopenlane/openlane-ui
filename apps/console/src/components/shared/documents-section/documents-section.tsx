'use client'

import React, { useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { TPagination } from '@repo/ui/pagination-types'
import { fileColumns, TFile } from '@/components/shared/file-table/columns'
import { FILE_SORT_FIELDS } from '@/components/shared/file-table/table-config'
import { DocumentsUploadDialog } from './documents-upload-dialog'
import { Download, Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { fileDownload } from '@/components/shared/lib/export'
import { useNotification } from '@/hooks/useNotification'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import type { Row } from '@tanstack/react-table'
import type { FileOrder } from '@repo/codegen/src/schema'
import type { TableKeyValue } from '@repo/ui/table-key'

type DocumentsSectionProps = {
  parentId: string
  editAllowed: boolean
  tableKey: TableKeyValue
  files: (TFile | null | undefined)[]
  isLoading: boolean
  isError: boolean
  pageInfo?: { endCursor?: string | null; hasNextPage: boolean; hasPreviousPage: boolean; startCursor?: string | null }
  totalCount?: number
  pagination: TPagination
  onPaginationChange: (pagination: TPagination) => void
  defaultSorting: FileOrder[]
  onSortChange: (orderBy: FileOrder[]) => void
  onUpload: (files: File[]) => Promise<void>
  isUploading: boolean
  onRemoveFile: (fileId: string) => Promise<void>
}

const DocumentsSection: React.FC<DocumentsSectionProps> = ({
  editAllowed,
  tableKey,
  files,
  isLoading,
  isError,
  pageInfo,
  totalCount,
  pagination,
  onPaginationChange,
  defaultSorting,
  onSortChange,
  onUpload,
  isUploading,
  onRemoveFile,
}) => {
  const [deleteDialogIsOpen, setDeleteDialogIsOpen] = useState(false)
  const [deleteFileInfo, setDeleteFileInfo] = useState<{ id: string | null; name: string | null }>({ id: null, name: null })
  const { errorNotification } = useNotification()

  const handleDownloadAll = async () => {
    for (const file of files) {
      if (file?.presignedURL) {
        await fileDownload(file.presignedURL, file.providedFileName, errorNotification)
      }
    }
  }

  const handleDeleteFile = async () => {
    if (!deleteFileInfo.id) {
      return
    }
    await onRemoveFile(deleteFileInfo.id)
    setDeleteFileInfo({ id: null, name: null })
  }

  const getAction = () => {
    if (!editAllowed) return []
    return [
      {
        id: 'actions',
        header: 'Action',
        cell: ({ row }: { row: Row<TFile> }) => {
          return (
            <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} className="flex gap-4">
              <SystemTooltip
                icon={
                  <p className="flex items-center gap-1 cursor-pointer" onClick={() => fileDownload(row?.original?.presignedURL || '', row.original.providedFileName, errorNotification)}>
                    <Download size={16} />
                  </p>
                }
                content={<p>Download</p>}
              />
              <SystemTooltip
                icon={
                  <p
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => {
                      setDeleteDialogIsOpen(true)
                      setDeleteFileInfo({ id: row.original.id, name: row.original.providedFileName })
                    }}
                  >
                    <Trash2 size={16} />
                  </p>
                }
                content={<p>Delete</p>}
              />
            </div>
          )
        },
        size: 40,
      },
    ]
  }

  const columns = [...fileColumns, ...getAction()]

  if (isError) {
    return <p className="text-red-500">Error loading documents</p>
  }

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-lg">Documents</p>
        <div className="flex items-center gap-2">
          {editAllowed && <DocumentsUploadDialog onUpload={onUpload} isUploading={isUploading} />}
          <Button variant="secondary" icon={<Download />} iconPosition="left" onClick={() => handleDownloadAll()} disabled={files?.length === 0}>
            Download All
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        sortFields={FILE_SORT_FIELDS}
        defaultSorting={defaultSorting}
        onSortChange={onSortChange}
        data={files.filter((f): f is TFile => !!f)}
        loading={isLoading}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        paginationMeta={{ totalCount: totalCount, pageInfo: pageInfo, isLoading: isLoading }}
        tableKey={tableKey}
      />

      <ConfirmationDialog
        open={deleteDialogIsOpen}
        onOpenChange={setDeleteDialogIsOpen}
        onConfirm={handleDeleteFile}
        title="Delete File"
        description={
          <>
            This action cannot be undone. This will permanently remove <b>{deleteFileInfo.name}</b>.
          </>
        }
      />
    </div>
  )
}

export { DocumentsSection }
