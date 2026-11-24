'use client'

import React, { useMemo } from 'react'
import useFormSchema, { bulkEditFieldSchema } from '../hooks/use-form-schema'
import { useCreateAsset, useBulkDeleteAsset, useBulkEditAsset } from '@/lib/graphql-hooks/asset'
import { useVendorsWithFilter } from '@/lib/graphql-hooks/entity'
import { useSearchParams } from 'next/navigation'
import { GenericTablePage } from '@/components/shared/crud-base/page'
import { breadcrumbs, getFieldsToRender, getFilterFields, visibilityFields } from './table-config'
import { type AssetSheetConfig, type AssetTablePageConfig, type AssetFieldProps, objectType, objectName, tableKey, exportType, orderFieldEnum, defaultSorting } from './types'
import { getColumns } from './columns'
import TableComponent from './table'
import { ASSETS_HREF } from '../asset-display'
import { useAssetEnumOptions } from '../hooks/use-asset-enum-options'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { plateToHtmlOrNull } from '@/components/shared/plate/plate-utils'
import { type CreateAssetInput, type UpdateAssetInput } from '@repo/codegen/src/schema'
import { buildResponsibilityPayload } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { buildAssociationPayload } from '@/components/shared/object-association/utils'
import { ASSET_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'

const AssetPage: React.FC = () => {
  const { form } = useFormSchema()

  const searchParams = useSearchParams()
  const scanId = searchParams.get('scanId')

  const plateEditorHelper = usePlateEditor()

  const baseCreateMutation = useCreateAsset()
  const baseBulkDeleteMutation = useBulkDeleteAsset()
  const baseBulkEditMutation = useBulkEditAsset()

  const createMutation = {
    isPending: baseCreateMutation.isPending,
    mutateAsync: async (input: CreateAssetInput) => {
      const result = await baseCreateMutation.mutateAsync({ input })
      return result
    },
  }

  const deleteMutation = {
    isPending: baseBulkDeleteMutation.isPending,
    mutateAsync: async (params: { ids: string[] }) => {
      const result = await baseBulkDeleteMutation.mutateAsync({ ids: params.ids })

      return result.deleteBulkAsset
    },
  }

  const bulkEditMutation = baseBulkEditMutation

  const { enumOpts: assetEnumOpts, enumCreateHandlers } = useAssetEnumOptions()

  const { vendorNodes } = useVendorsWithFilter({})
  const vendorIDsOptions = useMemo(() => vendorNodes.map((v) => ({ value: v.id, label: v.displayName ?? v.name ?? v.id })), [vendorNodes])

  const enumOpts = { ...assetEnumOpts, vendorIDsOptions }

  const sheetConfig: AssetSheetConfig = {
    objectType: objectType,
    form,
    data: undefined,
    isFetching: false,
    createMutation,
    deleteMutation,
    buildPayload: async (data) => {
      const { controlIDs, subcontrolIDs, internalPolicyIDs, scanIDs, entityIDs, identityHolderIDs, internalOwner, ...rest } = data
      const description = (await plateToHtmlOrNull(rest.description, plateEditorHelper)) ?? undefined
      const associationPayload = buildAssociationPayload(ASSET_ASSOCIATION_CONFIG.associationKeys, { controlIDs, subcontrolIDs, internalPolicyIDs, scanIDs, entityIDs, identityHolderIDs }, true, {})

      return {
        ...rest,
        description,
        ...associationPayload,
        ...buildResponsibilityPayload('internalOwner', internalOwner, { mode: 'create' }),
      }
    },
    renderFields: (props: AssetFieldProps) => getFieldsToRender(props, enumOpts, enumCreateHandlers),
  }

  const tableConfig: AssetTablePageConfig = {
    objectType,
    objectName,
    tableKey,
    exportType,
    orderFieldEnum,
    defaultSorting,
    defaultVisibility: visibilityFields,
    filterFields: getFilterFields(enumOpts),
    searchFields: ['nameContainsFold', 'descriptionContainsFold'],
    additionalWhereFilter: scanId ? { hasScansWith: [{ id: scanId }] } : undefined,
    breadcrumbs,
    form,
    getColumns,
    TableComponent,
    sheetConfig,
    viewEditMode: { type: 'full-page', route: ASSETS_HREF },
    onBulkDelete: async (ids: string[]) => {
      return deleteMutation.mutateAsync({ ids })
    },
    onBulkEdit: async (ids: string[], input: UpdateAssetInput & { vendorIDs?: string[] }) => {
      const { vendorIDs, ...rest } = input
      const payload: UpdateAssetInput = {
        ...rest,
        ...(vendorIDs && vendorIDs.length > 0 ? { addEntityIDs: vendorIDs } : {}),
      }
      const result = await bulkEditMutation.mutateAsync({ ids, input: payload })
      return result.updateBulkAsset
    },
    bulkEditFormSchema: bulkEditFieldSchema,
    bulkEditFieldLabels: { vendorIDs: 'Vendors' },
    enumOpts,
    responsibilityFields: {
      internalOwner: { fieldBaseName: 'internalOwner' },
    },
  }

  return <GenericTablePage {...tableConfig} />
}

export default AssetPage
