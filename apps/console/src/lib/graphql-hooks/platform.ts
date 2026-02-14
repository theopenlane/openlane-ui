import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  Platform,
  PlatformQuery,
  PlatformQueryVariables,
  PlatformsWithFilterQuery,
  PlatformsWithFilterQueryVariables,
  CreatePlatformMutation,
  CreatePlatformMutationVariables,
  DeletePlatformMutation,
  DeletePlatformMutationVariables,
  UpdatePlatformMutation,
  UpdatePlatformMutationVariables,
} from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { PLATFORM, GET_ALL_PLATFORMS, CREATE_PLATFORM, DELETE_PLATFORM, UPDATE_PLATFORM } from '@repo/codegen/query/platform'

type GetAllPlatformsArgs = {
  where?: PlatformsWithFilterQueryVariables['where']
  orderBy?: PlatformsWithFilterQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const usePlatformsWithFilter = ({ where, orderBy, pagination, enabled = true }: GetAllPlatformsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<PlatformsWithFilterQuery, unknown>({
    queryKey: ['platforms', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: async (): Promise<PlatformsWithFilterQuery> => {
      const result = await client.request(GET_ALL_PLATFORMS, { where, orderBy, ...pagination?.query })
      return result as PlatformsWithFilterQuery
    },
    enabled,
  })

  const Platforms = (queryResult.data?.platforms?.edges?.map((edge) => {
    return {
      ...edge?.node,
    }
  }) ?? []) as Platform[]

  return { ...queryResult, Platforms }
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platforms'] })
    },
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

export const usePlatform = (platformId?: PlatformQueryVariables['platformId']) => {
  const { client } = useGraphQLClient()

  return useQuery<PlatformQuery, unknown>({
    queryKey: ['platforms', platformId],
    queryFn: async (): Promise<PlatformQuery> => {
      const result = await client.request(PLATFORM, { platformId })
      return result as PlatformQuery
    },
    enabled: !!platformId,
  })
}
