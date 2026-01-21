import { useQuery, useMutation } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { GET_TRUST_CENTER_NDA_REQUESTS, CREATE_TRUST_CENTER_NDA } from '@repo/codegen/query/trust-center-NDA'
import { GetTrustCenterNdaRequestsQuery, CreateTrustCenterNdaMutation, CreateTrustCenterNdaMutationVariables } from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '../fetchGraphql'

export const useGetTrustCenterNDARequests = (enabled = true) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetTrustCenterNdaRequestsQuery>({
    queryKey: ['trustCenterNdaRequests'],
    queryFn: () => client.request<GetTrustCenterNdaRequestsQuery>(GET_TRUST_CENTER_NDA_REQUESTS),
    enabled,
  })

  const edges = queryResult.data?.trustCenterNdaRequests?.edges ?? []
  const ndaRequests = edges.map((e) => e?.node)

  return {
    ...queryResult,
    ndaRequests,
  }
}

export const useCreateTrustCenterNDA = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateTrustCenterNdaMutation, unknown, CreateTrustCenterNdaMutationVariables>({
    mutationFn: async (variables) =>
      fetchGraphQLWithUpload({
        query: CREATE_TRUST_CENTER_NDA,
        variables,
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenterNdaRequests'] })
    },
  })
}
