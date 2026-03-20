'use client'

import React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import useFormSchema from '../hooks/use-form-schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { useCreateAsset } from '@/lib/graphql-hooks/asset'
import { GenericDetailsSheet } from '@/components/shared/crud-base/generic-sheet'
import { getFieldsToRender } from '../table/table-config'
import { type AssetSheetConfig, type AssetFieldProps, objectType } from '../table/types'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { type Value } from 'platejs'
import { AssetAssetType, AssetSourceType, type CreateAssetInput } from '@repo/codegen/src/schema'
import { buildResponsibilityPayload } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { useGetTags } from '@/lib/graphql-hooks/tag-definition'
import { buildAssociationPayload } from '@/components/shared/object-association/utils'
import { ASSET_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'

interface AssetCreateSheetProps {
  onClose: () => void
  defaultEntityIDs?: string[]
}

const AssetCreateSheet: React.FC<AssetCreateSheetProps> = ({ onClose, defaultEntityIDs }) => {
  const { form } = useFormSchema()
  const plateEditorHelper = usePlateEditor()
  const baseCreateMutation = useCreateAsset()
  const queryClient = useQueryClient()

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (input: CreateAssetInput) => {
      const result = await baseCreateMutation.mutateAsync({ input })
      if (defaultEntityIDs?.length) {
        queryClient.invalidateQueries({ queryKey: ['entities'] })
      }
      return result
    },
  }

  const { enumOptions: accessModelOptions, onCreateOption: createAccessModel } = useCreatableEnumOptions({ objectType: 'asset', field: 'accessModel' })
  const { enumOptions: assetDataClassificationOptions, onCreateOption: createDataClassification } = useCreatableEnumOptions({ objectType: 'asset', field: 'dataClassification' })
  const { enumOptions: assetSubtypeOptions, onCreateOption: createSubtype } = useCreatableEnumOptions({ objectType: 'asset', field: 'subtype' })
  const { enumOptions: criticalityOptions, onCreateOption: createCriticality } = useCreatableEnumOptions({ objectType: 'asset', field: 'criticality' })
  const { enumOptions: encryptionStatusOptions, onCreateOption: createEncryptionStatus } = useCreatableEnumOptions({ objectType: 'asset', field: 'encryptionStatus' })
  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({ field: 'environment' })
  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({ field: 'scope' })
  const { enumOptions: securityTierOptions, onCreateOption: createSecurityTier } = useCreatableEnumOptions({ objectType: 'asset', field: 'securityTier' })
  const tagOptions = useGetTags()

  const assetSourceTypeOptions = Object.values(AssetSourceType).map((value) => ({ value, label: getEnumLabel(value as string) }))
  const assetTypeOptions = Object.values(AssetAssetType).map((value) => ({ value, label: getEnumLabel(value as string) }))

  const enumOpts = {
    assetTypeOptions,
    accessModelOptions,
    assetDataClassificationOptions,
    assetSubtypeOptions,
    assetSourceTypeOptions,
    criticalityOptions,
    encryptionStatusOptions,
    environmentOptions,
    scopeOptions,
    securityTierOptions,
    tagOptions: tagOptions.tagOptions,
  }

  const enumCreateHandlers = {
    accessModelName: createAccessModel,
    assetDataClassificationName: createDataClassification,
    assetSubtypeName: createSubtype,
    criticalityName: createCriticality,
    encryptionStatusName: createEncryptionStatus,
    environmentName: createEnvironment,
    scopeName: createScope,
    securityTierName: createSecurityTier,
  }

  const sheetConfig: AssetSheetConfig = {
    objectType,
    form,
    data: undefined,
    isFetching: false,
    createMutation,
    isCreateMode: true,
    onClose,
    buildPayload: async (data) => {
      const { controlIDs, scanIDs, entityIDs, identityHolderIDs, internalOwner, ...rest } = data
      const mergedEntityIDs = [...(entityIDs ?? []), ...(defaultEntityIDs ?? [])].filter((id, i, arr) => arr.indexOf(id) === i)
      const description = rest.description ? await plateEditorHelper.convertToHtml(rest.description as Value) : undefined
      const associationPayload = buildAssociationPayload(ASSET_ASSOCIATION_CONFIG.associationKeys, { controlIDs, scanIDs, entityIDs: mergedEntityIDs, identityHolderIDs }, true, {})

      return {
        ...rest,
        description,
        ...associationPayload,
        ...buildResponsibilityPayload('internalOwner', internalOwner, { mode: 'create' }),
      }
    },
    renderFields: (props: AssetFieldProps) => getFieldsToRender(props, enumOpts, enumCreateHandlers),
  }

  return <GenericDetailsSheet {...sheetConfig} />
}

export default AssetCreateSheet
