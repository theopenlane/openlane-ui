'use client'

import React, { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { DataTable } from '@repo/ui/data-table'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

import { useGetTrustCenterDocById, useUpdateTrustCenterDoc } from '@/lib/graphql-hooks/trust-center-doc'
import { TDocumentFile, useGetFilesColumns } from './document-files-table-config'
import { DocumentUploadDialog } from './document-upload-dialog'
import { TableKeyEnum } from '@repo/ui/table-key'

type TDocumentFiles = {
  documentId: string
  editAllowed: boolean
}

export const DocumentFiles: React.FC<TDocumentFiles> = ({ documentId, editAllowed }) => {
  const queryClient = useQueryClient()
  const [deleteDialogIsOpen, setDeleteDialogIsOpen] = useState(false)
  const [deleteFileInfo, setDeleteFileInfo] = useState<{ id: string | null; name: string | null }>({ id: null, name: null })
  const { successNotification, errorNotification } = useNotification()

  const { mutateAsync: updateDocument } = useUpdateTrustCenterDoc()

  const { data: documentData } = useGetTrustCenterDocById({
    trustCenterDocId: documentId || '',
    enabled: !!documentId,
  })

  const handleDeleteFile = async () => {
    if (!deleteFileInfo.id) return
    try {
      await updateDocument({
        updateTrustCenterDocId: documentId,
        input: {
          clearFile: true,
        },
      })
      queryClient.invalidateQueries({ queryKey: ['documentFiles'] })
      successNotification({
        title: 'File Deleted',
        description: 'The document file was successfully deleted.',
      })
    } catch (error) {
      const msg = parseErrorMessage(error)
      errorNotification({ title: 'Error', description: msg })
    } finally {
      setDeleteDialogIsOpen(false)
    }
  }

  const file: TDocumentFile[] = documentData?.trustCenterDoc?.file
    ? [
        {
          id: documentData.trustCenterDoc.id,
          providedFileName: documentData.trustCenterDoc.file.providedFileName,
          providedFileSize: documentData.trustCenterDoc.file.providedFileSize,
          presignedURL: documentData.trustCenterDoc.file.presignedURL ?? '',
        },
      ]
    : documentData?.trustCenterDoc?.originalFile
    ? [
        {
          id: documentData.trustCenterDoc.id,
          providedFileName: documentData.trustCenterDoc.originalFile.providedFileName,
          providedFileSize: documentData.trustCenterDoc.originalFile.providedFileSize,
          presignedURL: documentData.trustCenterDoc.originalFile.presignedURL ?? '',
        },
      ]
    : []

  const columns = useGetFilesColumns({
    onDelete: (file) => {
      setDeleteDialogIsOpen(true)
      setDeleteFileInfo({
        id: file.id || null,
        name: file.providedFileName,
      })
    },
  })

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-lg">Attached files</p>
        {editAllowed && (
          <div className="flex items-center gap-2">
            <DocumentUploadDialog documentId={documentId} />
          </div>
        )}
      </div>

      <DataTable columns={columns} data={file} loading={!documentData} tableKey={TableKeyEnum.TRUST_CENTER_DOCUMENT_FILES} />

      <ConfirmationDialog
        open={deleteDialogIsOpen}
        onOpenChange={setDeleteDialogIsOpen}
        onConfirm={handleDeleteFile}
        title="Delete File"
        description={
          <>
            This action cannot be undone. It will permanently remove <b>{deleteFileInfo.name}</b> from the document.
          </>
        }
      />
    </div>
  )
}
