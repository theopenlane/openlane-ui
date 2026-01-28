import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  GET_TRUST_CENTER_SUBPROCESSORS,
  CREATE_TRUST_CENTER_SUBPROCESSOR,
  UPDATE_TRUST_CENTER_SUBPROCESSOR,
  DELETE_BULK_TRUST_CENTER_SUBPROCESSORS,
  DELETE_TRUST_CENTER_SUBPROCESSOR,
  GET_TRUST_CENTER_SUBPROCESSOR_BY_ID,
} from '@repo/codegen/query/trust-center-subprocessors'

import {
  GetTrustCenterSubprocessorsQuery,
  GetTrustCenterSubprocessorsQueryVariables,
  CreateTrustCenterSubprocessorMutation,
  CreateTrustCenterSubprocessorMutationVariables,
  UpdateTrustCenterSubprocessorMutation,
  UpdateTrustCenterSubprocessorMutationVariables,
  DeleteBulkTrustCenterSubprocessorsMutation,
  DeleteBulkTrustCenterSubprocessorsMutationVariables,
  DeleteTrustCenterSubprocessorMutation,
  DeleteTrustCenterSubprocessorMutationVariables,
  GetTrustCenterSubprocessorByIdQuery,
  GetTrustCenterSubprocessorByIdQueryVariables,
} from '@repo/codegen/src/schema'

import { useQuery, useMutation } from '@tanstack/react-query'
import { TPagination } from '@repo/ui/pagination-types'

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
      client.request<GetTrustCenterSubprocessorsQuery, GetTrustCenterSubprocessorsQueryVariables>(GET_TRUST_CENTER_SUBPROCESSORS, {
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
    isLoading: queryResult.isFetching,
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

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenterSubprocessors'] })
      queryClient.invalidateQueries({ queryKey: ['subprocessors'] })
    },
  })
}

export const useUpdateTrustCenterSubprocessor = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateTrustCenterSubprocessorMutation, unknown, UpdateTrustCenterSubprocessorMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_TRUST_CENTER_SUBPROCESSOR, variables),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenterSubprocessors'] })
    },
  })
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
      client.request<GetTrustCenterSubprocessorByIdQuery, GetTrustCenterSubprocessorByIdQueryVariables>(GET_TRUST_CENTER_SUBPROCESSOR_BY_ID, {
        trustCenterSubprocessorId,
      }),
    enabled: !!trustCenterSubprocessorId && enabled,
  })
}
