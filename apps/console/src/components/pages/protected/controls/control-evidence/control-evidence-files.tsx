import { useGetEvidenceWithFilesPaginated, useUpdateEvidence } from '@/lib/graphql-hooks/evidence.ts'
import { FileOrder, FileOrderField, OrderDirection } from '@repo/codegen/src/schema.ts'
import React, { useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination.ts'
import { fileColumns } from '@/components/pages/protected/controls/control-evidence-files/table/columns.tsx'
import { EVIDENCE_FILES_SORT_FIELDS } from '@/components/pages/protected/controls/control-evidence-files/table/table-config.ts'
import { ControlEvidenceUploadDialog } from '@/components/pages/protected/controls/control-evidence/control-evidence-upload-dialog.tsx'
import { Download, Eye, Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { fileDownload } from '@/components/shared/lib/export.ts'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { SystemTooltip } from '@repo/ui/system-tooltip'

type TControlEvidenceFiles = {
  controlEvidenceID: string
}

const ControlEvidenceFiles: React.FC<TControlEvidenceFiles> = ({ controlEvidenceID }) => {
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const queryClient = useQueryClient()
  const [deleteDialogIsOpen, setDeleteDialogIsOpen] = useState(false)
  const [deleteFileId, setDeleteFileId] = useState<string | null>(null)
  const { successNotification, errorNotification } = useNotification()
  const [orderBy, setOrderBy] = useState<FileOrder[]>([
    {
      field: FileOrderField.created_at,
      direction: OrderDirection.ASC,
    },
  ])
  const { files, isLoading: fetching, isError, pageInfo, totalCount } = useGetEvidenceWithFilesPaginated({ evidenceId: controlEvidenceID, orderBy: orderBy, pagination: pagination })
  const { mutateAsync: updateEvidence } = useUpdateEvidence()

  const handleDownloadAll = async () => {
    for (const file of files) {
      if (file?.presignedURL) {
        await fileDownload(file.presignedURL, file.providedFileName, errorNotification)
      }
    }
  }

  const handleDeleteFile = async () => {
    if (!deleteFileId) {
      return
    }

    try {
      await updateEvidence({
        updateEvidenceId: controlEvidenceID,
        input: {
          removeFileIDs: [deleteFileId],
        },
      })

      setDeleteFileId(null)
      queryClient.invalidateQueries({ queryKey: ['evidenceFiles'] })
      successNotification({
        title: 'Evidence Updated',
        description: 'The evidence has been successfully updated.',
      })
    } catch (error) {
      errorNotification({
        title: 'Error',
        description: 'There was an unexpected error. Please try again later.',
      })
    }
  }

  const getAction = () => {
    return [
      {
        accessorKey: 'id',
        header: 'Action',
        cell: ({ cell, row }: any) => {
          return (
            <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} className="flex gap-4">
              <SystemTooltip
                icon={
                  <p className="flex items-center gap-1 cursor-pointer" onClick={() => fileDownload(row.original.presignedURL, row.original.providedFileName, errorNotification)}>
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
                      setDeleteFileId(row.original.id)
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
    return <p className="text-red-500">Error loading evidence files</p>
  }

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-lg">Provided files</p>
        <div className="flex items-center gap-2">
          <ControlEvidenceUploadDialog controlEvidenceID={controlEvidenceID} />
          <Button icon={<Download />} iconPosition="left" onClick={() => handleDownloadAll()} disabled={files?.length === 0}>
            Download All
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        sortFields={EVIDENCE_FILES_SORT_FIELDS}
        onSortChange={setOrderBy}
        data={files}
        loading={fetching}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={{ totalCount: totalCount, pageInfo: pageInfo, isLoading: fetching }}
      />

      <ConfirmationDialog
        open={deleteDialogIsOpen}
        onOpenChange={setDeleteDialogIsOpen}
        onConfirm={handleDeleteFile}
        description={`This action cannot be undone, this will permanently remove the evidence from the control.`}
      />
    </div>
  )
}

export default ControlEvidenceFiles
