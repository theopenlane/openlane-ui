import { type AssetQuery } from '@repo/codegen/src/schema'
import { normalizeEntityData, normalizeResponsibilityField } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { getObjectDisplayName } from '@/utils/object-display-name'

export const ASSETS_HREF = '/registry/assets'

export type AssetDetailNode = NonNullable<AssetQuery['asset']>

type TAssetNameSource = { id: string; name?: string | null; displayName?: string | null }

export const getAssetTitle = (asset: TAssetNameSource) => getObjectDisplayName({ displayName: asset.displayName, name: asset.name }) || asset.id

export const getAssetKindLabel = (asset: { assetSubtypeName?: string | null; assetType?: string | null }) => asset.assetSubtypeName || (asset.assetType ? getEnumLabel(asset.assetType) : '')

type TAssetOwnerSource = Pick<AssetDetailNode, 'internalOwner' | 'internalOwnerUser' | 'internalOwnerGroup' | 'internalOwnerIdentityHolder'>

const ownerInput = (data: TAssetOwnerSource | null | undefined) => ({
  personnel: data?.internalOwnerIdentityHolder,
  user: data?.internalOwnerUser,
  group: data?.internalOwnerGroup,
  stringValue: data?.internalOwner?.trim(),
})

export const getAssetOwner = (asset: TAssetOwnerSource) => normalizeResponsibilityField(ownerInput(asset))

export const normalizeAssetData = <TAsset extends TAssetOwnerSource>(data: TAsset | null | undefined) => normalizeEntityData(data, { internalOwner: ownerInput(data) })
