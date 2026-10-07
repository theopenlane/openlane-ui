'use client'

import React, { useRef } from 'react'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import useFormSchema, { bulkEditFieldSchema } from '../hooks/use-form-schema'

import { IdentityHolderUserStatus, IdentityHolderIdentityHolderType, type UpdateIdentityHolderInput, type CreateIdentityHolderInput } from '@repo/codegen/src/schema'
import { normalizeEntityData, buildResponsibilityPayload } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { useBulkDeleteIdentityHolder, useBulkEditIdentityHolder, type IdentityHoldersNodeNonNull, useCreateIdentityHolderWithFiles } from '@/lib/graphql-hooks/identity-holder'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFieldsToRender, getFilterFields, visibilityFields } from './table-config'
import {
  type PersonnelSheetConfig,
  type PersonnelTablePageConfig,
  objectType,
  objectName,
  displayName,
  displayNamePlural,
  tableKey,
  exportType,
  orderFieldEnum,
  defaultSorting,
  type PersonnelFieldProps,
} from './types'
import { getColumns } from './columns'
import TableComponent from './table'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { buildAssociationPayload } from '@/components/shared/object-association/utils'
import { IDENTITY_HOLDER_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'

const normalizeData = (data: IdentityHoldersNodeNonNull | null | undefined) =>
  normalizeEntityData(data, {
    internalOwner: {
      personnel: data?.internalOwnerIdentityHolder,
      user: data?.internalOwnerUser,
      group: data?.internalOwnerGroup,
      stringValue: data?.internalOwner,
    },
  })

const PersonnelPage: React.FC = () => {
  const { form } = useFormSchema()

  const stagedFilesRef = useRef<File[]>([])
  const existingFileIdsRef = useRef<string[]>([])

  function getName(data: IdentityHoldersNodeNonNull) {
    return data?.fullName
  }

  const baseCreateMutation = useCreateIdentityHolderWithFiles()
  const baseBulkDeleteMutation = useBulkDeleteIdentityHolder()
  const baseBulkEditMutation = useBulkEditIdentityHolder()

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (input: CreateIdentityHolderInput) => {
      const identityHolderFiles = stagedFilesRef.current.length > 0 ? stagedFilesRef.current : undefined
      const fileIDs = existingFileIdsRef.current.length > 0 ? existingFileIdsRef.current : undefined
      const result = await baseCreateMutation.mutateAsync({ input: { ...input, fileIDs }, identityHolderFiles })
      stagedFilesRef.current = []
      existingFileIdsRef.current = []
      return result
    },
  }

  const deleteMutation = {
    isPending: baseBulkDeleteMutation.isPending,
    mutateAsync: async (params: { ids: string[] }) => {
      const result = await baseBulkDeleteMutation.mutateAsync({ ids: params.ids })

      return result.deleteBulkIdentityHolder
    },
  }

  const bulkEditMutation = baseBulkEditMutation

  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({
    field: 'environment',
  })

  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({
    field: 'scope',
  })

  const statusOptions = Object.values(IdentityHolderUserStatus).map((value) => ({
    value,
    label: getEnumLabel(value as string),
  }))

  const identityHolderTypeOptions = Object.values(IdentityHolderIdentityHolderType).map((value) => ({
    value,
    label: getEnumLabel(value as string),
  }))

  const { tagOptions } = useGetTags()

  const enumOpts = {
    statusOptions,
    identityHolderTypeOptions,
    environmentOptions,
    scopeOptions,
    tagOptions,
  }

  const enumCreateHandlers = {
    environmentName: createEnvironment,
    scopeName: createScope,
  }

  const sheetConfig: PersonnelSheetConfig = {
    objectType: objectType,
    displayName,
    form,
    isFetching: false,
    createMutation,
    deleteMutation,
    buildPayload: async (data) => {
      const { assetIDs, controlIDs, subcontrolIDs, entityIDs, campaignIDs, internalPolicyIDs, taskIDs, internalOwner, ...rest } = data
      const associationPayload = buildAssociationPayload(
        IDENTITY_HOLDER_ASSOCIATION_CONFIG.associationKeys,
        { assetIDs, controlIDs, subcontrolIDs, entityIDs, campaignIDs, internalPolicyIDs, taskIDs },
        true,
        {},
      )

      return {
        ...rest,
        ...associationPayload,
        ...buildResponsibilityPayload('internalOwner', internalOwner, { mode: 'create' }),
      }
    },
    normalizeData,
    getName,
    renderFields: (props: PersonnelFieldProps) =>
      getFieldsToRender(
        props,
        enumOpts,
        (files: File[]) => {
          stagedFilesRef.current = files
        },
        (fileIds: string[]) => {
          existingFileIdsRef.current = fileIds
        },
        enumCreateHandlers,
      ),
  }

  const tableConfig: PersonnelTablePageConfig = {
    objectType,
    objectName,
    displayName,
    displayNamePlural,
    tableKey,
    exportType,
    orderFieldEnum,
    defaultSorting,
    defaultVisibility: visibilityFields,
    filterFields: getFilterFields(enumOpts),
    searchFields: ['fullNameContainsFold', 'emailContainsFold'],
    breadcrumbs,
    form,
    getColumns,
    TableComponent,
    sheetConfig,
    viewEditMode: { type: 'full-page', route: '/registry/personnel' },
    onBulkDelete: async (ids: string[]) => {
      return deleteMutation.mutateAsync({ ids })
    },
    onBulkEdit: async (ids: string[], input: UpdateIdentityHolderInput) => {
      const result = await bulkEditMutation.mutateAsync({ ids, input })
      return result.updateBulkIdentityHolder
    },
    bulkEditFormSchema: bulkEditFieldSchema,
    enumOpts,
    responsibilityFields: {
      internalOwner: { fieldBaseName: 'internalOwner' },
    },
  }

  return <GenericTablePage {...tableConfig} />
}

export default PersonnelPage
