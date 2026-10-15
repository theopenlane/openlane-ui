import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  GET_ALL_TRUST_CENTER_SUBPROCESSORS,
  CREATE_TRUST_CENTER_SUBPROCESSOR,
  UPDATE_TRUST_CENTER_SUBPROCESSOR,
  DELETE_BULK_TRUST_CENTER_SUBPROCESSORS,
  DELETE_TRUST_CENTER_SUBPROCESSOR,
  GET_ALL_TRUST_CENTER_SUBPROCESSOR_BY_ID,
  GET_TRUST_CENTER_SUBPROCESSOR_LINKS,
  CREATE_BULK_TRUST_CENTER_SUBPROCESSOR,
} from '@repo/codegen/query/trust-center-subprocessor'

import {
  type GetTrustCenterSubprocessorsQuery,
  type GetTrustCenterSubprocessorsQueryVariables,
  type CreateTrustCenterSubprocessorMutation,
  type CreateTrustCenterSubprocessorMutationVariables,
  type UpdateTrustCenterSubprocessorMutation,
  type UpdateTrustCenterSubprocessorMutationVariables,
  type DeleteBulkTrustCenterSubprocessorsMutation,
  type DeleteBulkTrustCenterSubprocessorsMutationVariables,
  type DeleteTrustCenterSubprocessorMutation,
  type DeleteTrustCenterSubprocessorMutationVariables,
  type GetTrustCenterSubprocessorByIdQuery,
  type GetTrustCenterSubprocessorByIdQueryVariables,
  type GetTrustCenterSubprocessorLinksQuery,
  type GetTrustCenterSubprocessorLinksQueryVariables,
  type CreateBulkTrustCenterSubprocessorMutation,
  type CreateBulkTrustCenterSubprocessorMutationVariables,
} from '@repo/codegen/src/schema'

import { useQuery, useMutation, type QueryClient } from '@tanstack/react-query'
import { type TPagination } from '@repo/ui/pagination-types'
import { useCallback } from 'react'
import { invalidateCustomTypeEnumsForName } from '@/lib/graphql-hooks/custom-type-enum'
import { fetchAllConnectionNodes } from './fetch-all-connection-nodes'

type UseGetTrustCenterSubprocessorsArgs = {
  where?: GetTrustCenterSubprocessorsQueryVariables['where']
  pagination?: TPagination | null
  orderBy?: GetTrustCenterSubprocessorsQueryVariables['orderBy']
  enabled?: boolean
}

export const useGetTrustCenterSubprocessors = ({ where, pagination, orderBy, enabled = true }: UseGetTrustCenterSubprocessorsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetTrustCenterSubprocessorsQuery>({
    queryKey: ['trustCenterSubprocessors', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: () =>
      client.request<GetTrustCenterSubprocessorsQuery, GetTrustCenterSubprocessorsQueryVariables>(GET_ALL_TRUST_CENTER_SUBPROCESSORS, {
        where,
        orderBy,
        ...pagination?.query,
      }),
    enabled,
  })

  const edges = queryResult.data?.trustCenterSubprocessors?.edges ?? []
  const trustCenterSubprocessors = edges.map((e) => e?.node)

  const paginationMeta = {
    totalCount: queryResult.data?.trustCenterSubprocessors?.totalCount ?? 0,
    pageInfo: queryResult.data?.trustCenterSubprocessors?.pageInfo ?? {},
    isLoading: queryResult.isLoading,
  }

  return {
    ...queryResult,
    trustCenterSubprocessors,
    paginationMeta,
  }
}

export type TrustCenterSubprocessorEdge = NonNullable<NonNullable<GetTrustCenterSubprocessorsQuery['trustCenterSubprocessors']>['edges']>[number]

export type TrustCenterSubprocessorNode = NonNullable<TrustCenterSubprocessorEdge>['node']

export const useCreateTrustCenterSubprocessor = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateTrustCenterSubprocessorMutation, unknown, CreateTrustCenterSubprocessorMutationVariables>({
    mutationFn: async (variables) => client.request(CREATE_TRUST_CENTER_SUBPROCESSOR, variables),

    onSuccess: (_data, variables) => invalidateSubprocessorQueries(queryClient, [variables.input.trustCenterSubprocessorKindName]),
  })
}

export const useUpdateTrustCenterSubprocessor = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateTrustCenterSubprocessorMutation, unknown, UpdateTrustCenterSubprocessorMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_TRUST_CENTER_SUBPROCESSOR, variables),

    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trustCenterSubprocessors'] })
      queryClient.invalidateQueries({ queryKey: ['trustCenterSubprocessor'] })
      invalidateCustomTypeEnumsForName(queryClient, variables.input.trustCenterSubprocessorKindName)
    },
  })
}

export const useFetchAllTrustCenterSubprocessorIds = () => {
  const { client } = useGraphQLClient()

  return useCallback(
    async (where?: GetTrustCenterSubprocessorsQueryVariables['where']): Promise<string[]> => {
      const ids: string[] = []
      let after: GetTrustCenterSubprocessorsQueryVariables['after'] = null
      let hasNextPage = true

      while (hasNextPage) {
        const result = await client.request<GetTrustCenterSubprocessorsQuery, GetTrustCenterSubprocessorsQueryVariables>(GET_ALL_TRUST_CENTER_SUBPROCESSORS, {
          where,
          first: 100,
          after,
        })

        const connection = result.trustCenterSubprocessors
        connection?.edges?.forEach((edge) => {
          if (edge?.node?.id) ids.push(edge.node.id)
        })

        hasNextPage = connection?.pageInfo?.hasNextPage ?? false
        after = connection?.pageInfo?.endCursor ?? null
        if (!after) break
      }

      return ids
    },
    [client],
  )
}

export const useBulkDeleteTrustCenterSubprocessors = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkTrustCenterSubprocessorsMutation, unknown, DeleteBulkTrustCenterSubprocessorsMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_BULK_TRUST_CENTER_SUBPROCESSORS, variables),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenterSubprocessors'] })
    },
  })
}

export const useDeleteTrustCenterSubprocessor = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteTrustCenterSubprocessorMutation, unknown, DeleteTrustCenterSubprocessorMutationVariables>({
    mutationFn: async (variables) => client.request(DELETE_TRUST_CENTER_SUBPROCESSOR, variables),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['trustCenterSubprocessors'],
      })
    },
  })
}

export const useGetTrustCenterSubprocessorByID = ({ trustCenterSubprocessorId, enabled = true }: { trustCenterSubprocessorId: string; enabled?: boolean }) => {
  const { client } = useGraphQLClient()

  return useQuery<GetTrustCenterSubprocessorByIdQuery>({
    queryKey: ['trustCenterSubprocessor', trustCenterSubprocessorId],
    queryFn: () =>
      client.request<GetTrustCenterSubprocessorByIdQuery, GetTrustCenterSubprocessorByIdQueryVariables>(GET_ALL_TRUST_CENTER_SUBPROCESSOR_BY_ID, {
        trustCenterSubprocessorId,
      }),
    enabled: !!trustCenterSubprocessorId && enabled,
  })
}

const LINKS_PAGE_SIZE = 100

export const useTrustCenterSubprocessorLinks = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const { client } = useGraphQLClient()

  return useQuery({
    queryKey: ['trustCenterSubprocessors', 'links'],
    queryFn: () =>
      fetchAllConnectionNodes(async (after) => {
        const data = await client.request<GetTrustCenterSubprocessorLinksQuery, GetTrustCenterSubprocessorLinksQueryVariables>(GET_TRUST_CENTER_SUBPROCESSOR_LINKS, { first: LINKS_PAGE_SIZE, after })
        return data.trustCenterSubprocessors
      }),
    enabled,
  })
}

export const invalidateSubprocessorQueries = (queryClient: QueryClient, categoryNames: readonly (string | null | undefined)[] = []) => {
  queryClient.invalidateQueries({ queryKey: ['trustCenterSubprocessors'] })
  queryClient.invalidateQueries({ queryKey: ['subprocessors'] })
  new Set(categoryNames).forEach((name) => invalidateCustomTypeEnumsForName(queryClient, name))
}

export const useCreateBulkTrustCenterSubprocessor = () => {
  const { client } = useGraphQLClient()

  return useMutation<CreateBulkTrustCenterSubprocessorMutation, unknown, CreateBulkTrustCenterSubprocessorMutationVariables>({
    mutationFn: (variables) => client.request<CreateBulkTrustCenterSubprocessorMutation, CreateBulkTrustCenterSubprocessorMutationVariables>(CREATE_BULK_TRUST_CENTER_SUBPROCESSOR, variables),
  })
}
