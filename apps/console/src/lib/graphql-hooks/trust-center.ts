import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { GET_TRUST_CENTER, UPDATE_TRUST_CENTER_SETTING } from '@repo/codegen/query/trust-center'
import { GetTrustCenterQuery, UpdateTrustCenterSettingMutation, UpdateTrustCenterSettingMutationVariables } from '@repo/codegen/src/schema'
import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchGraphQLWithUpload } from '../fetchGraphql'

export const useGetTrustCenter = () => {
  const { client } = useGraphQLClient()

  return useQuery({
    queryKey: ['trustCenter'],
    queryFn: async () => client.request<GetTrustCenterQuery>(GET_TRUST_CENTER),
  })
}

export type TrustCenterEdge = NonNullable<NonNullable<GetTrustCenterQuery['trustCenters']>['edges']>[number]
export type TrustCenterNode = NonNullable<TrustCenterEdge>['node']
export type TrustCenterSetting = NonNullable<TrustCenterNode>['setting']

export const useUpdateTrustCenterSetting = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateTrustCenterSettingMutation, Error, UpdateTrustCenterSettingMutationVariables>({
    mutationFn: async (variables) => {
      const { logoFile, faviconFile, ...rest } = variables
      if (logoFile || faviconFile) {
        return fetchGraphQLWithUpload({
          query: UPDATE_TRUST_CENTER_SETTING,
          variables: {
            ...rest,
            logoFile,
            faviconFile,
          },
        })
      }

      return client.request<UpdateTrustCenterSettingMutation, UpdateTrustCenterSettingMutationVariables>(UPDATE_TRUST_CENTER_SETTING, rest)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['trustCenter'],
      })
    },
  })
}
