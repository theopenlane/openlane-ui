'use client'

import React, { useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import useFormSchema, { type ReviewFormData } from '@/components/pages/protected/reviews/hooks/use-form-schema'
import { type ReviewsNodeNonNull, useReview, useUpdateReview, useCreateReview, useGetReviewAssociations } from '@/lib/graphql-hooks/review'
import { GenericDetailsSheet } from '@/components/shared/crud-base/generic-sheet'
import { getFieldsToRender } from '@/components/pages/protected/reviews/table/table-config'
import { type ReviewSheetConfig, type ReviewFieldProps, objectType } from '@/components/pages/protected/reviews/table/types'
import { type CreateReviewInput, type UpdateReviewInput, type GetReviewAssociationsQuery } from '@repo/codegen/src/schema'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { buildAssociationPayload } from '@/components/shared/object-association/utils'
import { useInitialAssociations } from '@/hooks/useInitialAssociations'
import { REVIEW_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { buildPayload } from '@/components/pages/protected/reviews/create/utils'

type ReviewDetailsSheetProps = {
  queryParamKey: string
}

const ReviewDetailsSheet: React.FC<ReviewDetailsSheetProps> = ({ queryParamKey }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const entityId = searchParams.get(queryParamKey)

  const { form } = useFormSchema()
  const { data, isLoading } = useReview(entityId || undefined)
  const { data: associationsData } = useGetReviewAssociations(entityId || undefined)

  const extractAssociations = useCallback((assocData: GetReviewAssociationsQuery) => {
    const review = assocData.review
    return {
      controlIDs: (review.controls?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      subcontrolIDs: (review.subcontrols?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      remediationIDs: (review.remediations?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      entityIDs: (review.entities?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      taskIDs: (review.tasks?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      assetIDs: (review.assets?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      programIDs: (review.programs?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
    }
  }, [])
  const initialAssociationsRef = useInitialAssociations(associationsData, extractAssociations, entityId)

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

  function getName(d: ReviewsNodeNonNull) {
    return d?.title
  }

  const handleClose = () => {
    form.reset()
    const params = new URLSearchParams(searchParams.toString())
    params.delete(queryParamKey)
    router.replace(`${window.location.pathname}?${params.toString()}`)
  }

  const sheetConfig: ReviewSheetConfig = {
    objectType,
    form,
    entityId,
    isCreateMode: false,
    data: entityId ? data?.review : undefined,
    isFetching: isLoading,
    updateMutation,
    createMutation,
    buildPayload: async (formData) => {
      const { controlIDs, subcontrolIDs, remediationIDs, entityIDs, taskIDs, assetIDs, programIDs, ...rest } = formData
      const payload = await buildPayload(rest as ReviewFormData, plateEditorHelper)
      const associationPayload = buildAssociationPayload(
        REVIEW_ASSOCIATION_CONFIG.associationKeys,
        { controlIDs, subcontrolIDs, remediationIDs, entityIDs, taskIDs, assetIDs, programIDs },
        false,
        initialAssociationsRef.current,
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

export default ReviewDetailsSheet
