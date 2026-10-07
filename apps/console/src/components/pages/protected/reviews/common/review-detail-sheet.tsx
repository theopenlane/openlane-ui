'use client'

import React from 'react'
import useFormSchema from '@/components/pages/protected/reviews/hooks/use-form-schema'
import { REVIEW_UPDATE_FIELDS } from '@/components/pages/protected/reviews/hooks/review-update-fields'
import { type ReviewsNodeNonNull, useReview, useUpdateReview, useBulkDeleteReview } from '@/lib/graphql-hooks/review'
import { GenericDetailsSheet } from '@/components/shared/crud-base/generic-sheet'
import { getFieldsToRender } from '@/components/pages/protected/reviews/table/table-config'
import { type ReviewSheetConfig, type ReviewFieldProps, objectType } from '@/components/pages/protected/reviews/table/types'
import { type UpdateReviewInput } from '@repo/codegen/src/schema'
import { ReviewStatusOptions } from '@/components/shared/enum-mapper/review-enum'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'

interface ReviewDetailSheetProps {
  reviewId: string
  onClose: () => void
}

const ReviewDetailSheet: React.FC<ReviewDetailSheetProps> = ({ reviewId, onClose }) => {
  const { form } = useFormSchema()

  const { data, isFetching } = useReview(reviewId)

  const baseUpdateMutation = useUpdateReview()
  const baseDeleteMutation = useBulkDeleteReview()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateReviewInput }) => baseUpdateMutation.mutateAsync({ updateReviewId: params.id, input: params.input }),
  }

  const deleteMutation = {
    isPending: baseDeleteMutation.isPending,
    mutateAsync: async (params: { ids: string[] }) => {
      const result = await baseDeleteMutation.mutateAsync({ ids: params.ids })
      return result.deleteBulkReview
    },
  }

  const { enumOptions: environmentOptions } = useGetCustomTypeEnums({ where: { field: 'environment' } })
  const { enumOptions: scopeOptions } = useGetCustomTypeEnums({ where: { field: 'scope' } })
  const tagOptions = useGetTags()

  const enumOpts = { environmentOptions, scopeOptions, tagOptions: tagOptions.tagOptions, statusOptions: ReviewStatusOptions }

  const getName = (d: ReviewsNodeNonNull) => d?.title

  const sheetConfig: ReviewSheetConfig = {
    objectType,
    form,
    entityId: reviewId,
    isCreateMode: false,
    data: data?.review as ReviewsNodeNonNull | undefined,
    isFetching,
    deleteMutation,
    update: { mutation: updateMutation, fields: REVIEW_UPDATE_FIELDS },
    getName,
    renderFields: (props: ReviewFieldProps) => getFieldsToRender(props, enumOpts),
  }

  return <GenericDetailsSheet onClose={onClose} {...sheetConfig} />
}

export default ReviewDetailSheet
