import { useMemo } from 'react'
import { subYears } from 'date-fns'
import { type InfiniteData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import {
  AssetOrderField,
  EvidenceEvidenceStatus,
  OrderDirection,
  ReviewOrderField,
  RiskRiskStatus,
  type AssetWhereInput,
  type EvidenceWhereInput,
  type FindingWhereInput,
  type GetAssetFindingsQuery,
  type GetAssetFindingsQueryVariables,
  type GetAssetReadinessEvidenceQuery,
  type GetAssetReadinessEvidenceQueryVariables,
  type GetAssetReadinessReviewsQuery,
  type GetAssetReadinessReviewsQueryVariables,
  type GetAssetRelationshipsQuery,
  type GetAssetRelationshipsQueryVariables,
  type GetAssetRisksQuery,
  type GetAssetRisksQueryVariables,
  type GetAssetTopologyPlatformsQuery,
  type GetAssetTopologyPlatformsQueryVariables,
  type GetAssetTopologySystemsQuery,
  type GetAssetTopologySystemsQueryVariables,
  type GetAssetVendorsQuery,
  type GetAssetVendorsQueryVariables,
  type GetAssetVulnerabilitiesQuery,
  type GetAssetVulnerabilitiesQueryVariables,
  type GetVendorAssetsQuery,
  type GetVendorAssetsQueryVariables,
  type RiskWhereInput,
  type VulnerabilityWhereInput,
} from '@repo/codegen/src/schema'
import { AssetHistoryOrderField, OrderDirection as HistoryOrderDirection, type GetAssetHistoriesQuery, type GetAssetHistoriesQueryVariables } from '@repo/codegen/src/historyschema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import {
  GET_ASSET_FINDINGS,
  GET_ASSET_READINESS_EVIDENCE,
  GET_ASSET_READINESS_REVIEWS,
  GET_ASSET_RELATIONSHIPS,
  GET_ASSET_RISKS,
  GET_ASSET_TOPOLOGY_PLATFORMS,
  GET_ASSET_TOPOLOGY_SYSTEMS,
  GET_ASSET_VENDORS,
  GET_ASSET_VULNERABILITIES,
  GET_VENDOR_ASSETS,
} from '@repo/codegen/query/asset'
import { GET_ASSET_HISTORIES } from '@repo/codegen/query-history/asset'
import { MAX_CONNECTION_RESULTS } from '@/constants/pagination'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { useHistoryGraphQLClient } from '@/hooks/useHistoryGraphQLClient'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { fetchAllConnectionNodes } from '@/lib/graphql-hooks/fetch-all-connection-nodes'
import { useModuleGatedQuery } from '@/lib/graphql-hooks/use-module-gated-query'
import { useObjectTypeAccess } from '@/lib/subscription-plan/hooks/use-module-access'
import { type TPagination } from '@repo/ui/pagination-types'

const TOPOLOGY_PLATFORM_LIMIT = 10
const TOPOLOGY_SYSTEM_LIMIT = 10
const TOPOLOGY_ASSET_LIMIT = 6
const READINESS_REVIEW_LIMIT = 20
const READINESS_CONTROL_PREVIEW = 3
const HISTORY_PAGE_SIZE = 50
export const ASSET_EXPOSURE_LIMIT = 1000

export const CLOSED_RISK_STATUSES = [RiskRiskStatus.CLOSED, RiskRiskStatus.ARCHIVED, RiskRiskStatus.MITIGATED, RiskRiskStatus.TRANSFERRED, RiskRiskStatus.ACCEPTED]
const CURRENT_EVIDENCE_STATUSES = [EvidenceEvidenceStatus.AUDITOR_APPROVED, EvidenceEvidenceStatus.READY_FOR_AUDITOR]

export type AssetRelationships = NonNullable<GetAssetRelationshipsQuery['asset']>
export type AssetSystemNode = NonNullable<NonNullable<NonNullable<NonNullable<AssetRelationships['systemDetails']>['edges']>[number]>['node']>
export type AssetTopologyPlatform = NonNullable<NonNullable<NonNullable<GetAssetTopologyPlatformsQuery['platforms']['edges']>[number]>['node']>
export type AssetTopologySystem = NonNullable<NonNullable<NonNullable<GetAssetTopologySystemsQuery['systemDetails']['edges']>[number]>['node']>
export type AssetVulnerabilityNode = NonNullable<NonNullable<NonNullable<GetAssetVulnerabilitiesQuery['vulnerabilities']['edges']>[number]>['node']>
export type AssetFindingNode = NonNullable<NonNullable<NonNullable<GetAssetFindingsQuery['findings']['edges']>[number]>['node']>
export type AssetRiskNode = NonNullable<NonNullable<NonNullable<GetAssetRisksQuery['risks']['edges']>[number]>['node']>
export type AssetVendorNode = NonNullable<NonNullable<NonNullable<NonNullable<GetAssetVendorsQuery['asset']>['entities']['edges']>[number]>['node']>
export type VendorAssetNode = NonNullable<NonNullable<NonNullable<GetVendorAssetsQuery['assets']['edges']>[number]>['node']>

export const useAssetRelationships = (assetId: string) => {
  const { client } = useGraphQLClient()
  const { hasAccess: withSystems, isLoading: isSystemAccessLoading } = useObjectTypeAccess(ObjectTypes.SYSTEM_DETAIL)
  const { hasAccess: withPlatforms, isLoading: isPlatformAccessLoading } = useObjectTypeAccess(ObjectTypes.PLATFORM)

  return useQuery<GetAssetRelationshipsQuery, unknown>({
    queryKey: ['assets', assetId, 'relationships', { withSystems, withPlatforms }],
    queryFn: async () =>
      client.request<GetAssetRelationshipsQuery, GetAssetRelationshipsQueryVariables>(GET_ASSET_RELATIONSHIPS, { assetId, first: MAX_CONNECTION_RESULTS, withSystems, withPlatforms }),
    enabled: !isSystemAccessLoading && !isPlatformAccessLoading,
    placeholderData: undefined,
  })
}

export const useAssetTopology = (assetId: string) => {
  const { client } = useGraphQLClient()
  const { hasAccess: withSystems, isLoading: isSystemAccessLoading } = useObjectTypeAccess(ObjectTypes.SYSTEM_DETAIL)
  const { hasAccess: withPlatforms, isLoading: isPlatformAccessLoading } = useObjectTypeAccess(ObjectTypes.PLATFORM)

  const queryResult = useQuery({
    queryKey: ['assets', assetId, 'topology', { withSystems, withPlatforms }],
    queryFn: async () => {
      const linkedToAsset = [{ id: assetId }]
      const [platforms, systems] = await Promise.all([
        withPlatforms
          ? client.request<GetAssetTopologyPlatformsQuery, GetAssetTopologyPlatformsQueryVariables>(GET_ASSET_TOPOLOGY_PLATFORMS, {
              assetId,
              where: { or: [{ hasAssetsWith: linkedToAsset }, ...(withSystems ? [{ hasSystemDetailsWith: [{ hasAssetsWith: linkedToAsset }] }] : [])] },
              first: TOPOLOGY_PLATFORM_LIMIT,
              systemsFirst: TOPOLOGY_SYSTEM_LIMIT,
              assetsFirst: TOPOLOGY_ASSET_LIMIT,
              withSystems,
            })
          : null,
        withSystems
          ? client.request<GetAssetTopologySystemsQuery, GetAssetTopologySystemsQueryVariables>(GET_ASSET_TOPOLOGY_SYSTEMS, {
              where: { hasAssetsWith: linkedToAsset },
              first: TOPOLOGY_SYSTEM_LIMIT,
              assetsFirst: TOPOLOGY_ASSET_LIMIT,
            })
          : null,
      ])
      return { platforms: platforms?.platforms, systems: systems?.systemDetails }
    },
    enabled: !isSystemAccessLoading && !isPlatformAccessLoading,
    placeholderData: undefined,
  })

  return {
    ...queryResult,
    platforms: useMemo(() => getNodes(queryResult.data?.platforms), [queryResult.data]),
    systems: useMemo(() => getNodes(queryResult.data?.systems), [queryResult.data]),
    hiddenSystems: Math.max(0, (queryResult.data?.systems?.totalCount ?? 0) - (queryResult.data?.systems?.edges?.length ?? 0)),
    hiddenPlatforms: Math.max(0, (queryResult.data?.platforms?.totalCount ?? 0) - (queryResult.data?.platforms?.edges?.length ?? 0)),
  }
}

export type TAssetExposureFilters = { search: string; openOnly: boolean }

const NO_EXPOSURE_FILTERS: TAssetExposureFilters = { search: '', openOnly: false }

const vulnerabilityExposureWhere = (assetId: string, { search, openOnly }: TAssetExposureFilters): VulnerabilityWhereInput => ({
  hasAssetsWith: [{ id: assetId }],
  ...(openOnly ? { open: true } : {}),
  ...(search
    ? { or: [{ cveIDContainsFold: search }, { displayNameContainsFold: search }, { externalIDContainsFold: search }, { displayIDContainsFold: search }, { summaryContainsFold: search }] }
    : {}),
})

const findingExposureWhere = (assetId: string, { search, openOnly }: TAssetExposureFilters): FindingWhereInput => ({
  hasAssetsWith: [{ id: assetId }],
  ...(openOnly ? { open: true } : {}),
  ...(search ? { or: [{ displayNameContainsFold: search }, { externalIDContainsFold: search }, { displayIDContainsFold: search }, { categoryContainsFold: search }] } : {}),
})

const riskExposureWhere = (assetId: string, { search, openOnly }: TAssetExposureFilters): RiskWhereInput => ({
  hasAssetsWith: [{ id: assetId }],
  and: [...(openOnly ? [{ or: [{ statusNotIn: CLOSED_RISK_STATUSES }, { statusIsNil: true }] }] : []), ...(search ? [{ or: [{ nameContainsFold: search }, { displayIDContainsFold: search }] }] : [])],
})

type TExposureConnection<TNode> = { totalCount: number; edges?: Array<{ node?: TNode | null } | null> | null; pageInfo: { endCursor?: unknown; hasNextPage: boolean } }

const fetchExposure = async <TNode>(fetchPage: (first: number, after: string | null) => Promise<TExposureConnection<TNode>>) => {
  let totalCount = 0
  const nodes = await fetchAllConnectionNodes<TNode>(async (after, remaining) => {
    const connection = await fetchPage(Math.min(remaining, MAX_CONNECTION_RESULTS), after)
    totalCount = connection.totalCount
    return connection
  }, ASSET_EXPOSURE_LIMIT)
  return { nodes, totalCount }
}

export const useAssetExposureSources = (assetId: string, filters: TAssetExposureFilters = NO_EXPOSURE_FILTERS) => {
  const { client } = useGraphQLClient()
  const vulnerabilityAccess = useObjectTypeAccess(ObjectTypes.VULNERABILITY)
  const findingAccess = useObjectTypeAccess(ObjectTypes.FINDING)
  const riskAccess = useObjectTypeAccess(ObjectTypes.RISK)

  const vulnerabilities = useQuery({
    queryKey: ['vulnerabilities', 'asset-exposure', assetId, filters],
    queryFn: () =>
      fetchExposure<AssetVulnerabilityNode>(
        async (first, after) =>
          (
            await client.request<GetAssetVulnerabilitiesQuery, GetAssetVulnerabilitiesQueryVariables>(GET_ASSET_VULNERABILITIES, {
              where: vulnerabilityExposureWhere(assetId, filters),
              first,
              after,
            })
          ).vulnerabilities,
      ),
    enabled: vulnerabilityAccess.hasAccess,
  })
  const findings = useQuery({
    queryKey: ['findings', 'asset-exposure', assetId, filters],
    queryFn: () =>
      fetchExposure<AssetFindingNode>(
        async (first, after) =>
          (await client.request<GetAssetFindingsQuery, GetAssetFindingsQueryVariables>(GET_ASSET_FINDINGS, { where: findingExposureWhere(assetId, filters), first, after })).findings,
      ),
    enabled: findingAccess.hasAccess,
  })
  const risks = useQuery({
    queryKey: ['risks', 'asset-exposure', assetId, filters],
    queryFn: () =>
      fetchExposure<AssetRiskNode>(
        async (first, after) => (await client.request<GetAssetRisksQuery, GetAssetRisksQueryVariables>(GET_ASSET_RISKS, { where: riskExposureWhere(assetId, filters), first, after })).risks,
      ),
    enabled: riskAccess.hasAccess,
  })

  const sources = [
    { query: vulnerabilities, access: vulnerabilityAccess },
    { query: findings, access: findingAccess },
    { query: risks, access: riskAccess },
  ]

  return {
    vulnerabilities: vulnerabilityAccess.hasAccess ? vulnerabilities.data : undefined,
    findings: findingAccess.hasAccess ? findings.data : undefined,
    risks: riskAccess.hasAccess ? risks.data : undefined,
    hasAnyAccess: sources.some(({ access }) => access.hasAccess),
    isPending: sources.some(({ query, access }) => access.isLoading || (access.hasAccess && query.isPending)),
    isPlaceholderData: sources.some(({ query }) => query.isPlaceholderData),
    isFetching: sources.some(({ query }) => query.isFetching),
    error: sources.find(({ query }) => query.error)?.query.error ?? null,
  }
}

export const useAssetVendors = (assetId: string) => {
  const { client } = useGraphQLClient()
  const { hasAccess } = useObjectTypeAccess(ObjectTypes.ENTITY)
  const queryResult = useQuery<GetAssetVendorsQuery, unknown>({
    queryKey: ['entities', 'asset', assetId],
    queryFn: async () => client.request<GetAssetVendorsQuery, GetAssetVendorsQueryVariables>(GET_ASSET_VENDORS, { assetId, first: MAX_CONNECTION_RESULTS }),
    enabled: hasAccess,
    placeholderData: undefined,
  })

  return {
    ...queryResult,
    hasAccess,
    vendors: useMemo(() => getNodes(queryResult.data?.asset?.entities), [queryResult.data]),
    totalCount: queryResult.data?.asset?.entities.totalCount ?? 0,
  }
}

type TUseVendorAssetsArgs = { where: AssetWhereInput; pagination: TPagination }

const VENDOR_ASSETS_ORDER = [{ field: AssetOrderField.name, direction: OrderDirection.ASC }]

export const useVendorAssets = ({ where, pagination }: TUseVendorAssetsArgs) => {
  const { client } = useGraphQLClient()
  const { hasAccess: withVulnerabilities, isLoading: isVulnerabilityAccessLoading } = useObjectTypeAccess(ObjectTypes.VULNERABILITY)
  const { hasAccess: withFindings, isLoading: isFindingAccessLoading } = useObjectTypeAccess(ObjectTypes.FINDING)
  const queryResult = useQuery<GetVendorAssetsQuery, unknown>({
    queryKey: ['assets', 'vendor-assets', where, pagination.page, pagination.pageSize, { withVulnerabilities, withFindings }],
    queryFn: async () =>
      client.request<GetVendorAssetsQuery, GetVendorAssetsQueryVariables>(GET_VENDOR_ASSETS, { where, orderBy: VENDOR_ASSETS_ORDER, ...pagination.query, withVulnerabilities, withFindings }),
    enabled: !isVulnerabilityAccessLoading && !isFindingAccessLoading,
  })

  return { ...queryResult, assets: useMemo(() => getNodes(queryResult.data?.assets), [queryResult.data]), hasExposureAccess: withVulnerabilities || withFindings }
}

const READINESS_REVIEW_ORDER = [{ field: ReviewOrderField.created_at, direction: OrderDirection.DESC }]
export const READINESS_REVIEW_YEARS = 1

export const useAssetReadinessReviews = (assetId: string) => {
  const { client } = useGraphQLClient()

  return useModuleGatedQuery({
    objectType: ObjectTypes.REVIEW,
    queryKey: ['reviews', 'asset-readiness', assetId],
    queryFn: async () => {
      const reviewedAtGTE = subYears(new Date(), READINESS_REVIEW_YEARS).toISOString()
      return client.request<GetAssetReadinessReviewsQuery, GetAssetReadinessReviewsQueryVariables>(GET_ASSET_READINESS_REVIEWS, {
        where: { reviewedAtGTE, hasAssetsWith: [{ id: assetId }] },
        orderBy: READINESS_REVIEW_ORDER,
        first: READINESS_REVIEW_LIMIT,
      })
    },
  })
}

const readinessEvidenceWheres = (assetId: string) => {
  const now = new Date().toISOString()
  const linked = { hasAssetsWith: [{ id: assetId }] }
  const freshEvidence: EvidenceWhereInput = { statusIn: CURRENT_EVIDENCE_STATUSES, or: [{ renewalDateIsNil: true }, { renewalDateGTE: now }] }
  const approvedEvidence: EvidenceWhereInput = { statusIn: [...CURRENT_EVIDENCE_STATUSES, EvidenceEvidenceStatus.NEEDS_RENEWAL] }

  return {
    linked,
    missing: { ...linked, not: { hasEvidenceWith: [approvedEvidence] } },
    stale: { ...linked, hasEvidenceWith: [approvedEvidence], not: { hasEvidenceWith: [freshEvidence] } },
  }
}

export const useAssetReadinessEvidence = (assetId: string) => {
  const { client } = useGraphQLClient()
  const { hasAccess: hasControlAccess } = useObjectTypeAccess(ObjectTypes.CONTROL)
  const { hasAccess: hasSubcontrolAccess } = useObjectTypeAccess(ObjectTypes.SUBCONTROL)

  return useModuleGatedQuery({
    objectType: ObjectTypes.EVIDENCE,
    queryKey: ['evidences', 'asset-readiness', assetId],
    queryFn: async () => {
      const { linked, missing, stale } = readinessEvidenceWheres(assetId)
      return client.request<GetAssetReadinessEvidenceQuery, GetAssetReadinessEvidenceQueryVariables>(GET_ASSET_READINESS_EVIDENCE, {
        linkedWhere: linked,
        missingWhere: missing,
        staleWhere: stale,
        linkedSubcontrolWhere: linked,
        missingSubcontrolWhere: missing,
        staleSubcontrolWhere: stale,
        first: READINESS_CONTROL_PREVIEW,
      })
    },
    enabled: hasControlAccess && hasSubcontrolAccess,
    staleTime: 0,
  })
}

const HISTORY_ORDER = { field: AssetHistoryOrderField.history_time, direction: HistoryOrderDirection.DESC }

export const useAssetHistories = (assetId: string) => {
  const { client } = useHistoryGraphQLClient()
  const queryResult = useInfiniteQuery<GetAssetHistoriesQuery, unknown, InfiniteData<GetAssetHistoriesQuery>, unknown[], string | null>({
    initialPageParam: null,
    queryKey: ['assetHistories', assetId],
    queryFn: async ({ pageParam }) =>
      client.request<GetAssetHistoriesQuery, GetAssetHistoriesQueryVariables>(GET_ASSET_HISTORIES, { where: { ref: assetId }, orderBy: HISTORY_ORDER, first: HISTORY_PAGE_SIZE, after: pageParam }),
    getNextPageParam: (lastPage) => (lastPage.assetHistories.pageInfo.hasNextPage ? (lastPage.assetHistories.pageInfo.endCursor ?? null) : undefined),
    placeholderData: undefined,
  })

  return { ...queryResult, histories: useMemo(() => queryResult.data?.pages.flatMap((page) => getNodes({ edges: page.assetHistories.edges })) ?? [], [queryResult.data]) }
}
