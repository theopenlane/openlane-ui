'use client'

import { useMemo } from 'react'
import { useAsset, useUpdateAsset, useDeleteAsset, useAssetsWithFilter } from '@/lib/graphql-hooks/asset'
import { AssetAssetType, AssetSourceType, type AssetQuery, type UpdateAssetInput } from '@repo/codegen/src/schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import type { MergeConfig, MergeFieldOverrides } from '../types'

type Asset = NonNullable<AssetQuery['asset']>

const assetTypeOptions = Object.values(AssetAssetType).map((v) => ({ value: v, label: getEnumLabel(v) }))
const assetSourceTypeOptions = Object.values(AssetSourceType).map((v) => ({ value: v, label: getEnumLabel(v) }))

const fieldOverrides: MergeFieldOverrides<Asset> = {
  description: { label: 'Description', type: 'longText' },
  assetType: { label: 'Asset type', type: 'enum', enumOptions: assetTypeOptions },
  sourceType: { label: 'Source type', type: 'enum', enumOptions: assetSourceTypeOptions },
  accessModelName: { label: 'Access model', type: 'customEnum', customEnum: { objectType: 'asset', field: 'accessModel' } },
  assetDataClassificationName: { label: 'Data classification', type: 'customEnum', customEnum: { objectType: 'asset', field: 'dataClassification' } },
  assetSubtypeName: { label: 'Subtype', type: 'customEnum', customEnum: { objectType: 'asset', field: 'subtype' } },
  criticalityName: { label: 'Criticality', type: 'customEnum', customEnum: { objectType: 'asset', field: 'criticality' } },
  encryptionStatusName: { label: 'Encryption status', type: 'customEnum', customEnum: { objectType: 'asset', field: 'encryptionStatus' } },
  securityTierName: { label: 'Security tier', type: 'customEnum', customEnum: { objectType: 'asset', field: 'securityTier' } },
  cpe: { label: 'CPE', type: 'text' },
  containsPii: { label: 'Contains PII', type: 'boolean' },
}

const excludeFields = ['internalOwner', 'internalOwnerGroup', 'internalOwnerUser'] as const satisfies ReadonlyArray<Extract<keyof Asset, string>>

const useFetchAsset = (id: string | null) => {
  const { data, isLoading, error } = useAsset(id ?? undefined)
  return { data: (data?.asset ?? null) as Asset | null, isLoading, error }
}

const useUpdateAssetMutation = () => {
  const base = useUpdateAsset()
  return {
    isPending: base.isPending,
    mutateAsync: async ({ id, input }: { id: string; input: UpdateAssetInput }) => base.mutateAsync({ updateAssetId: id, input }),
  }
}

const useDeleteAssetMutation = () => {
  const base = useDeleteAsset()
  return {
    isPending: base.isPending,
    mutateAsync: async (id: string) => base.mutateAsync({ deleteAssetId: id }),
  }
}

const useSearchAssets = (search: string, excludeId: string) => {
  const where = useMemo(() => {
    const base: Record<string, unknown> = { idNEQ: excludeId }
    const term = search.trim()
    if (term) {
      base.or = [{ nameContainsFold: term }, { displayNameContainsFold: term }, { identifierContainsFold: term }]
    }
    return base
  }, [search, excludeId])

  const { assetsNodes, isLoading } = useAssetsWithFilter({
    where: where as Parameters<typeof useAssetsWithFilter>[0]['where'],
    pagination: { query: { first: 10 }, page: 1, pageSize: 10 },
  })

  const options = useMemo(
    () =>
      assetsNodes.map((n) => ({
        id: n.id,
        label: n.displayName || n.name || n.id,
        sublabel: n.identifier ?? undefined,
      })),
    [assetsNodes],
  )

  return { options, isLoading }
}

export const assetMergeConfig: MergeConfig<Asset, UpdateAssetInput> = {
  entityType: 'Asset',
  labelSingular: 'asset',
  labelPlural: 'assets',
  fieldOverrides,
  excludeFields,
  useFetchRecord: useFetchAsset,
  useUpdate: useUpdateAssetMutation,
  useDelete: useDeleteAssetMutation,
  useSearchRecords: useSearchAssets,
  toUpdateInput: (resolved) => ({ ...resolved }) as UpdateAssetInput,
  invalidateKeys: [['assets']],
  getDisplayName: (record) => record.displayName || record.name || record.id,
}
