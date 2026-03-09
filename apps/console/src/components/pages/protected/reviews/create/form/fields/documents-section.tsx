'use client'

import React, { useState } from 'react'
import { useGetReviewFilesPaginated, useUpdateReview, useUploadReviewFiles } from '@/lib/graphql-hooks/review'
import { DocumentsSection } from '@/components/shared/documents-section/documents-section'
import { DocumentsCreateSection } from '@/components/shared/documents-section/documents-create-section'
import { FileOrder, FileOrderField, OrderDirection } from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { getInitialSortConditions, getInitialPagination } from '@repo/ui/data-table'
import { AdditionalTableKeyEnum } from '@repo/ui/table-key'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

type ReviewDocumentsSectionProps = {
  reviewId?: string
  isEditAllowed: boolean
  isCreate: boolean
  onStagedFilesChange?: (files: File[]) => void
  onExistingFileIdsChange?: (fileIds: string[]) => void
}

const REVIEW_FILES_TABLE_KEY = 'review-files' as any

const ReviewDocumentsSection: React.FC<ReviewDocumentsSectionProps> = ({ reviewId, isEditAllowed, isCreate, onStagedFilesChange, onExistingFileIdsChange }) => {
  const [pagination, setPagination] = useState<TPagination>(getInitialPagination(REVIEW_FILES_TABLE_KEY, DEFAULT_PAGINATION))
  const defaultSorting = getInitialSortConditions(REVIEW_FILES_TABLE_KEY, FileOrderField, [
    {
      field: FileOrderField.created_at,
      direction: OrderDirection.ASC,
    },
  ])
  const [orderBy, setOrderBy] = useState<FileOrder[]>(defaultSorting)
  const { successNotification, errorNotification } = useNotification()
  const queryClient = useQueryClient()

  const { files, isLoading, isError, pageInfo, totalCount } = useGetReviewFilesPaginated({
    reviewId,
    orderBy,
    pagination,
  })

  const { mutateAsync: uploadFiles, isPending: isUploading } = useUploadReviewFiles()
  const { mutateAsync: updateReview } = useUpdateReview()

  if (isCreate || !reviewId) {
    if (isCreate && onStagedFilesChange) {
      return <DocumentsCreateSection onFilesChange={onStagedFilesChange} onFileIdsChange={onExistingFileIdsChange} />
    }
    return null
  }

  const handleUpload = async (newFiles: File[]) => {
    try {
      await uploadFiles({
        updateReviewId: reviewId,
        input: {},
        reviewFiles: newFiles,
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
      await updateReview({
        updateReviewId: reviewId,
        input: {
          removeFileIDs: [fileId],
        },
      })
      queryClient.invalidateQueries({ queryKey: ['reviewFiles'] })
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
      parentId={reviewId}
      editAllowed={isEditAllowed}
      tableKey={REVIEW_FILES_TABLE_KEY}
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

export { ReviewDocumentsSection }
