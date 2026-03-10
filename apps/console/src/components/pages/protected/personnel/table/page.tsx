'use client'

import React, { useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import useFormSchema, { bulkEditFieldSchema } from '../hooks/use-form-schema'

import {
  IdentityHolderUserStatus,
  IdentityHolderIdentityHolderType,
  type IdentityHolderQuery,
  type UpdateIdentityHolderInput,
  type CreateIdentityHolderInput,
  type GetIdentityHolderAssociationsQuery,
} from '@repo/codegen/src/schema'
import { normalizeEntityData, buildResponsibilityPayload } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import {
  useUpdateIdentityHolder,
  useBulkDeleteIdentityHolder,
  useCreateBulkCSVIdentityHolder,
  useBulkEditIdentityHolder,
  useIdentityHolder,
  useGetIdentityHolderAssociations,
  type IdentityHoldersNodeNonNull,
  useCreateIdentityHolderWithFiles,
} from '@/lib/graphql-hooks/identity-holder'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFieldsToRender, getFilterFields, visibilityFields } from './table-config'
import { type PersonnelSheetConfig, type PersonnelTablePageConfig, objectType, objectName, tableKey, exportType, orderFieldEnum, defaultSorting, type PersonnelFieldProps } from './types'
import { getColumns } from './columns'
import TableComponent from './table'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { buildAssociationPayload } from '@/components/shared/object-association/utils'
import { useInitialAssociations } from '@/hooks/useInitialAssociations'
import { IDENTITY_HOLDER_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'

const normalizeData = (data: IdentityHolderQuery['identityHolder']) =>
  normalizeEntityData(data, {
    internalOwner: { user: data?.internalOwnerUser, group: data?.internalOwnerGroup, stringValue: data?.internalOwner },
  })

const PersonnelPage: React.FC = () => {
  const { form } = useFormSchema()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const isCreate = searchParams.get('create') === 'true'
  const { data, isLoading } = useIdentityHolder(id || undefined)
  const { data: associationsData } = useGetIdentityHolderAssociations(id || undefined)
  const extractAssociations = useCallback((assocData: GetIdentityHolderAssociationsQuery) => {
    const identityHolder = assocData.identityHolder
    return {
      assetIDs: (identityHolder.assets?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      entityIDs: (identityHolder.entities?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      campaignIDs: (identityHolder.campaigns?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      taskIDs: (identityHolder.tasks?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
    }
  }, [])
  const initialAssociationsRef = useInitialAssociations(associationsData, extractAssociations, id)
  const stagedFilesRef = useRef<File[]>([])
  const existingFileIdsRef = useRef<string[]>([])

  function getName(data: IdentityHoldersNodeNonNull) {
    return data?.fullName
  }

  const baseUpdateMutation = useUpdateIdentityHolder()
  const baseCreateMutation = useCreateIdentityHolderWithFiles()
  const baseBulkDeleteMutation = useBulkDeleteIdentityHolder()
  const baseBulkCreateMutation = useCreateBulkCSVIdentityHolder()
  const baseBulkEditMutation = useBulkEditIdentityHolder()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateIdentityHolderInput }) => baseUpdateMutation.mutateAsync({ updateIdentityHolderId: params.id, input: params.input }),
  }

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

      return result.deleteBulkIdentityHolder.deletedIDs
    },
  }

  const bulkCreateMutation = {
    isPending: baseBulkCreateMutation.isPending,
    mutateAsync: async (params: { input: File }) => {
      const result = await baseBulkCreateMutation.mutateAsync({ input: params.input })
      return result
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
    form,
    data: id ? data?.identityHolder : undefined,
    isFetching: isLoading,
    updateMutation,
    createMutation,
    buildPayload: async (data) => {
      const { assetIDs, entityIDs, campaignIDs, taskIDs, internalOwner, ...rest } = data
      const associationPayload = buildAssociationPayload(IDENTITY_HOLDER_ASSOCIATION_CONFIG.associationKeys, { assetIDs, entityIDs, campaignIDs, taskIDs }, isCreate, initialAssociationsRef.current)

      return {
        ...rest,
        ...associationPayload,
        ...buildResponsibilityPayload('internalOwner', internalOwner, { mode: isCreate ? 'create' : 'update' }),
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
    onBulkDelete: async (ids: string[]) => {
      await deleteMutation.mutateAsync({ ids })
    },
    onBulkCreate: async (file: File) => {
      await bulkCreateMutation.mutateAsync({ input: file })
    },
    onBulkEdit: async (ids: string[], input: UpdateIdentityHolderInput) => {
      await bulkEditMutation.mutateAsync({ ids, input })
    },
    bulkEditFormSchema: bulkEditFieldSchema,
    enumOpts,
  }

  return <GenericTablePage {...tableConfig} />
}

export default PersonnelPage
