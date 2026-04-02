'use client'

import React, { useState } from 'react'
import { useGetEntityFilesPaginated, useUploadEntityFiles, useUpdateEntity } from '@/lib/graphql-hooks/entity'
import { DocumentsSection } from '@/components/shared/documents-section/documents-section'
import { DocumentsCreateSection } from '@/components/shared/documents-section/documents-create-section'
import { type FileOrder, type FileWhereInput, FileOrderField, OrderDirection } from '@repo/codegen/src/schema'
import { type TPagination } from '@repo/ui/pagination-types'
import { getInitialSortConditions, getInitialPagination } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

type EntityDocumentsSectionProps = {
  entityId?: string
  isEditAllowed: boolean
  isCreate: boolean
  onStagedFilesChange?: (files: File[]) => void
  onExistingFileIdsChange?: (fileIds: string[]) => void
  logoFileId?: string | null
}

const EntityDocumentsSection: React.FC<EntityDocumentsSectionProps> = ({ entityId, isEditAllowed, isCreate, onStagedFilesChange, onExistingFileIdsChange, logoFileId }) => {
  const [pagination, setPagination] = useState<TPagination>(() => getInitialPagination(TableKeyEnum.ENTITY_FILES, DEFAULT_PAGINATION))
  const defaultSorting = getInitialSortConditions(TableKeyEnum.ENTITY_FILES, FileOrderField, [
    {
      field: FileOrderField.created_at,
      direction: OrderDirection.ASC,
    },
  ])
  const [orderBy, setOrderBy] = useState<FileOrder[]>(defaultSorting)
  const { successNotification, errorNotification } = useNotification()
  const queryClient = useQueryClient()

  const fileWhere: FileWhereInput | undefined = logoFileId ? { idNEQ: logoFileId } : undefined

  const { files, isLoading, isError, pageInfo, totalCount } = useGetEntityFilesPaginated({
    entityId,
    orderBy,
    pagination,
    where: fileWhere,
  })

  const { mutateAsync: uploadFiles, isPending: isUploading } = useUploadEntityFiles()
  const { mutateAsync: updateEntity } = useUpdateEntity()

  if (isCreate || !entityId) {
    if (isCreate && onStagedFilesChange) {
      return <DocumentsCreateSection onFilesChange={onStagedFilesChange} onFileIdsChange={onExistingFileIdsChange} />
    }
    return null
  }

  const handleUpload = async (newFiles: File[]) => {
    try {
      await uploadFiles({
        updateEntityId: entityId,
        input: {},
        entityFiles: newFiles,
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
      await updateEntity({
        updateEntityId: entityId,
        input: {
          removeFileIDs: [fileId],
        },
      })
      queryClient.invalidateQueries({ queryKey: ['entityFiles'] })
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
      parentId={entityId}
      editAllowed={isEditAllowed}
      tableKey={TableKeyEnum.ENTITY_FILES}
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

export { EntityDocumentsSection }
