import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type PlatformsWithFilterQuery,
  type PlatformsWithFilterQueryVariables,
  type CreatePlatformMutation,
  type CreatePlatformMutationVariables,
  type UpdatePlatformMutation,
  type UpdatePlatformMutationVariables,
  type DeletePlatformMutation,
  type DeletePlatformMutationVariables,
  type PlatformQuery,
  type PlatformQueryVariables,
  type PlatformAssetsQuery,
  type PlatformVendorsQuery,
  type PlatformDiagramsQuery,
  type PlatformLinkedAssetFieldsFragment,
  type PlatformLinkedVendorFieldsFragment,
  type PlatformDiagramFileFieldsFragment,
  type UpdatePlatformInput,
} from '@repo/codegen/src/schema'

import { type QueryKey } from '@tanstack/react-query'
import { type RequestDocument } from 'graphql-request'
import { type TPagination } from '@repo/ui/pagination-types'
import { GET_ALL_PLATFORMS, CREATE_PLATFORM, UPDATE_PLATFORM, DELETE_PLATFORM, PLATFORM, PLATFORM_ASSETS, PLATFORM_VENDORS, PLATFORM_DIAGRAMS } from '@repo/codegen/query/platform'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { getNodes } from './connection'

export const DIAGRAM_TYPES = ['architecture', 'data-flow', 'trust-boundary'] as const

export type DiagramType = (typeof DIAGRAM_TYPES)[number]

export type PlatformDiagram = {
  id: string
  type: DiagramType
  name: string
  url: string
  createdAt: string | null
}

const platformKey = (platformId?: string) => ['platform', platformId]
const platformAssetsKey = (platformId?: string) => [...platformKey(platformId), 'assets']
const platformVendorsKey = (platformId?: string) => [...platformKey(platformId), 'vendors']
const platformDiagramsKey = (platformId?: string) => [...platformKey(platformId), 'diagrams']

const DIAGRAM_FIELDS = {
  architecture: { connection: 'architectureDiagrams', removeIDs: 'removeArchitectureDiagramIDs' },
  'data-flow': { connection: 'dataFlowDiagrams', removeIDs: 'removeDataFlowDiagramIDs' },
  'trust-boundary': { connection: 'trustBoundaryDiagrams', removeIDs: 'removeTrustBoundaryDiagramIDs' },
} as const satisfies Record<DiagramType, { connection: keyof NonNullable<PlatformDiagramsQuery['platform']> & keyof UpdatePlatformMutationVariables; removeIDs: keyof UpdatePlatformInput }>

type GetAllPlatformsArgs = {
  where?: PlatformsWithFilterQueryVariables['where']
  orderBy?: PlatformsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type PlatformsNode = NonNullable<NonNullable<NonNullable<PlatformsWithFilterQuery['platforms']>['edges']>[number]>['node']

export type PlatformsNodeNonNull = NonNullable<PlatformsNode>

export const usePlatformsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllPlatformsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<PlatformsWithFilterQuery, unknown>({
    queryKey: ['platforms', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<PlatformsWithFilterQuery> => {
      const result = await client.request<PlatformsWithFilterQuery>(GET_ALL_PLATFORMS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const platformsNodes = getNodes(queryResult.data?.platforms)

  return { ...queryResult, platformsNodes }
}

export const usePlatformSelect = ({ where }: { where?: PlatformsWithFilterQueryVariables['where'] }) => {
  const { data, ...rest } = usePlatformsWithFilter({ where })

  const platformOptions = useMemo(() => data?.platforms?.edges?.flatMap((edge) => (edge?.node ? [{ label: edge.node.name, value: edge.node.id }] : [])) ?? [], [data])

  return { platformOptions, ...rest }
}

export const useCreatePlatform = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreatePlatformMutation, unknown, CreatePlatformMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_PLATFORM, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] })
    },
  })
}

export const useUpdatePlatform = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdatePlatformMutation, unknown, UpdatePlatformMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_PLATFORM, variables),
    onSuccess: (_data, variables) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['platforms'] }),
        queryClient.invalidateQueries({ queryKey: platformKey(variables.updatePlatformId), exact: true }),
        queryClient.invalidateQueries({ queryKey: platformAssetsKey(variables.updatePlatformId) }),
        queryClient.invalidateQueries({ queryKey: platformVendorsKey(variables.updatePlatformId) }),
      ]),
  })
}

export const useDeletePlatform = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeletePlatformMutation, unknown, DeletePlatformMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_PLATFORM, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] })
    },
  })
}

const usePlatformSectionQuery = <TData>(document: RequestDocument, queryKey: QueryKey, platformId?: string) => {
  const { client } = useGraphQLClient()
  return useQuery<TData, unknown>({
    queryKey,
    queryFn: async (): Promise<TData> => client.request<TData>(document, { platformId }),
    enabled: !!platformId,
    placeholderData: undefined,
  })
}

export type PlatformDetail = NonNullable<PlatformQuery['platform']>

export const usePlatform = (platformId?: PlatformQueryVariables['platformId']) => usePlatformSectionQuery<PlatformQuery>(PLATFORM, platformKey(platformId), platformId)

export type PlatformLinkedAsset = PlatformLinkedAssetFieldsFragment

export const usePlatformAssets = (platformId?: PlatformQueryVariables['platformId']) => {
  const queryResult = usePlatformSectionQuery<PlatformAssetsQuery>(PLATFORM_ASSETS, platformAssetsKey(platformId), platformId)

  const inScopeAssets = useMemo(() => getNodes(queryResult.data?.platform?.assets), [queryResult.data])
  const outOfScopeAssets = useMemo(() => getNodes(queryResult.data?.platform?.outOfScopeAssets), [queryResult.data])

  return { ...queryResult, inScopeAssets, outOfScopeAssets }
}

export type PlatformLinkedVendor = PlatformLinkedVendorFieldsFragment

export const usePlatformVendors = (platformId?: PlatformQueryVariables['platformId']) => {
  const queryResult = usePlatformSectionQuery<PlatformVendorsQuery>(PLATFORM_VENDORS, platformVendorsKey(platformId), platformId)

  const inScopeVendors = useMemo(() => getNodes(queryResult.data?.platform?.entities), [queryResult.data])
  const outOfScopeVendors = useMemo(() => getNodes(queryResult.data?.platform?.outOfScopeVendors), [queryResult.data])

  return { ...queryResult, inScopeVendors, outOfScopeVendors }
}

export const usePlatformDiagrams = (platformId?: PlatformQueryVariables['platformId']) => {
  const queryResult = usePlatformSectionQuery<PlatformDiagramsQuery>(PLATFORM_DIAGRAMS, platformDiagramsKey(platformId), platformId)

  const diagrams = useMemo(
    () =>
      DIAGRAM_TYPES.flatMap((type) =>
        getNodes<PlatformDiagramFileFieldsFragment>(queryResult.data?.platform?.[DIAGRAM_FIELDS[type].connection]).map<PlatformDiagram>((file) => ({
          id: file.id,
          type,
          name: file.providedFileName,
          url: file.presignedURL ?? '',
          createdAt: file.createdAt ?? null,
        })),
      ),
    [queryResult.data],
  )

  return { ...queryResult, diagrams }
}

export const useUploadPlatformDiagram = (platformId: string) => {
  const { queryClient } = useGraphQLClient()
  return useMutation<UpdatePlatformMutation, unknown, { file: File; diagramType: DiagramType }>({
    mutationFn: ({ file, diagramType }) =>
      fetchGraphQLWithUpload({
        query: UPDATE_PLATFORM,
        variables: {
          updatePlatformId: platformId,
          input: {},
          [DIAGRAM_FIELDS[diagramType].connection]: [file],
        },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformDiagramsKey(platformId) }),
  })
}

export const useRemovePlatformDiagram = (platformId: string) => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdatePlatformMutation, unknown, { fileId: string; diagramType: DiagramType }>({
    mutationFn: ({ fileId, diagramType }) =>
      client.request<UpdatePlatformMutation, UpdatePlatformMutationVariables>(UPDATE_PLATFORM, {
        updatePlatformId: platformId,
        input: { [DIAGRAM_FIELDS[diagramType].removeIDs]: [fileId] },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformDiagramsKey(platformId) }),
  })
}
