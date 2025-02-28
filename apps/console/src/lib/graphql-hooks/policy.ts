import { useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { GET_ALL_INTERNAL_POLICIES_WITH_DETAILS, GET_INTERNAL_POLICIES_LIST, GET_ALL_INTERNAL_POLICIES, GET_INTERNAL_POLICY_DETAILS_BY_ID } from '@repo/codegen/query/policy'
import {
  GetAllInternalPoliciesWithDetailsQuery,
  GetInternalPoliciesListQuery,
  GetAllInternalPoliciesQuery,
  GetInternalPolicyDetailsByIdQuery,
  GetInternalPolicyDetailsByIdQueryVariables,
} from '@repo/codegen/src/schema'

export const useGetAllInternalPoliciesWithDetails = () => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllInternalPoliciesWithDetailsQuery>({
    queryKey: ['internalPolicies', 'withDetails'],
    queryFn: async () => client.request(GET_ALL_INTERNAL_POLICIES_WITH_DETAILS),
  })
}

export const useGetInternalPoliciesList = () => {
  const { client } = useGraphQLClient()

  return useQuery<GetInternalPoliciesListQuery>({
    queryKey: ['internalPolicies', 'list'],
    queryFn: async () => client.request(GET_INTERNAL_POLICIES_LIST),
  })
}

export const useGetAllInternalPolicies = () => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllInternalPoliciesQuery>({
    queryKey: ['internalPolicies'],
    queryFn: async () => client.request(GET_ALL_INTERNAL_POLICIES),
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
