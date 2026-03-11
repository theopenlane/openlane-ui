'use client'

import React, { useCallback, useRef } from 'react'
import useFormSchema, { bulkEditFieldSchema, type ReviewFormData } from '../hooks/use-form-schema'

import {
  type ReviewsNodeNonNull,
  useReview,
  useCreateReview,
  useUpdateReview,
  useBulkDeleteReview,
  useCreateBulkCSVReview,
  useBulkEditReview,
  useGetReviewAssociations,
} from '@/lib/graphql-hooks/review'
import { useSearchParams } from 'next/navigation'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFieldsToRender, getFilterFields, visibilityFields } from './table-config'
import { type ReviewSheetConfig, type ReviewTablePageConfig, type ReviewFieldProps, objectType, objectName, tableKey, exportType, orderFieldEnum, defaultSorting } from './types'
import { getColumns } from './columns'
import TableComponent from './table'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { buildPayload } from '../create/utils'
import { type CreateReviewInput, type UpdateReviewInput, type GetReviewAssociationsQuery } from '@repo/codegen/src/schema'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { buildAssociationPayload } from '@/components/shared/object-association/utils'
import { useInitialAssociations } from '@/hooks/useInitialAssociations'
import { REVIEW_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'

const ReviewPage: React.FC = () => {
  const { form } = useFormSchema()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const isCreate = searchParams.get('create') === 'true'
  const { data, isLoading } = useReview(id || undefined)
  const { data: associationsData } = useGetReviewAssociations(id || undefined)

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

  const initialAssociationsRef = useInitialAssociations(associationsData, extractAssociations, id)

  const plateEditorHelper = usePlateEditor()

  const stagedFilesRef = useRef<File[]>([])
  const existingFileIdsRef = useRef<string[]>([])

  function getName(data: ReviewsNodeNonNull) {
    return data?.title
  }

  const baseUpdateMutation = useUpdateReview()
  const baseCreateMutation = useCreateReview()
  const baseBulkDeleteMutation = useBulkDeleteReview()
  const baseBulkCreateMutation = useCreateBulkCSVReview()
  const bulkEditMutation = useBulkEditReview()

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

  const bulkCreateMutation = {
    isPending: baseBulkCreateMutation.isPending,
    mutateAsync: async (params: { input: File }) => {
      const result = await baseBulkCreateMutation.mutateAsync({ input: params.input })
      return result
    },
  }

  const { enumOptions: environmentOptions } = useGetCustomTypeEnums({
    where: { field: 'environment' },
  })

  const { enumOptions: scopeOptions } = useGetCustomTypeEnums({
    where: { field: 'scope' },
  })

  const tagOptions = useGetTags()

  const enumOpts = {
    environmentOptions,
    scopeOptions,
    tagOptions: tagOptions.tagOptions,
  }

  const sheetConfig: ReviewSheetConfig = {
    objectType: objectType,
    form,
    data: id ? data?.review : undefined,
    isFetching: isLoading,
    updateMutation,
    createMutation,
    buildPayload: async (data) => {
      const { controlIDs, subcontrolIDs, remediationIDs, entityIDs, taskIDs, assetIDs, programIDs, ...rest } = data
      const payload = await buildPayload(rest as ReviewFormData, plateEditorHelper)
      const associationPayload = buildAssociationPayload(
        REVIEW_ASSOCIATION_CONFIG.associationKeys,
        { controlIDs, subcontrolIDs, remediationIDs, entityIDs, taskIDs, assetIDs, programIDs },
        isCreate,
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

  const tableConfig: ReviewTablePageConfig = {
    objectType,
    objectName,
    tableKey,
    exportType,
    orderFieldEnum,
    defaultSorting,
    defaultVisibility: visibilityFields,
    filterFields: getFilterFields(enumOpts),
    searchFields: ['titleContainsFold', 'summaryContainsFold', 'detailsContainsFold'],
    breadcrumbs,
    form,
    getColumns,
    TableComponent,
    sheetConfig,
    onBulkDelete: async (ids: string[]) => {
      await baseBulkDeleteMutation.mutateAsync({ ids })
    },
    onBulkCreate: async (file: File) => {
      await bulkCreateMutation.mutateAsync({ input: file })
    },
    onBulkEdit: async (ids: string[], input: UpdateReviewInput) => {
      await bulkEditMutation.mutateAsync({ ids, input })
    },
    bulkEditFormSchema: bulkEditFieldSchema,
    enumOpts,
  }

  return <GenericTablePage {...tableConfig} />
}

export default ReviewPage
