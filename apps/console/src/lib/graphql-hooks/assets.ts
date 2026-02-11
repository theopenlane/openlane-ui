import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  Asset,
  AssetQuery,
  AssetQueryVariables,
  AssetsWithFilterQuery,
  AssetsWithFilterQueryVariables,
  CreateAssessmentMutationVariables,
  CreateAssetMutation,
  CreateBulkCsvAssetMutation,
  CreateBulkCsvTaskMutationVariables,
  DeleteAssetMutation,
  DeleteAssetMutationVariables,
  DeleteBulkAssetMutation,
  DeleteBulkAssetMutationVariables,
  UpdateAssetMutation,
  UpdateAssetMutationVariables,
  UpdateBulkAssetMutation,
  UpdateBulkAssetMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'
import { ASSET, GET_ALL_ASSETS, BULK_DELETE_ASSET, CREATE_ASSET, CREATE_CSV_BULK_ASSET, DELETE_ASSET, UPDATE_ASSET, BULK_EDIT_ASSET } from '@repo/codegen/query/asset'

type GetAllAssetsArgs = {
  where?: AssetsWithFilterQueryVariables['where']
  orderBy?: AssetsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useAssetsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllAssetsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<AssetsWithFilterQuery, unknown>({
    queryKey: ['assets', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<AssetsWithFilterQuery> => {
      const result = await client.request(GET_ALL_ASSETS, { where, orderBy, ...pagination?.query })
      return result as AssetsWithFilterQuery
    },
    enabled,
  })

  const Assets = (queryResult.data?.assets?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as Asset[]

  return { ...queryResult, Assets }
}

export const useCreateAsset = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<CreateAssetMutation, unknown, CreateAssessmentMutationVariables>({
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

  return useMutation<CreateBulkCsvAssetMutation, unknown, CreateBulkCsvTaskMutationVariables>({
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
