import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'

import { CREATE_TEMPLATE, UPDATE_TEMPLATE, GET_ALL_TEMPLATES, GET_TEMPLATE, DELETE_TEMPLATE, SEARCH_TEMPLATE } from '@repo/codegen/query/template'

import {
  CreateTemplateMutation,
  CreateTemplateMutationVariables,
  UpdateTemplateMutation,
  UpdateTemplateMutationVariables,
  FilterTemplatesQuery,
  FilterTemplatesQueryVariables,
  GetTemplateQuery,
  GetTemplateQueryVariables,
  DeleteTemplateMutation,
  DeleteTemplateMutationVariables,
  Template,
} from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'

type UseTemplatesArgs = {
  where?: FilterTemplatesQueryVariables['where']
  orderBy?: FilterTemplatesQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useTemplates = ({ where, orderBy, pagination, enabled = true }: UseTemplatesArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<FilterTemplatesQuery>({
    queryKey: ['templates', where, orderBy, pagination?.pageSize, pagination?.page],
    queryFn: () =>
      client.request(GET_ALL_TEMPLATES, {
        where,
        orderBy,
        ...pagination?.query,
      }),
    enabled,
  })

  const templates = (queryResult.data?.templates?.edges ?? []).map((edge) => edge?.node) as Template[]

  const paginationMeta = {
    totalCount: queryResult.data?.templates?.totalCount ?? 0,
    pageInfo: queryResult.data?.templates?.pageInfo,
    isLoading: queryResult.isFetching,
  }

  return {
    ...queryResult,
    templates,
    paginationMeta,
    isLoading: queryResult.isFetching,
  }
}

export const useGetTemplate = (getTemplateId?: string) => {
  const { client } = useGraphQLClient()

  return useQuery<GetTemplateQuery, GetTemplateQueryVariables>({
    queryKey: ['templates', getTemplateId],
    queryFn: () => client.request(GET_TEMPLATE, { getTemplateId }),
    enabled: !!getTemplateId,
  })
}

export const useCreateTemplate = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateTemplateMutation, unknown, CreateTemplateMutationVariables>({
    mutationFn: (variables) => client.request(CREATE_TEMPLATE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}

export const useUpdateTemplate = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateTemplateMutation, unknown, UpdateTemplateMutationVariables>({
    mutationFn: (variables) => client.request(UPDATE_TEMPLATE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}

export const useDeleteTemplate = () => {
  const { client } = useGraphQLClient()
  const queryClient = useQueryClient()

  return useMutation<DeleteTemplateMutation, unknown, DeleteTemplateMutationVariables>({
    mutationFn: (variables) => client.request(DELETE_TEMPLATE, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}
