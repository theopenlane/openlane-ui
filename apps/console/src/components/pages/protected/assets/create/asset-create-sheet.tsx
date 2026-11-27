'use client'

import React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import useFormSchema from '../hooks/use-form-schema'
import { useAssetEnumOptions } from '../hooks/use-asset-enum-options'
import { useCreateAsset } from '@/lib/graphql-hooks/asset'
import { GenericDetailsSheet } from '@/components/shared/crud-base/generic-sheet'
import { getFieldsToRender } from '../table/table-config'
import { type AssetSheetConfig, type AssetFieldProps, objectType } from '../table/types'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { type Value } from 'platejs'
import { type CreateAssetInput } from '@repo/codegen/src/schema'
import { buildResponsibilityPayload } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
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

  const { enumOpts, enumCreateHandlers } = useAssetEnumOptions()

  const sheetConfig: AssetSheetConfig = {
    objectType,
    form,
    data: undefined,
    isFetching: false,
    createMutation,
    isCreateMode: true,
    onClose,
    buildPayload: async (data) => {
      const { controlIDs, subcontrolIDs, internalPolicyIDs, scanIDs, entityIDs, identityHolderIDs, internalOwner, ...rest } = data
      const mergedEntityIDs = [...(entityIDs ?? []), ...(defaultEntityIDs ?? [])].filter((id, i, arr) => arr.indexOf(id) === i)
      const description = rest.description ? await plateEditorHelper.convertToHtml(rest.description as Value) : undefined
      const associationPayload = buildAssociationPayload(
        ASSET_ASSOCIATION_CONFIG.associationKeys,
        { controlIDs, subcontrolIDs, internalPolicyIDs, scanIDs, entityIDs: mergedEntityIDs, identityHolderIDs },
        true,
        {},
      )

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
