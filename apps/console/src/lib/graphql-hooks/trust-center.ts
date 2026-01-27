import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import {
  BULK_DELETE_TRUST_CENTER_DOC,
  BULK_UPDATE_TRUST_CENTER_DOC,
  CREATE_CUSTOM_DOMAIN,
  CREATE_TRUST_CENTER_DOC,
  DELETE_CUSTOM_DOMAIN,
  DELETE_TRUST_CENTER_DOC,
  GET_TRUST_CENTER,
  GET_TRUST_CENTER_DOC_BY_ID,
  GET_TRUST_CENTER_DOCS,
  GET_TRUST_CENTER_LAST_UPDATED,
  GET_TRUST_CENTER_POSTS,
  UPDATE_TRUST_CENTER,
  UPDATE_TRUST_CENTER_DOC,
  UPDATE_TRUST_CENTER_POST,
  UPDATE_TRUST_CENTER_SETTING,
  UPDATE_TRUST_CENTER_WATERMARK_CONFIG,
  VALIDATE_CUSTOM_DOMAIN,
} from '@repo/codegen/query/trust-center'
import {
  BulkDeleteTrustCenterDocMutation,
  BulkDeleteTrustCenterDocMutationVariables,
  BulkUpdateTrustCenterDocMutation,
  BulkUpdateTrustCenterDocMutationVariables,
  CreateCustomDomainMutation,
  CreateCustomDomainMutationVariables,
  CreateTrsutCenterDocMutation,
  CreateTrsutCenterDocMutationVariables,
  DeleteTrustCenterDocMutation,
  DeleteTrustCenterDocMutationVariables,
  GetTruestCenterDocByIdQuery,
  GetTruestCenterDocByIdQueryVariables,
  GetTrustCenterDocsQuery,
  GetTrustCenterDocsQueryVariables,
  GetTrustCenterPostsQuery,
  GetTrustCenterPostsQueryVariables,
  GetTrustCenterQuery,
  TrustCenterLastUpdatedQuery,
  TrustCenterLastUpdatedQueryVariables,
  UpdateTrustCenterDocMutation,
  UpdateTrustCenterDocMutationVariables,
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
    queryFn: async () => client.request<GetTrustCenterQuery>(GET_TRUST_CENTER),
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

type UseGetTrustCenterDocsArgs = {
  where?: GetTrustCenterDocsQueryVariables['where']
  pagination?: TPagination | null
  orderBy?: GetTrustCenterDocsQueryVariables['orderBy']
  enabled?: boolean
}

export const useGetTrustCenterDocs = ({ where, pagination, orderBy, enabled = true }: UseGetTrustCenterDocsArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetTrustCenterDocsQuery>({
    queryKey: ['trustCenter', 'docs', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: () =>
      client.request<GetTrustCenterDocsQuery, GetTrustCenterDocsQueryVariables>(GET_TRUST_CENTER_DOCS, {
        where,
        orderBy,
        ...pagination?.query,
      }),
    enabled,
  })

  const edges = queryResult.data?.trustCenters?.edges?.[0]?.node?.trustCenterDocs?.edges ?? []
  const docs = edges.map((edge) => edge?.node)
  const paginationMeta = {
    totalCount: queryResult.data?.trustCenters?.edges?.[0]?.node?.trustCenterDocs?.totalCount ?? 0,
    pageInfo: queryResult.data?.trustCenters?.edges?.[0]?.node?.trustCenterDocs?.pageInfo ?? {},
    isLoading: queryResult.isFetching,
  }

  return {
    ...queryResult,
    docs,
    paginationMeta,
  }
}

export const useCreateTrustCenterDoc = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateTrsutCenterDocMutation, unknown, CreateTrsutCenterDocMutationVariables>({
    mutationFn: async (variables) =>
      fetchGraphQLWithUpload({
        query: CREATE_TRUST_CENTER_DOC,
        variables,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['trustCenter', 'docs'],
      })
    },
  })
}

export const useUpdateTrustCenterDoc = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateTrustCenterDocMutation, unknown, UpdateTrustCenterDocMutationVariables>({
    mutationFn: async (variables) => {
      const { input, updateTrustCenterDocId, trustCenterDocFile } = variables as UpdateTrustCenterDocMutationVariables & {
        trustCenterDocFile?: File
      }
      if (trustCenterDocFile) {
        return fetchGraphQLWithUpload({
          query: UPDATE_TRUST_CENTER_DOC,
          variables: {
            input,
            updateTrustCenterDocId,
            trustCenterDocFile,
          },
        })
      }
      return client.request<UpdateTrustCenterDocMutation, UpdateTrustCenterDocMutationVariables>(UPDATE_TRUST_CENTER_DOC, variables)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['trustCenter', 'docs'],
      })
    },
  })
}

type UseGetTrustCenterDocByIdArgs = {
  trustCenterDocId: string
  enabled?: boolean
}

export const useGetTrustCenterDocById = ({ trustCenterDocId, enabled = true }: UseGetTrustCenterDocByIdArgs) => {
  const { client } = useGraphQLClient()

  return useQuery<GetTruestCenterDocByIdQuery>({
    queryKey: ['trustCenter', 'docs', trustCenterDocId],

    queryFn: async () =>
      client.request<GetTruestCenterDocByIdQuery, GetTruestCenterDocByIdQueryVariables>(GET_TRUST_CENTER_DOC_BY_ID, {
        trustCenterDocId,
      }),
    enabled: !!trustCenterDocId && enabled,
  })
}

export const useDeleteTrustCenterDoc = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteTrustCenterDocMutation, unknown, DeleteTrustCenterDocMutationVariables>({
    mutationFn: async (variables) => client.request<DeleteTrustCenterDocMutation, DeleteTrustCenterDocMutationVariables>(DELETE_TRUST_CENTER_DOC, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['trustCenter', 'docs'],
      })
    },
  })
}

export const useBulkDeleteTrustCenterDocs = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<BulkDeleteTrustCenterDocMutation, unknown, BulkDeleteTrustCenterDocMutationVariables>({
    mutationFn: async (variables) => {
      return await client.request<BulkDeleteTrustCenterDocMutation, BulkDeleteTrustCenterDocMutationVariables>(BULK_DELETE_TRUST_CENTER_DOC, variables)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['trustCenter', 'docs'],
      })
    },
  })
}

export const useBulkUpdateTrustCenterDocs = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<BulkUpdateTrustCenterDocMutation, unknown, BulkUpdateTrustCenterDocMutationVariables>({
    mutationFn: async (variables) => client.request(BULK_UPDATE_TRUST_CENTER_DOC, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustCenter', 'docs'] })
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
      client.request<GetTrustCenterPostsQuery, GetTrustCenterPostsQueryVariables>(GET_TRUST_CENTER_POSTS, {
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
      client.request<TrustCenterLastUpdatedQuery, TrustCenterLastUpdatedQueryVariables>(GET_TRUST_CENTER_LAST_UPDATED, {
        trustCenterId,
      }),
    enabled: !!trustCenterId || !enabled,
  })
}
