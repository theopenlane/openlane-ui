'use client'

import React, { useCallback, useMemo, useState } from 'react'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { type Value } from 'platejs'
import { useSearchParams } from 'next/navigation'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'
import useFormSchema, { bulkEditFieldSchema } from '../hooks/use-form-schema'

import { EntityEntityStatus, EntityFrequency, EntityVendorTier, type UpdateEntityInput, type CreateEntityInput, type GetEntityAssociationsQuery } from '@repo/codegen/src/schema'
import { normalizeEntityData, buildResponsibilityPayload } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { useUpdateEntity, useBulkDeleteEntity, useBulkEditEntity, type EntitiesNodeNonNull, useGetEntityAssociations, useCreateEntityWithFiles, vendorDisplayName } from '@/lib/graphql-hooks/entity'
import { useEntity } from '@/lib/graphql-hooks/entity'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFieldsToRender, getFilterFields, visibilityFields } from './table-config'
import { type EntitySheetConfig, type EntityTablePageConfig, objectType, objectName, displayName, tableKey, exportType, orderFieldEnum, defaultSorting, type EntityFieldProps } from './types'
import { createVendorSteps } from '../create/steps/vendor-create-steps'
import { useVendorSoc2ReportReview } from '../create/use-vendor-soc2-report-review'
import { LazyReportScanUploadSheet } from '@/components/shared/report-scan-upload/lazy-report-scan-upload-sheet'
import { useCanCreateScan } from '@/hooks/useCanCreateScan'
import { SOC_2_FRAMEWORK_NAME } from '@/constants/trust-services-category-names'
import { FileSearch } from 'lucide-react'
import { tableActionAnchor } from '@/components/shared/element-anchor/element-anchor'
import { getColumns } from './columns'
import TableComponent from './table'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { buildAssociationPayload } from '@/components/shared/object-association/utils'
import { useInitialAssociations } from '@/hooks/useInitialAssociations'
import { ENTITY_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'

const normalizeData = (data: EntitiesNodeNonNull) =>
  normalizeEntityData(data, {
    internalOwner: {
      personnel: data?.internalOwnerIdentityHolder,
      user: data?.internalOwnerUser,
      group: data?.internalOwnerGroup,
      stringValue: data?.internalOwner,
    },
    reviewedBy: {
      personnel: data?.reviewedByIdentityHolder,
      user: data?.reviewedByUser,
      group: data?.reviewedByGroup,
      stringValue: data?.reviewedBy,
    },
  })

const VendorPage: React.FC = () => {
  const { form } = useFormSchema()

  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const isCreate = searchParams.get('create') === 'true'
  const scanId = searchParams.get('scanId')
  const { data, isLoading } = useEntity(id || undefined)
  const { data: associationsData } = useGetEntityAssociations(id || undefined)
  const extractAssociations = useCallback((assocData: GetEntityAssociationsQuery) => {
    const entity = assocData.entity
    return {
      assetIDs: (entity.assets?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      scanIDs: (entity.scans?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      campaignIDs: (entity.campaigns?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      identityHolderIDs: (entity.identityHolders?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      internalPolicyIDs: (entity.internalPolicies?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      subcontrolIDs: (entity.subcontrols?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
    }
  }, [])
  const initialAssociationsRef = useInitialAssociations(associationsData, extractAssociations, id)

  const [stagedFiles, setStagedFiles] = useState<File[]>([])
  const [existingFileIds, setExistingFileIds] = useState<string[]>([])
  const [stagedLogoFile, setStagedLogoFile] = useState<File | null>(null)
  const [isSoc2ReviewOpen, setIsSoc2ReviewOpen] = useState(false)
  const [wasCreateOpen, setWasCreateOpen] = useState(isCreate)
  const { soc2Report, setSoc2Report, submitReview } = useVendorSoc2ReportReview()
  const { canCreateScan } = useCanCreateScan()

  if (wasCreateOpen !== isCreate) {
    setWasCreateOpen(isCreate)
    if (!isCreate) {
      setStagedFiles([])
      setExistingFileIds([])
      setStagedLogoFile(null)
      setSoc2Report(null)
    }
  }
  const plateEditorHelper = usePlateEditor()

  function getName(data: EntitiesNodeNonNull) {
    return data?.name
  }

  const baseUpdateMutation = useUpdateEntity()
  const baseCreateMutation = useCreateEntityWithFiles()
  const baseBulkDeleteMutation = useBulkDeleteEntity()
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
      const vendorId = result.createEntity.entity.id
      void submitReview({ vendorId, vendorName: vendorDisplayName({ id: vendorId, name: input.name, displayName: input.displayName }), hasSoc2: !!input.hasSoc2 })
      return result
    },
  }

  const deleteMutation = {
    isPending: baseBulkDeleteMutation.isPending,
    mutateAsync: async (params: { ids: string[] }) => {
      const result = await baseBulkDeleteMutation.mutateAsync({ ids: params.ids })

      return result.deleteBulkEntity
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
  const tierOptions = enumToOptions(EntityVendorTier)

  const { tagOptions } = useGetTags()

  const enumOpts = {
    relationshipStateOptions,
    securityQuestionnaireStatusOptions,
    sourceTypeOptions,
    environmentOptions,
    scopeOptions,
    reviewFrequencyOptions,
    entityStatusOptions,
    tierOptions,
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
      const { assetIDs, internalPolicyIDs, subcontrolIDs, scanIDs, campaignIDs, identityHolderIDs, contactIDs, internalOwner, reviewedBy, ...rest } = data
      const description = rest.description ? await plateEditorHelper.convertToHtml(rest.description as Value) : undefined
      const associationPayload = buildAssociationPayload(
        ENTITY_ASSOCIATION_CONFIG.associationKeys,
        { assetIDs, internalPolicyIDs, subcontrolIDs, scanIDs, campaignIDs, identityHolderIDs },
        isCreate,
        initialAssociationsRef.current,
      )

      return {
        ...rest,
        description,
        tier: rest.tier as EntityVendorTier | undefined,
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

  const vendorCreateSteps = useMemo(
    () => createVendorSteps({ onStagedFilesChange: setStagedFiles, onExistingFileIdsChange: setExistingFileIds, onLogoFileChange: setStagedLogoFile, soc2Report, onSoc2ReportChange: setSoc2Report }),
    [soc2Report, setSoc2Report],
  )

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
    searchFields: ['displayNameContainsFold'],
    additionalWhereFilter: scanId ? { hasScansWith: [{ id: scanId }] } : undefined,
    breadcrumbs,
    form,
    getColumns,
    TableComponent,
    sheetConfig,
    viewEditMode: { type: 'full-page', route: '/registry/vendors' },
    createMode: { type: 'step-dialog', steps: vendorCreateSteps, title: 'Create Vendor' },
    onBulkDelete: async (ids: string[]) => {
      return deleteMutation.mutateAsync({ ids })
    },
    onBulkEdit: async (ids: string[], input: UpdateEntityInput) => {
      const result = await bulkEditMutation.mutateAsync({ ids, input })
      return result.updateBulkEntity
    },
    bulkEditFormSchema: bulkEditFieldSchema,
    enumOpts,
    responsibilityFields: {
      internalOwner: { fieldBaseName: 'internalOwner' },
      reviewedBy: { fieldBaseName: 'reviewedBy' },
    },
    createMenuActions: canCreateScan
      ? [
          {
            key: 'create-from-soc2-report',
            label: `Create from ${SOC_2_FRAMEWORK_NAME} report`,
            icon: <FileSearch size={16} strokeWidth={2} />,
            anchor: tableActionAnchor(objectType, 'create-from-soc2-report'),
            onClick: () => setIsSoc2ReviewOpen(true),
          },
        ]
      : undefined,
  }

  return (
    <>
      <GenericTablePage {...tableConfig} />
      {isSoc2ReviewOpen ? <LazyReportScanUploadSheet mode={{ kind: 'vendor' }} onClose={() => setIsSoc2ReviewOpen(false)} /> : null}
    </>
  )
}

export default VendorPage
