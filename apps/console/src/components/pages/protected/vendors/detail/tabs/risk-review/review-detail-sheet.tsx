'use client'

import React, { useRef } from 'react'
import useFormSchema, { type ReviewFormData } from '@/components/pages/protected/reviews/hooks/use-form-schema'
import { type ReviewsNodeNonNull, useReview, useUpdateReview, useCreateReview, useDeleteReview } from '@/lib/graphql-hooks/review'
import { GenericDetailsSheet } from '@/components/shared/crud-base/generic-sheet'
import { getFieldsToRender } from '@/components/pages/protected/reviews/table/table-config'
import { type ReviewSheetConfig, type ReviewFieldProps, objectType } from '@/components/pages/protected/reviews/table/types'
import { type CreateReviewInput, type UpdateReviewInput } from '@repo/codegen/src/schema'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { buildPayload } from '@/components/pages/protected/reviews/create/utils'

interface ReviewDetailSheetProps {
  reviewId: string
  onClose: () => void
}

const ReviewDetailSheet: React.FC<ReviewDetailSheetProps> = ({ reviewId, onClose }) => {
  const { form } = useFormSchema()
  const plateEditorHelper = usePlateEditor()
  const stagedFilesRef = useRef<File[]>([])
  const existingFileIdsRef = useRef<string[]>([])

  const { data, isFetching } = useReview(reviewId)

  const baseUpdateMutation = useUpdateReview()
  const baseCreateMutation = useCreateReview()
  const baseDeleteMutation = useDeleteReview()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateReviewInput }) => baseUpdateMutation.mutateAsync({ updateReviewId: params.id, input: params.input }),
  }

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (input: CreateReviewInput) => {
      const reviewFiles = stagedFilesRef.current.length > 0 ? stagedFilesRef.current : undefined
      const fileIDs = existingFileIdsRef.current.length > 0 ? existingFileIdsRef.current : undefined
      const result = await baseCreateMutation.mutateAsync({ input: { ...input, fileIDs }, reviewFiles })
      stagedFilesRef.current = []
      existingFileIdsRef.current = []
      return result
    },
  }

  const deleteMutation = {
    isPending: baseDeleteMutation.isPending,
    mutateAsync: async (params: { ids: string[] }) => {
      const results = await Promise.all(params.ids.map((id) => baseDeleteMutation.mutateAsync({ deleteReviewId: id })))
      return results.map((r) => r.deleteReview.deletedID)
    },
  }

  const { enumOptions: environmentOptions } = useGetCustomTypeEnums({ where: { field: 'environment' } })
  const { enumOptions: scopeOptions } = useGetCustomTypeEnums({ where: { field: 'scope' } })
  const tagOptions = useGetTags()

  const enumOpts = { environmentOptions, scopeOptions, tagOptions: tagOptions.tagOptions }

  const getName = (d: ReviewsNodeNonNull) => d?.title

  const sheetConfig: ReviewSheetConfig = {
    objectType,
    form,
    entityId: reviewId,
    isCreateMode: false,
    data: data?.review as ReviewsNodeNonNull | undefined,
    isFetching,
    updateMutation,
    createMutation,
    deleteMutation,
    buildPayload: async (formData) => {
      const {
        controlIDs: _controlIDs,
        subcontrolIDs: _subcontrolIDs,
        remediationIDs: _remediationIDs,
        entityIDs: _entityIDs,
        taskIDs: _taskIDs,
        assetIDs: _assetIDs,
        programIDs: _programIDs,
        ...rest
      } = formData
      return await buildPayload(rest as ReviewFormData, plateEditorHelper)
    },
    getName,
    renderFields: (props: ReviewFieldProps) =>
      getFieldsToRender(
        props,
        enumOpts,
        (files: File[]) => {
          stagedFilesRef.current = files
        },
        (fileIds: string[]) => {
          existingFileIdsRef.current = fileIds
        },
      ),
  }

  return <GenericDetailsSheet onClose={onClose} {...sheetConfig} />
}

export default ReviewDetailSheet
