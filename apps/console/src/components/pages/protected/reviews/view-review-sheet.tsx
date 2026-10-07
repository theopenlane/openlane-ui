'use client'

import React from 'react'
import useFormSchema from './hooks/use-form-schema'
import { REVIEW_UPDATE_FIELDS } from './hooks/review-update-fields'
import { type ReviewsNodeNonNull, useReview, useUpdateReview, useBulkDeleteReview } from '@/lib/graphql-hooks/review'
import { GenericDetailsSheet } from '@/components/shared/crud-base/generic-sheet'
import { getFieldsToRender } from './table/table-config'
import { type ReviewSheetConfig, type ReviewFieldProps, objectType } from './table/types'
import { type UpdateReviewInput } from '@repo/codegen/src/schema'
import { ReviewStatusOptions } from '@/components/shared/enum-mapper/review-enum'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'

type Props = {
  entityId: string | null
  onClose: () => void
  overrideHeader?: React.ReactNode
  overrideContent?: React.ReactNode
}

const ViewReviewSheet: React.FC<Props> = ({ entityId, onClose, overrideHeader, overrideContent }) => {
  const { form } = useFormSchema()
  const { data, isLoading } = useReview(entityId || undefined)

  const baseUpdateMutation = useUpdateReview()
  const baseBulkDeleteMutation = useBulkDeleteReview()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateReviewInput }) => baseUpdateMutation.mutateAsync({ updateReviewId: params.id, input: params.input }),
  }

  const deleteMutation = {
    isPending: baseBulkDeleteMutation.isPending,
    mutateAsync: async (params: { ids: string[] }) => {
      const result = await baseBulkDeleteMutation.mutateAsync({ ids: params.ids })
      return result.deleteBulkReview
    },
  }

  const { enumOptions: environmentOptions } = useGetCustomTypeEnums({ where: { field: 'environment' } })
  const { enumOptions: scopeOptions } = useGetCustomTypeEnums({ where: { field: 'scope' } })
  const tagOptions = useGetTags()

  const enumOpts = { environmentOptions, scopeOptions, tagOptions: tagOptions.tagOptions, statusOptions: ReviewStatusOptions }

  const getName = (d: ReviewsNodeNonNull) => {
    return d?.title
  }

  const sheetConfig: ReviewSheetConfig = {
    objectType,
    form,
    entityId,
    isCreateMode: false,
    data: entityId ? data?.review : undefined,
    isFetching: isLoading,
    deleteMutation,
    onClose,
    basePath: '/exposure/reviews',
    update: { mutation: updateMutation, fields: REVIEW_UPDATE_FIELDS },
    getName,
    renderFields: (props: ReviewFieldProps) => getFieldsToRender(props, enumOpts),
  }

  return <GenericDetailsSheet onClose={onClose} {...sheetConfig} overrideHeader={overrideHeader} overrideContent={overrideContent} />
}

export default ViewReviewSheet
