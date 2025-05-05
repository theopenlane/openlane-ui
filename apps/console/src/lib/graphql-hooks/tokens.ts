import { useQuery, useMutation } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { GET_PERSONAL_ACCESS_TOKENS, CREATE_PERSONAL_ACCESS_TOKEN, DELETE_PERSONAL_ACCESS_TOKEN, CREATE_API_TOKEN, GET_API_TOKENS, DELETE_API_TOKEN } from '@repo/codegen/query/tokens'
import {
  GetPersonalAccessTokensQuery,
  CreatePersonalAccessTokenMutation,
  CreatePersonalAccessTokenMutationVariables,
  DeletePersonalAccessTokenMutation,
  DeletePersonalAccessTokenMutationVariables,
  GetApiTokensQuery,
  CreateApiTokenMutation,
  CreateApiTokenMutationVariables,
  DeleteApiTokenMutation,
  DeleteApiTokenMutationVariables,
  GetApiTokensQueryVariables,
  GetPersonalAccessTokensQueryVariables,
} from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'

type UseGetPersonalAccessTokensArgs = {
  where?: GetPersonalAccessTokensQueryVariables['where']
  orderBy?: GetPersonalAccessTokensQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useGetPersonalAccessTokens = ({ where, orderBy, pagination, enabled = true }: UseGetPersonalAccessTokensArgs) => {
  const { client } = useGraphQLClient()
  return useQuery<GetPersonalAccessTokensQuery>({
    queryKey: ['personalAccessTokens', where, orderBy, pagination?.pageSize, pagination?.page],
    queryFn: async () =>
      client.request(GET_PERSONAL_ACCESS_TOKENS, {
        where,
        orderBy,
        ...pagination?.query,
      }),
    enabled,
  })
}

export const useCreatePersonalAccessToken = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<CreatePersonalAccessTokenMutation, unknown, CreatePersonalAccessTokenMutationVariables>({
    mutationFn: async (input) => client.request(CREATE_PERSONAL_ACCESS_TOKEN, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalAccessTokens'] })
    },
  })
}

export const useDeletePersonalAccessToken = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<DeletePersonalAccessTokenMutation, unknown, DeletePersonalAccessTokenMutationVariables>({
    mutationFn: async (payload) => client.request(DELETE_PERSONAL_ACCESS_TOKEN, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalAccessTokens'] })
    },
  })
}

type UseGetApiTokensArgs = {
  where?: GetApiTokensQueryVariables['where']
  orderBy?: GetApiTokensQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useGetApiTokens = ({ where, orderBy, pagination, enabled = true }: UseGetApiTokensArgs) => {
  const { client } = useGraphQLClient()
  return useQuery<GetApiTokensQuery>({
    queryKey: ['apiTokens', where, orderBy, pagination?.pageSize, pagination?.page],
    queryFn: async () =>
      client.request(GET_API_TOKENS, {
        where,
        orderBy,
        ...pagination?.query,
      }),
    enabled,
  })
}

export const useCreateAPIToken = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<CreateApiTokenMutation, unknown, CreateApiTokenMutationVariables>({
    mutationFn: async (input) => client.request(CREATE_API_TOKEN, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiTokens'] })
    },
  })
}

export const useDeleteApiToken = () => {
  const { client, queryClient } = useGraphQLClient()
  return useMutation<DeleteApiTokenMutation, unknown, DeleteApiTokenMutationVariables>({
    mutationFn: async (payload) => client.request(DELETE_API_TOKEN, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiTokens'] })
    },
  })
}
