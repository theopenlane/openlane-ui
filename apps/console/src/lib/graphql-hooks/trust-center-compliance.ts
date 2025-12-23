import {
  GetTrustCenterCompliancesQuery,
  CreateTrustCenterComplianceMutation,
  CreateTrustCenterComplianceMutationVariables,
  UpdateTrustCenterComplianceMutation,
  UpdateTrustCenterComplianceMutationVariables,
  DeleteTrustCenterComplianceMutation,
  DeleteTrustCenterComplianceMutationVariables,
} from '@repo/codegen/src/schema'

import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { useQuery, useMutation } from '@tanstack/react-query'
import { CREATE_TRUST_CENTER_COMPLIANCE, DELETE_TRUST_CENTER_COMPLIANCE, GET_TRUST_CENTER_COMPLIANCES, UPDATE_TRUST_CENTER_COMPLIANCE } from '@repo/codegen/query/trust-center-compliances'

export const useGetTrustCenterCompliances = () => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetTrustCenterCompliancesQuery>({
    queryKey: ['trustCenter', 'compliances'],
    queryFn: async () => client.request<GetTrustCenterCompliancesQuery>(GET_TRUST_CENTER_COMPLIANCES),
  })

  const edges = queryResult.data?.trustCenterCompliances?.edges ?? []
  const compliances = edges.map((e) => e?.node).filter(Boolean)

  return { ...queryResult, compliances }
}

export const useCreateTrustCenterCompliance = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateTrustCenterComplianceMutation, Error, CreateTrustCenterComplianceMutationVariables>({
    mutationFn: async (variables) => client.request<CreateTrustCenterComplianceMutation, CreateTrustCenterComplianceMutationVariables>(CREATE_TRUST_CENTER_COMPLIANCE, variables),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenter', 'compliances'] })
    },
  })
}

export const useUpdateTrustCenterCompliance = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateTrustCenterComplianceMutation, Error, UpdateTrustCenterComplianceMutationVariables>({
    mutationFn: async (variables) => client.request<UpdateTrustCenterComplianceMutation, UpdateTrustCenterComplianceMutationVariables>(UPDATE_TRUST_CENTER_COMPLIANCE, variables),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenter', 'compliances'] })
    },
  })
}

export const useDeleteTrustCenterCompliance = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteTrustCenterComplianceMutation, Error, DeleteTrustCenterComplianceMutationVariables>({
    mutationFn: async (variables) => client.request<DeleteTrustCenterComplianceMutation, DeleteTrustCenterComplianceMutationVariables>(DELETE_TRUST_CENTER_COMPLIANCE, variables),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenter', 'compliances'] })
    },
  })
}
