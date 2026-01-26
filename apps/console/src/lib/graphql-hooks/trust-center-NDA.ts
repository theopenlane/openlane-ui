import { useQuery, useMutation } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { CREATE_TRUST_CENTER_NDA, GET_TRUST_CENTER_NDA_FILES, UPDATE_TRUST_CENTER_NDA } from '@repo/codegen/query/trust-center-NDA'
import {
  CreateTrustCenterNdaMutation,
  CreateTrustCenterNdaMutationVariables,
  GetTrustCenterNdaFilesQuery,
  UpdateTrustCenterNdaMutation,
  UpdateTrustCenterNdaMutationVariables,
} from '@repo/codegen/src/schema'
import { fetchGraphQLWithUpload } from '../fetchGraphql'

export const useGetTrustCenterNDAFiles = (enabled = true) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetTrustCenterNdaFilesQuery>({
    queryKey: ['trustCenterNdaFiles'],
    queryFn: () =>
      client.request<GetTrustCenterNdaFilesQuery>(GET_TRUST_CENTER_NDA_FILES, {
        where: {},
      }),
    enabled,
  })

  const templateEdges = queryResult.data?.templates?.edges ?? []
  const latestTemplate = templateEdges[0]?.node
  const files = latestTemplate?.files?.edges?.map((e) => e?.node) ?? []
  const latestFile = files.at(-1)

  return {
    ...queryResult,
    latestFile,
    latestTemplate,
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

export const useUpdateTrustCenterNDA = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<UpdateTrustCenterNdaMutation, unknown, UpdateTrustCenterNdaMutationVariables>({
    mutationFn: async (variables) =>
      fetchGraphQLWithUpload({
        query: UPDATE_TRUST_CENTER_NDA,
        variables,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenterNdaFiles'] })
    },
  })
}
