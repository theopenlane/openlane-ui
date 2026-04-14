'use client'

import React, { useRef } from 'react'
import useFormSchema, { type ReviewFormData } from '@/components/pages/protected/reviews/hooks/use-form-schema'
import { type ReviewsNodeNonNull, useUpdateReview, useCreateReview } from '@/lib/graphql-hooks/review'
import { GenericDetailsSheet } from '@/components/shared/crud-base/generic-sheet'
import { getFieldsToRender } from '@/components/pages/protected/reviews/table/table-config'
import { type ReviewSheetConfig, type ReviewFieldProps, objectType } from '@/components/pages/protected/reviews/table/types'
import { type CreateReviewInput, type UpdateReviewInput } from '@repo/codegen/src/schema'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { buildAssociationPayload } from '@/components/shared/object-association/utils'
import { REVIEW_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { buildPayload } from '@/components/pages/protected/reviews/create/utils'

interface CreateReviewSheetProps {
  entityId?: string
  riskId?: string
  onClose: () => void
}

const CreateReviewSheet: React.FC<CreateReviewSheetProps> = ({ entityId, riskId, onClose }) => {
  const { form } = useFormSchema()
  const plateEditorHelper = usePlateEditor()
  const stagedFilesRef = useRef<File[]>([])
  const existingFileIdsRef = useRef<string[]>([])

  const baseUpdateMutation = useUpdateReview()
  const baseCreateMutation = useCreateReview()

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

  const { enumOptions: environmentOptions } = useGetCustomTypeEnums({ where: { field: 'environment' } })
  const { enumOptions: scopeOptions } = useGetCustomTypeEnums({ where: { field: 'scope' } })
  const tagOptions = useGetTags()

  const enumOpts = { environmentOptions, scopeOptions, tagOptions: tagOptions.tagOptions }

  const getName = (d: ReviewsNodeNonNull) => d?.title

  const handleClose = () => {
    form.reset()

    onClose()
  }

  const sheetConfig: ReviewSheetConfig = {
    objectType,
    form,
    entityId,
    isCreateMode: true,
    data: undefined,
    isFetching: false,
    updateMutation,
    createMutation,
    buildPayload: async (formData) => {
      const { controlIDs, subcontrolIDs, remediationIDs, entityIDs, riskIDs, taskIDs, assetIDs, programIDs, ...rest } = formData
      const payload = await buildPayload(rest as ReviewFormData, plateEditorHelper)

      const mergedEntityIDs = [...new Set([...(entityIDs ?? []), entityId].filter((id): id is string => id !== undefined))]
      const mergedRiskIDs = [...new Set([...(riskIDs ?? []), riskId].filter((id): id is string => id !== undefined))]

      const associationPayload = buildAssociationPayload(
        REVIEW_ASSOCIATION_CONFIG.associationKeys,
        { controlIDs, subcontrolIDs, remediationIDs, entityIDs: mergedEntityIDs, riskIDs: mergedRiskIDs, taskIDs, assetIDs, programIDs },
        true,
        {},
      )
      return {
        ...payload,
        ...associationPayload,
      }
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

  return <GenericDetailsSheet onClose={handleClose} {...sheetConfig} />
}

export default CreateReviewSheet
