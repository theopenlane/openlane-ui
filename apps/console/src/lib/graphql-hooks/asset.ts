import { type QueryClient, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type AssetsWithFilterQuery,
  type AssetsWithFilterQueryVariables,
  type AssetBulkCreatePayload,
  type CreateAssetMutation,
  type CreateAssetInput,
  type CreateAssetMutationVariables,
  type UpdateAssetMutation,
  type UpdateAssetMutationVariables,
  type DeleteAssetMutation,
  type DeleteAssetMutationVariables,
  type AssetQuery,
  type AssetQueryVariables,
  type CreateBulkCsvAssetMutation,
  type CreateBulkCsvAssetMutationVariables,
  type UpdateBulkAssetMutation,
  type UpdateBulkAssetMutationVariables,
  type DeleteBulkAssetMutation,
  type DeleteBulkAssetMutationVariables,
  type GetAssetAssociationsQuery,
  type GetAssetAssociationsQueryVariables,
  type UpdateAssetInput,
  type GetAssetOptionsQuery,
  type GetAssetOptionsQueryVariables,
} from '@repo/codegen/src/schema'
import { invalidateEdgeUpdateTargets } from '@/components/shared/object-association/object-association-config'
import { invalidatePlatformPlacement } from '@/lib/graphql-hooks/platform'
import { useModuleAccess } from '@/lib/subscription-plan/hooks/use-module-access'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { type TPagination } from '@repo/ui/pagination-types'
import { MAX_CONNECTION_RESULTS } from '@/constants/pagination'
import { getNodes } from '@/lib/graphql-hooks/connection'
import {
  GET_ALL_ASSETS,
  CREATE_ASSET,
  UPDATE_ASSET,
  DELETE_ASSET,
  ASSET,
  CREATE_BULK_ASSET,
  CREATE_CSV_BULK_ASSET,
  BULK_EDIT_ASSET,
  BULK_DELETE_ASSET,
  GET_ASSET_ASSOCIATIONS,
  GET_ASSET_OPTIONS,
} from '@repo/codegen/query/asset'

type GetAllAssetsArgs = {
  where?: AssetsWithFilterQueryVariables['where']
  orderBy?: AssetsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export type AssetsNode = NonNullable<NonNullable<NonNullable<AssetsWithFilterQuery['assets']>['edges']>[number]>['node']

export type AssetsNodeNonNull = NonNullable<AssetsNode>

export const useAssetsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllAssetsArgs) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<AssetsWithFilterQuery, unknown>({
    queryKey: ['assets', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<AssetsWithFilterQuery> => {
      const result = await client.request<AssetsWithFilterQuery>(GET_ALL_ASSETS, { where, orderBy, ...pagination?.query })
      return result
    },
    enabled,
  })

  const assetsNodes: AssetsNodeNonNull[] = useMemo(() => (queryResult.data?.assets?.edges ?? []).flatMap((edge) => (edge?.node ? [edge.node as AssetsNodeNonNull] : [])), [queryResult.data])

  return { ...queryResult, assetsNodes }
}

const invalidateAssetUpdate = (input: UpdateAssetInput, queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ['assets'] })
  queryClient.invalidateQueries({ queryKey: ['assetHistories'] })
  invalidateEdgeUpdateTargets(input, queryClient)
  const platformIds = [...(input.addPlatformIDs ?? []), ...(input.removePlatformIDs ?? [])]
  if (platformIds.length > 0) invalidatePlatformPlacement(platformIds, queryClient)
  if (input.addSystemDetailIDs?.length || input.removeSystemDetailIDs?.length) queryClient.invalidateQueries({ queryKey: ['systemDetails'] })
}

export const useCreateAsset = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateAssetMutation, unknown, CreateAssetMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_ASSET, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}

type CreateBulkAssetMutation = {
  createBulkAsset: AssetBulkCreatePayload
}

type CreateBulkAssetMutationVariables = {
  input?: CreateAssetInput[]
}

export const useCreateBulkAsset = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<CreateBulkAssetMutation, unknown, CreateBulkAssetMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_BULK_ASSET, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}

export const useUpdateAsset = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateAssetMutation, unknown, UpdateAssetMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_ASSET, variables),
    onSuccess: (_, { input }) => {
      invalidateAssetUpdate(input, queryClient)
    },
  })
}

export const useDeleteAsset = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<DeleteAssetMutation, unknown, DeleteAssetMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_ASSET, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}

export const useAsset = (assetId?: AssetQueryVariables['assetId']) => {
  const { client } = useGraphQLClient()
  return useQuery<AssetQuery, unknown>({
    queryKey: ['assets', assetId],
    queryFn: async (): Promise<AssetQuery> => {
      const result = await client.request(ASSET, { assetId })
      return result as AssetQuery
    },
    enabled: !!assetId,
  })
}

export const useCreateBulkCSVAsset = () => {
  const { queryClient } = useGraphQLClient()
  return useMutation<CreateBulkCsvAssetMutation, unknown, CreateBulkCsvAssetMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_ASSET, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}

export const useBulkEditAsset = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<UpdateBulkAssetMutation, unknown, UpdateBulkAssetMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_EDIT_ASSET, variables),
    onSuccess: (_, { input }) => {
      invalidateAssetUpdate(input, queryClient)
    },
  })
}

export const useBulkDeleteAsset = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<DeleteBulkAssetMutation, unknown, DeleteBulkAssetMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_DELETE_ASSET, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}

export const useGetAssetAssociations = (assetId?: string) => {
  const { client } = useGraphQLClient()
  const { hasObjectType, isLoading: isAccessLoading } = useModuleAccess()
  const includes = {
    withScans: hasObjectType(ObjectTypes.SCAN),
    withEntities: hasObjectType(ObjectTypes.ENTITY),
    withIdentityHolders: hasObjectType(ObjectTypes.IDENTITY_HOLDER),
    withControls: hasObjectType(ObjectTypes.CONTROL),
    withInternalPolicies: hasObjectType(ObjectTypes.INTERNAL_POLICY),
    withSubcontrols: hasObjectType(ObjectTypes.SUBCONTROL),
    withFindings: hasObjectType(ObjectTypes.FINDING),
    withVulnerabilities: hasObjectType(ObjectTypes.VULNERABILITY),
    withReviews: hasObjectType(ObjectTypes.REVIEW),
    withRemediations: hasObjectType(ObjectTypes.REMEDIATION),
  }

  return useQuery<GetAssetAssociationsQuery, unknown>({
    queryKey: ['assets', assetId, 'associations', includes],
    queryFn: async () => client.request<GetAssetAssociationsQuery, GetAssetAssociationsQueryVariables>(GET_ASSET_ASSOCIATIONS, { assetId: assetId as string, ...includes }),
    enabled: !!assetId && !isAccessLoading,
  })
}

export const useAssetOptions = (where?: GetAssetOptionsQueryVariables['where']) => {
  const { client } = useGraphQLClient()
  const queryResult = useQuery<GetAssetOptionsQuery, unknown>({
    queryKey: ['assets', 'options', where],
    queryFn: async () => client.request<GetAssetOptionsQuery, GetAssetOptionsQueryVariables>(GET_ASSET_OPTIONS, { where, first: MAX_CONNECTION_RESULTS }),
  })

  return { ...queryResult, options: useMemo(() => getNodes(queryResult.data?.assets), [queryResult.data]) }
}
