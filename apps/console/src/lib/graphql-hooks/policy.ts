import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  GET_ALL_INTERNAL_POLICIES_WITH_DETAILS,
  GET_INTERNAL_POLICIES_LIST,
  GET_ALL_INTERNAL_POLICIES,
  GET_INTERNAL_POLICY_DETAILS_BY_ID,
  CREATE_INTERNAL_POLICY,
  UPDATE_INTERNAL_POLICY,
  DELETE_INTERNAL_POLICY,
} from '@repo/codegen/query/policy'
import {
  GetAllInternalPoliciesWithDetailsQuery,
  GetInternalPoliciesListQuery,
  GetAllInternalPoliciesQuery,
  GetInternalPolicyDetailsByIdQuery,
  GetInternalPolicyDetailsByIdQueryVariables,
  CreateInternalPolicyMutation,
  CreateInternalPolicyMutationVariables,
  UpdateInternalPolicyMutation,
  UpdateInternalPolicyMutationVariables,
  DeleteInternalPolicyMutation,
  DeleteInternalPolicyMutationVariables,
} from '@repo/codegen/src/schema'

export const useGetInternalPoliciesList = () => {
  const { client } = useGraphQLClient()

  return useQuery<GetInternalPoliciesListQuery>({
    queryKey: ['internalPolicies'],
    queryFn: async () => client.request(GET_INTERNAL_POLICIES_LIST),
  })
}

export const useGetInternalPolicyDetailsById = (internalPolicyId: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetInternalPolicyDetailsByIdQuery, GetInternalPolicyDetailsByIdQueryVariables>({
    queryKey: ['internalPolicy', internalPolicyId],
    queryFn: async () => client.request(GET_INTERNAL_POLICY_DETAILS_BY_ID, { internalPolicyId }),
    enabled: !!internalPolicyId,
  })
}

export const useCreateInternalPolicy = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateInternalPolicyMutation, unknown, CreateInternalPolicyMutationVariables>({
    mutationFn: async (payload) => {
      return client.request(CREATE_INTERNAL_POLICY, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internalPolicies'] })
    },
  })
}

export const useUpdateInternalPolicy = () => {
  const { client } = useGraphQLClient()

  return useMutation<UpdateInternalPolicyMutation, unknown, UpdateInternalPolicyMutationVariables>({
    mutationFn: async (variables) => {
      return client.request(UPDATE_INTERNAL_POLICY, variables)
    },
  })
}

// export const useGetAllInternalPoliciesWithDetails = () => {
//   const { client } = useGraphQLClient()

//   return useQuery<GetAllInternalPoliciesWithDetailsQuery>({
//     queryKey: ['internalPolicies', 'withDetails'],
//     queryFn: async () => client.request(GET_ALL_INTERNAL_POLICIES_WITH_DETAILS),
//   })
// }

// export const useDeleteInternalPolicy = () => {
//   const { client } = useGraphQLClient()

//   return useMutation<DeleteInternalPolicyMutation, unknown, DeleteInternalPolicyMutationVariables>({
//     mutationFn: async (variables) => {
//       return client.request(DELETE_INTERNAL_POLICY, variables)
//     },
//   })
// }

// export const useGetAllInternalPolicies = () => {
//   const { client } = useGraphQLClient()

//   return useQuery<GetAllInternalPoliciesQuery>({
//     queryKey: ['internalPolicies'],
//     queryFn: async () => client.request(GET_ALL_INTERNAL_POLICIES),
//   })
// }
