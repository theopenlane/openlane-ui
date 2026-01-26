import { useGetEvidenceWithFilesPaginated, useUpdateEvidence } from '@/lib/graphql-hooks/evidence.ts'
import { FileOrder, FileOrderField, OrderDirection } from '@repo/codegen/src/schema.ts'
import React, { useState } from 'react'
import { DataTable, getInitialSortConditions, getInitialPagination } from '@repo/ui/data-table'
import { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination.ts'
import { fileColumns, TFile } from '@/components/pages/protected/controls/control-evidence-files/table/columns.tsx'
import { EVIDENCE_FILES_SORT_FIELDS } from '@/components/pages/protected/controls/control-evidence-files/table/table-config.ts'
import { ControlEvidenceUploadDialog } from '@/components/pages/protected/evidence/evidence-upload-dialog'
import { Download, Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { fileDownload } from '@/components/shared/lib/export.ts'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import type { Row } from '@tanstack/react-table'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { TableKeyEnum } from '@repo/ui/table-key'

type TControlEvidenceFiles = {
  evidenceID: string
  editAllowed: boolean
}

const EvidenceFiles: React.FC<TControlEvidenceFiles> = ({ evidenceID, editAllowed }) => {
  const [pagination, setPagination] = useState<TPagination>(getInitialPagination(TableKeyEnum.EVIDENCE_FILES, DEFAULT_PAGINATION))
  const queryClient = useQueryClient()
  const [deleteDialogIsOpen, setDeleteDialogIsOpen] = useState(false)
  const [deleteFileInfo, setDeleteFileInfo] = useState<{
    id: string | null
    name: string | null
  }>({ id: null, name: null })
  const { successNotification, errorNotification } = useNotification()
  const defaultSorting = getInitialSortConditions(TableKeyEnum.EVIDENCE_FILES, FileOrderField, [
    {
      field: FileOrderField.created_at,
      direction: OrderDirection.ASC,
    },
  ])
  const [orderBy, setOrderBy] = useState<FileOrder[]>(defaultSorting)
  const { files, isLoading: fetching, isError, pageInfo, totalCount } = useGetEvidenceWithFilesPaginated({ evidenceId: evidenceID, orderBy: orderBy, pagination: pagination })
  const { mutateAsync: updateEvidence } = useUpdateEvidence()

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

    try {
      await updateEvidence({
        updateEvidenceId: evidenceID,
        input: {
          removeFileIDs: [deleteFileInfo.id],
        },
      })
      setDeleteFileInfo({ id: null, name: null })
      queryClient.invalidateQueries({ queryKey: ['evidenceFiles'] })
      successNotification({
        title: 'Evidence Updated',
        description: 'The evidence has been successfully updated.',
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const getAction = () => {
    return [
      {
        accessorKey: 'id',
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
    return <p className="text-red-500">Error loading evidence files</p>
  }

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-lg">Provided files</p>
        <div className="flex items-center gap-2">
          {editAllowed && <ControlEvidenceUploadDialog evidenceID={evidenceID} />}
          <Button variant="secondary" icon={<Download />} iconPosition="left" onClick={() => handleDownloadAll()} disabled={files?.length === 0}>
            Download All
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        sortFields={EVIDENCE_FILES_SORT_FIELDS}
        defaultSorting={defaultSorting}
        onSortChange={setOrderBy}
        data={files.filter((f) => !!f)}
        loading={fetching}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={{ totalCount: totalCount, pageInfo: pageInfo, isLoading: fetching }}
        tableKey={TableKeyEnum.EVIDENCE_FILES}
      />

      <ConfirmationDialog
        open={deleteDialogIsOpen}
        onOpenChange={setDeleteDialogIsOpen}
        onConfirm={handleDeleteFile}
        title={`Delete File`}
        description={
          <>
            This action cannot be undone. This will permanently remove <b>{deleteFileInfo.name}</b> from the control.
          </>
        }
      />
    </div>
  )
}

export default EvidenceFiles
