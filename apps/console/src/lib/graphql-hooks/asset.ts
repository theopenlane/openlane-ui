import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  type AssetsWithFilterQuery,
  type AssetsWithFilterQueryVariables,
  type CreateAssetMutation,
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
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { type TPagination } from '@repo/ui/pagination-types'
import { GET_ALL_ASSETS, CREATE_ASSET, UPDATE_ASSET, DELETE_ASSET, ASSET, CREATE_CSV_BULK_ASSET, BULK_EDIT_ASSET, BULK_DELETE_ASSET, GET_ASSET_ASSOCIATIONS } from '@repo/codegen/query/asset'

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

  const edges = queryResult.data?.assets?.edges ?? []

  const assetsNodes: AssetsNodeNonNull[] = edges.filter((edge) => edge != null).map((edge) => edge?.node as AssetsNodeNonNull)

  return { ...queryResult, assetsNodes }
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

export const useUpdateAsset = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()
  return useMutation<UpdateAssetMutation, unknown, UpdateAssetMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_ASSET, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
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
  return useQuery<GetAssetAssociationsQuery, unknown>({
    queryKey: ['assets', assetId, 'associations'],
    queryFn: async () => client.request<GetAssetAssociationsQuery>(GET_ASSET_ASSOCIATIONS, { assetId: assetId as string }),
    enabled: !!assetId,
  })
}
