import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  CREATE_CUSTOM_DOMAIN,
  DELETE_CUSTOM_DOMAIN,
  GET_ALL_TRUST_CENTERS,
  GET_ALL_TRUST_CENTER_LAST_UPDATED,
  GET_ALL_TRUST_CENTER_POSTS,
  UPDATE_TRUST_CENTER,
  UPDATE_TRUST_CENTER_POST,
  UPDATE_TRUST_CENTER_SETTING,
  UPDATE_TRUST_CENTER_WATERMARK_CONFIG,
  VALIDATE_CUSTOM_DOMAIN,
} from '@repo/codegen/query/trust-center'
import {
  CreateCustomDomainMutation,
  CreateCustomDomainMutationVariables,
  GetTrustCenterPostsQuery,
  GetTrustCenterPostsQueryVariables,
  GetTrustCenterQuery,
  TrustCenterLastUpdatedQuery,
  TrustCenterLastUpdatedQueryVariables,
  UpdateTrustCenterMutation,
  UpdateTrustCenterMutationVariables,
  UpdateTrustCenterPostMutation,
  UpdateTrustCenterPostMutationVariables,
  UpdateTrustCenterSettingMutation,
  UpdateTrustCenterSettingMutationVariables,
  UpdateTrustCenterWatermarkConfigMutation,
  UpdateTrustCenterWatermarkConfigMutationVariables,
} from '@repo/codegen/src/schema'
import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchGraphQLWithUpload } from '../fetchGraphql'
import { TPagination } from '@repo/ui/pagination-types'

export const useGetTrustCenter = () => {
  const { client } = useGraphQLClient()

  return useQuery({
    queryKey: ['trustCenter'],
    queryFn: async () => client.request<GetTrustCenterQuery>(GET_ALL_TRUST_CENTERS),
  })
}

export type TrustCenterEdge = NonNullable<NonNullable<GetTrustCenterQuery['trustCenters']>['edges']>[number]
export type TrustCenterNode = NonNullable<NonNullable<NonNullable<GetTrustCenterQuery['trustCenters']>['edges']>[number]>['node']
export type TrustCenterSetting = NonNullable<TrustCenterNode>['setting'] | null | undefined
export type TrustCenterWatermarkConfig = NonNullable<TrustCenterNode>['watermarkConfig']
export type TrustCenterPreviewSetting = NonNullable<NonNullable<TrustCenterNode>['previewSetting']> | null | undefined

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

export const useCreateCustomDomain = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateCustomDomainMutation, Error, CreateCustomDomainMutationVariables>({
    mutationFn: async (variables) => {
      return client.request<CreateCustomDomainMutation, CreateCustomDomainMutationVariables>(CREATE_CUSTOM_DOMAIN, variables)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['trustCenter'],
      })
    },
  })
}

export function useDeleteCustomDomain() {
  const { client, queryClient } = useGraphQLClient()

  return useMutation({
    mutationFn: async (variables: { deleteCustomDomainId: string }) => {
      return await client.request(DELETE_CUSTOM_DOMAIN, variables)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['trustCenter'],
      })
    },
  })
}

export function useValidateCustomDomain() {
  const { client, queryClient } = useGraphQLClient()

  return useMutation({
    mutationFn: async (variables: { validateCustomDomainId: string }) => {
      return await client.request(VALIDATE_CUSTOM_DOMAIN, variables)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['trustCenter'],
      })
    },
  })
}

export const useUpdateTrustCenterWatermarkConfig = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateTrustCenterWatermarkConfigMutation, unknown, UpdateTrustCenterWatermarkConfigMutationVariables>({
    mutationFn: async (variables) => {
      const { updateTrustCenterWatermarkConfigId, input, watermarkFile } = variables

      if (watermarkFile) {
        return fetchGraphQLWithUpload({
          query: UPDATE_TRUST_CENTER_WATERMARK_CONFIG,
          variables: {
            updateTrustCenterWatermarkConfigId,
            input,
            watermarkFile,
          },
        })
      }

      return client.request<UpdateTrustCenterWatermarkConfigMutation, UpdateTrustCenterWatermarkConfigMutationVariables>(UPDATE_TRUST_CENTER_WATERMARK_CONFIG, {
        updateTrustCenterWatermarkConfigId,
        input,
      })
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['trustCenter'],
      })
    },
  })
}

type UseGetTrustCenterPostsArgs = {
  trustCenterId: string
  enabled?: boolean
}

export const useGetTrustCenterPosts = ({ trustCenterId, enabled = true }: UseGetTrustCenterPostsArgs) => {
  const { client } = useGraphQLClient()

  return useQuery<GetTrustCenterPostsQuery>({
    queryKey: ['trustCenter', 'posts'],
    queryFn: () =>
      client.request<GetTrustCenterPostsQuery, GetTrustCenterPostsQueryVariables>(GET_ALL_TRUST_CENTER_POSTS, {
        trustCenterId,
      }),
    enabled: !!trustCenterId && enabled,
  })
}

export const useUpdateTrustCenter = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateTrustCenterMutation, Error, UpdateTrustCenterMutationVariables>({
    mutationFn: async (variables) => {
      return client.request<UpdateTrustCenterMutation, UpdateTrustCenterMutationVariables>(UPDATE_TRUST_CENTER, variables)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['trustCenter'],
      })
    },
  })
}

export const useUpdateTrustCenterPost = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateTrustCenterPostMutation, Error, UpdateTrustCenterPostMutationVariables>({
    mutationFn: async (variables) => {
      return client.request<UpdateTrustCenterPostMutation, UpdateTrustCenterPostMutationVariables>(UPDATE_TRUST_CENTER_POST, variables)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['trustCenter', 'posts'],
      })
    },
  })
}

type UseGetTrustCenterLastUpdated = {
  trustCenterId: string
  enabled?: boolean
}

export const useGetTrustCenterLastUpdated = ({ trustCenterId, enabled }: UseGetTrustCenterLastUpdated) => {
  const { client } = useGraphQLClient()

  return useQuery<TrustCenterLastUpdatedQuery>({
    queryKey: ['trustCenterLastUpdated', trustCenterId],
    queryFn: () =>
      client.request<TrustCenterLastUpdatedQuery, TrustCenterLastUpdatedQueryVariables>(GET_ALL_TRUST_CENTER_LAST_UPDATED, {
        trustCenterId,
      }),
    enabled: !!trustCenterId || !enabled,
  })
}
