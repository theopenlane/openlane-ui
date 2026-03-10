'use client'

import React, { useState } from 'react'
import { useGetIdentityHolderFilesPaginated, useUploadIdentityHolderFiles, useUpdateIdentityHolder } from '@/lib/graphql-hooks/identity-holder'
import { DocumentsSection } from '@/components/shared/documents-section/documents-section'
import { DocumentsCreateSection } from '@/components/shared/documents-section/documents-create-section'
import { type FileOrder, FileOrderField, OrderDirection } from '@repo/codegen/src/schema'
import { type TPagination } from '@repo/ui/pagination-types'
import { getInitialSortConditions, getInitialPagination } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

type IdentityHolderDocumentsSectionProps = {
  identityHolderId?: string
  isEditAllowed: boolean
  isCreate: boolean
  onStagedFilesChange?: (files: File[]) => void
  onExistingFileIdsChange?: (fileIds: string[]) => void
}

const IdentityHolderDocumentsSection: React.FC<IdentityHolderDocumentsSectionProps> = ({ identityHolderId, isEditAllowed, isCreate, onStagedFilesChange, onExistingFileIdsChange }) => {
  const [pagination, setPagination] = useState<TPagination>(() => getInitialPagination(TableKeyEnum.IDENTITY_HOLDER_FILES, DEFAULT_PAGINATION))
  const defaultSorting = getInitialSortConditions(TableKeyEnum.IDENTITY_HOLDER_FILES, FileOrderField, [
    {
      field: FileOrderField.created_at,
      direction: OrderDirection.ASC,
    },
  ])
  const [orderBy, setOrderBy] = useState<FileOrder[]>(defaultSorting)
  const { successNotification, errorNotification } = useNotification()
  const queryClient = useQueryClient()

  const { files, isLoading, isError, pageInfo, totalCount } = useGetIdentityHolderFilesPaginated({
    identityHolderId,
    orderBy,
    pagination,
  })

  const { mutateAsync: uploadFiles, isPending: isUploading } = useUploadIdentityHolderFiles()
  const { mutateAsync: updateIdentityHolder } = useUpdateIdentityHolder()

  if (isCreate || !identityHolderId) {
    if (isCreate && onStagedFilesChange) {
      return <DocumentsCreateSection onFilesChange={onStagedFilesChange} onFileIdsChange={onExistingFileIdsChange} />
    }
    return null
  }

  const handleUpload = async (newFiles: File[]) => {
    try {
      await uploadFiles({
        updateIdentityHolderId: identityHolderId,
        input: {},
        identityHolderFiles: newFiles,
      })
      successNotification({
        title: 'Documents uploaded',
        description: 'Documents have been successfully uploaded.',
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
      throw error
    }
  }

  const handleRemoveFile = async (fileId: string) => {
    try {
      await updateIdentityHolder({
        updateIdentityHolderId: identityHolderId,
        input: {
          removeFileIDs: [fileId],
        },
      })
      queryClient.invalidateQueries({ queryKey: ['identityHolderFiles'] })
      successNotification({
        title: 'Document removed',
        description: 'The document has been successfully removed.',
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  return (
    <DocumentsSection
      parentId={identityHolderId}
      editAllowed={isEditAllowed}
      tableKey={TableKeyEnum.IDENTITY_HOLDER_FILES}
      files={files}
      isLoading={isLoading}
      isError={isError}
      pageInfo={pageInfo}
      totalCount={totalCount}
      pagination={pagination}
      onPaginationChange={setPagination}
      defaultSorting={defaultSorting}
      onSortChange={setOrderBy}
      onUpload={handleUpload}
      isUploading={isUploading}
      onRemoveFile={handleRemoveFile}
    />
  )
}

export { IdentityHolderDocumentsSection }
