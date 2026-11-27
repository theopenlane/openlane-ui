'use client'

import React from 'react'
import useFormSchema from '@/components/pages/protected/assets/hooks/use-form-schema'
import { type AssetsNodeNonNull, useAsset, useUpdateAsset, useBulkDeleteAsset } from '@/lib/graphql-hooks/asset'
import { GenericDetailsSheet, type RenderHeaderProps } from '@/components/shared/crud-base/generic-sheet'
import { SlideoutPreviewHeader } from '@/components/shared/crud-base/slideout-preview-header'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { getFieldsToRender } from '@/components/pages/protected/assets/table/table-config'
import { type AssetSheetConfig, type AssetFieldProps, objectType } from '@/components/pages/protected/assets/table/types.tsx'
import { type UpdateAssetInput } from '@repo/codegen/src/schema'
import { useAssetEnumOptions } from '@/components/pages/protected/assets/hooks/use-asset-enum-options'
import { normalizeAssetData } from '@/components/pages/protected/assets/asset-display'
import { ASSET_UPDATE_FIELDS } from '@/components/pages/protected/assets/hooks/asset-update-fields'

type Props = {
  entityId: string | null
  onClose: () => void
}

const ViewAssetSheet: React.FC<Props> = ({ entityId, onClose }) => {
  const { form } = useFormSchema()
  const { data, isLoading } = useAsset(entityId || undefined)

  const baseUpdateMutation = useUpdateAsset()
  const baseBulkDeleteMutation = useBulkDeleteAsset()

  const updateMutation = {
    isPending: baseUpdateMutation.isPending,
    mutateAsync: async (params: { id: string; input: UpdateAssetInput }) => baseUpdateMutation.mutateAsync({ updateAssetId: params.id, input: params.input }),
  }

  const deleteMutation = {
    isPending: baseBulkDeleteMutation.isPending,
    mutateAsync: async (params: { ids: string[] }) => {
      const result = await baseBulkDeleteMutation.mutateAsync({ ids: params.ids })
      return result.deleteBulkAsset
    },
  }

  const { enumOpts, enumCreateHandlers } = useAssetEnumOptions()

  const getName = (d: AssetsNodeNonNull) => {
    return d?.name
  }

  const sheetConfig: AssetSheetConfig = {
    objectType,
    form,
    entityId,
    isCreateMode: false,
    data: entityId ? data?.asset : undefined,
    isFetching: isLoading,
    deleteMutation,
    update: { mutation: updateMutation, fields: ASSET_UPDATE_FIELDS },
    normalizeData: normalizeAssetData,
    getName,
    renderHeader: ({ close }: RenderHeaderProps) => <SlideoutPreviewHeader title="Asset" close={close} fullPagePath={entityId ? getHrefForObjectType('assets', { id: entityId }) : null} />,
    renderFields: (props: AssetFieldProps) => getFieldsToRender(props, enumOpts, enumCreateHandlers),
  }

  return <GenericDetailsSheet onClose={onClose} {...sheetConfig} />
}

export default ViewAssetSheet
