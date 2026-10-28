import { useMemo } from 'react'
import { type AssetWhereInput } from '@repo/codegen/src/schema'
import { useAssetsWithFilter } from '@/lib/graphql-hooks/asset'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { useAsyncCommandSearch } from '@/hooks/useAsyncCommandSearch'
import { useSession } from 'next-auth/react'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { hasPermission } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { type TSelectedReport } from './exposure-bulk-actions'

const ASSET_SEARCH_LIMIT = 10
const ASSET_SEARCH_PAGINATION = { page: 1, pageSize: ASSET_SEARCH_LIMIT, query: { first: ASSET_SEARCH_LIMIT } }

const sharedSourceOwner = (reports: TSelectedReport[]): string | null => {
  const owners = new Set(reports.map((report) => report.externalOwnerID?.trim() ?? ''))
  if (owners.size !== 1) return null
  const [owner] = [...owners]
  return owner || null
}

export const useExposureAssetEnvironment = (reports: TSelectedReport[]) => {
  const search = useAsyncCommandSearch()
  const owner = sharedSourceOwner(reports)

  const searchWhere = useMemo<AssetWhereInput>(
    () => (search.debouncedTerm ? { or: [{ nameContainsFold: search.debouncedTerm }, { displayNameContainsFold: search.debouncedTerm }] } : {}),
    [search.debouncedTerm],
  )
  const ownerWhere = useMemo<AssetWhereInput>(() => ({ or: [{ nameEqualFold: owner ?? '' }, { sourceIdentifierEqualFold: owner ?? '' }] }), [owner])

  const assets = useAssetsWithFilter({ where: searchWhere, pagination: ASSET_SEARCH_PAGINATION, enabled: search.canQuery })
  const ownerMatches = useAssetsWithFilter({ where: ownerWhere, pagination: ASSET_SEARCH_PAGINATION, enabled: !!owner })
  const { enumOptions: environmentOptions } = useCreatableEnumOptions({ field: 'environment' })
  const { data: session } = useSession()
  const { data: orgPermission } = useOrganizationRoles()
  const canCreateAsset = hasPermission(orgPermission?.roles, AccessEnum.CanCreateAsset, session)

  const suggestedAssets = owner ? ownerMatches.assetsNodes : []
  const suggestedIds = new Set(suggestedAssets.map((asset) => asset.id))

  return {
    search,
    isSearching: search.getIsSearching(assets.isFetching),
    owner,
    canCreateOwnerAsset: canCreateAsset && !!owner && !ownerMatches.isPending && suggestedAssets.length === 0,
    suggestedAssets,
    assets: assets.assetsNodes.filter((asset) => !suggestedIds.has(asset.id)),
    environmentOptions,
  }
}
