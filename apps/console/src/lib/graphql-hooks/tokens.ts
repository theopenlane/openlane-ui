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

export const useGetPersonalAccessTokens = (where?: GetPersonalAccessTokensQueryVariables['where'], orderBy?: GetPersonalAccessTokensQueryVariables['orderBy']) => {
  const { client } = useGraphQLClient()
  return useQuery<GetPersonalAccessTokensQuery, unknown>({
    queryKey: ['personalAccessTokens', { where, orderBy }],
    queryFn: async () => client.request(GET_PERSONAL_ACCESS_TOKENS, { where, orderBy }),
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

export const useGetApiTokens = (where?: GetApiTokensQueryVariables['where'], orderBy?: GetApiTokensQueryVariables['orderBy']) => {
  const { client } = useGraphQLClient()
  return useQuery<GetApiTokensQuery, unknown>({
    queryKey: ['apiTokens', { where, orderBy }],
    queryFn: async () => client.request(GET_API_TOKENS, { where, orderBy }),
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
