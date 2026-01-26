import {
  GetTrustCenterCompliancesQuery,
  UpdateTrustCenterComplianceMutation,
  UpdateTrustCenterComplianceMutationVariables,
  DeleteBulkTrustCenterComplianceMutation,
  CreateBulkTrustCenterComplianceMutation,
  CreateBulkTrustCenterComplianceMutationVariables,
  DeleteBulkTrustCenterComplianceMutationVariables,
} from '@repo/codegen/src/schema'

import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { useQuery, useMutation } from '@tanstack/react-query'
import { CREATE_BULK_TRUST_CENTER_COMPLIANCE, DELETE_BULK_TRUST_CENTER_COMPLIANCE, GET_TRUST_CENTER_COMPLIANCES, UPDATE_TRUST_CENTER_COMPLIANCE } from '@repo/codegen/query/trust-center-compliances'

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

export const useCreateBulkTrustCenterCompliance = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateBulkTrustCenterComplianceMutation, Error, CreateBulkTrustCenterComplianceMutationVariables>({
    mutationFn: async (variables) => client.request<CreateBulkTrustCenterComplianceMutation, CreateBulkTrustCenterComplianceMutationVariables>(CREATE_BULK_TRUST_CENTER_COMPLIANCE, variables),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenter', 'compliances'] })
    },
  })
}

export const useDeleteBulkTrustCenterCompliance = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteBulkTrustCenterComplianceMutation, Error, DeleteBulkTrustCenterComplianceMutationVariables>({
    mutationFn: async (variables) => client.request<DeleteBulkTrustCenterComplianceMutation, DeleteBulkTrustCenterComplianceMutationVariables>(DELETE_BULK_TRUST_CENTER_COMPLIANCE, variables),

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
