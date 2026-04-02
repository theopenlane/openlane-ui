'use client'

import React, { useCallback, useMemo, useState } from 'react'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { type Value } from 'platejs'
import { useSearchParams } from 'next/navigation'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import useFormSchema, { bulkEditFieldSchema } from '../hooks/use-form-schema'

import { EntityEntityStatus, EntityFrequency, type EntityQuery, type UpdateEntityInput, type CreateEntityInput, type GetEntityAssociationsQuery } from '@repo/codegen/src/schema'
import { normalizeEntityData, buildResponsibilityPayload } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import {
  useUpdateEntity,
  useBulkDeleteEntity,
  useCreateBulkCSVEntity,
  useBulkEditEntity,
  type EntitiesNodeNonNull,
  useGetEntityAssociations,
  useCreateEntityWithFiles,
} from '@/lib/graphql-hooks/entity'
import { useEntity } from '@/lib/graphql-hooks/entity'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFieldsToRender, getFilterFields, visibilityFields } from './table-config'
import { type EntitySheetConfig, type EntityTablePageConfig, objectType, objectName, displayName, tableKey, exportType, orderFieldEnum, defaultSorting, type EntityFieldProps } from './types'
import { createVendorSteps } from '../create/steps/vendor-create-steps'
import { getColumns } from './columns'
import TableComponent from './table'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { buildAssociationPayload } from '@/components/shared/object-association/utils'
import { useInitialAssociations } from '@/hooks/useInitialAssociations'
import { ENTITY_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'

const normalizeData = (data: EntityQuery['entity']) =>
  normalizeEntityData(data, {
    internalOwner: { user: data?.internalOwnerUser, group: data?.internalOwnerGroup, stringValue: data?.internalOwner },
    reviewedBy: { user: data?.reviewedByUser, group: data?.reviewedByGroup, stringValue: data?.reviewedBy },
  })

const VendorPage: React.FC = () => {
  const { form } = useFormSchema()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const isCreate = searchParams.get('create') === 'true'
  const { data, isLoading } = useEntity(id || undefined)
  const { data: associationsData } = useGetEntityAssociations(id || undefined)
  const extractAssociations = useCallback((assocData: GetEntityAssociationsQuery) => {
    const entity = assocData.entity
    return {
      assetIDs: (entity.assets?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      scanIDs: (entity.scans?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      campaignIDs: (entity.campaigns?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      identityHolderIDs: (entity.identityHolders?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
    }
  }, [])
  const initialAssociationsRef = useInitialAssociations(associationsData, extractAssociations, id)

  const [stagedFiles, setStagedFiles] = useState<File[]>([])
  const [existingFileIds, setExistingFileIds] = useState<string[]>([])
  const [stagedLogoFile, setStagedLogoFile] = useState<File | null>(null)
  const plateEditorHelper = usePlateEditor()

  function getName(data: EntitiesNodeNonNull) {
    return data?.name
  }

  const baseUpdateMutation = useUpdateEntity()
  const baseCreateMutation = useCreateEntityWithFiles()
  const baseBulkDeleteMutation = useBulkDeleteEntity()
  const baseBulkCreateMutation = useCreateBulkCSVEntity()
  const baseBulkEditMutation = useBulkEditEntity()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateEntityInput }) => baseUpdateMutation.mutateAsync({ updateEntityId: params.id, input: params.input }),
  }

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (input: CreateEntityInput) => {
      const entityFiles = stagedFiles.length > 0 ? stagedFiles : undefined
      const fileIDs = existingFileIds.length > 0 ? existingFileIds : undefined
      const logoFile = stagedLogoFile ?? undefined
      const result = await baseCreateMutation.mutateAsync({ input: { ...input, fileIDs }, entityTypeName: 'vendor', entityFiles, logoFile })
      setStagedFiles([])
      setExistingFileIds([])
      setStagedLogoFile(null)
      return result
    },
  }

  const deleteMutation = {
    isPending: baseBulkDeleteMutation.isPending,
    mutateAsync: async (params: { ids: string[] }) => {
      const result = await baseBulkDeleteMutation.mutateAsync({ ids: params.ids })

      return result.deleteBulkEntity.deletedIDs
    },
  }

  const bulkCreateMutation = {
    isPending: baseBulkCreateMutation.isPending,
    mutateAsync: async (params: { input: File }) => {
      const result = await baseBulkCreateMutation.mutateAsync({ input: params.input, entityTypeName: 'vendor' })
      return result
    },
  }

  const bulkEditMutation = baseBulkEditMutation

  const { enumOptions: securityQuestionnaireStatusOptions, onCreateOption: createSecurityQuestionnaireStatus } = useCreatableEnumOptions({
    objectType: 'entity',
    field: 'entitySecurityQuestionnaireStatus',
  })

  const { enumOptions: sourceTypeOptions, onCreateOption: createSourceType } = useCreatableEnumOptions({
    objectType: 'entity',
    field: 'entitySourceType',
  })

  const { enumOptions: relationshipStateOptions, onCreateOption: createRelationshipState } = useCreatableEnumOptions({
    objectType: 'entity',
    field: 'relationshipState',
  })

  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({
    field: 'environment',
  })

  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({
    field: 'scope',
  })

  const reviewFrequencyOptions = enumToOptions(EntityFrequency)
  const entityStatusOptions = enumToOptions(EntityEntityStatus)

  const { tagOptions } = useGetTags()

  const enumOpts = {
    relationshipStateOptions,
    securityQuestionnaireStatusOptions,
    sourceTypeOptions,
    environmentOptions,
    scopeOptions,
    reviewFrequencyOptions,
    entityStatusOptions,
    tagOptions,
  }

  const enumCreateHandlers = {
    entitySourceTypeName: createSourceType,
    entityRelationshipStateName: createRelationshipState,
    entitySecurityQuestionnaireStatusName: createSecurityQuestionnaireStatus,
    environmentName: createEnvironment,
    scopeName: createScope,
  }

  const sheetConfig: EntitySheetConfig = {
    objectType: objectType,
    displayName,
    form,
    data: id ? data?.entity : undefined,
    isFetching: isLoading,
    updateMutation,
    createMutation,
    deleteMutation,
    buildPayload: async (data) => {
      const { assetIDs, scanIDs, campaignIDs, identityHolderIDs, contactIDs, internalOwner, reviewedBy, ...rest } = data
      const description = rest.description ? await plateEditorHelper.convertToHtml(rest.description as Value) : undefined
      const associationPayload = buildAssociationPayload(ENTITY_ASSOCIATION_CONFIG.associationKeys, { assetIDs, scanIDs, campaignIDs, identityHolderIDs }, isCreate, initialAssociationsRef.current)

      return {
        ...rest,
        description,
        ...associationPayload,
        ...(contactIDs && contactIDs.length > 0 ? { contactIDs } : {}),
        ...buildResponsibilityPayload('internalOwner', internalOwner, { mode: isCreate ? 'create' : 'update' }),
        ...buildResponsibilityPayload('reviewedBy', reviewedBy, { mode: isCreate ? 'create' : 'update' }),
      }
    },
    normalizeData,
    getName,
    renderFields: (props: EntityFieldProps) => getFieldsToRender(props, enumOpts, setStagedFiles, setExistingFileIds, enumCreateHandlers),
  }

  const vendorCreateSteps = useMemo(() => createVendorSteps(setStagedFiles, setExistingFileIds, setStagedLogoFile), [setStagedFiles, setExistingFileIds, setStagedLogoFile])

  const tableConfig: EntityTablePageConfig = {
    objectType,
    objectName,
    displayName,
    tableKey,
    exportType,
    orderFieldEnum,
    defaultSorting,
    defaultVisibility: visibilityFields,
    filterFields: getFilterFields(enumOpts),
    searchFields: ['displayNameContainsFold', 'descriptionContainsFold'],
    breadcrumbs,
    form,
    getColumns,
    TableComponent,
    sheetConfig,
    viewEditMode: { type: 'full-page', route: '/registry/vendors' },
    createMode: { type: 'step-dialog', steps: vendorCreateSteps, title: 'Create Vendor' },
    onBulkDelete: async (ids: string[]) => {
      await deleteMutation.mutateAsync({ ids })
    },
    onBulkCreate: async (file: File) => {
      await bulkCreateMutation.mutateAsync({ input: file })
    },
    onBulkEdit: async (ids: string[], input: UpdateEntityInput) => {
      await bulkEditMutation.mutateAsync({ ids, input })
    },
    bulkEditFormSchema: bulkEditFieldSchema,
    enumOpts,
    responsibilityFields: {
      internalOwner: { fieldBaseName: 'internalOwner' },
      reviewedBy: { fieldBaseName: 'reviewedBy' },
    },
  }

  return <GenericTablePage {...tableConfig} />
}

export default VendorPage
