import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'

import { CREATE_TEMPLATE, UPDATE_TEMPLATE, GET_ALL_TEMPLATES, GET_TEMPLATE, DELETE_TEMPLATE, CREATE_CSV_BULK_TEMPLATE } from '@repo/codegen/query/template'

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
  CreateBulkCsvTemplateMutation,
  CreateBulkCsvTemplateMutationVariables,
} from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql'

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

  const templates = useMemo(() => (queryResult.data?.templates?.edges ?? []).map((edge) => edge?.node) as Template[], [queryResult.data?.templates?.edges])

  const paginationMeta = useMemo(
    () => ({
      totalCount: queryResult.data?.templates?.totalCount ?? 0,
      pageInfo: queryResult.data?.templates?.pageInfo,
      isLoading: queryResult.isFetching,
    }),
    [queryResult.data?.templates?.totalCount, queryResult.data?.templates?.pageInfo, queryResult.isFetching],
  )

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
    mutationFn: async (variables) => {
      if (variables.templateFiles) {
        return fetchGraphQLWithUpload({ query: UPDATE_TEMPLATE, variables })
      }
      return client.request<UpdateTemplateMutation>(UPDATE_TEMPLATE, variables)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      queryClient.invalidateQueries({ queryKey: ['trustCenterNdaFiles'] })
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

export const useCreateBulkCSVTemplate = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvTemplateMutation, unknown, CreateBulkCsvTemplateMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_TEMPLATE, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })
}

export const useTemplateSelect = ({ where }: { where?: FilterTemplatesQueryVariables['where'] }) => {
  const { templates, ...rest } = useTemplates({ where })

  const templateOptions =
    templates?.map((template) => ({
      label: template.name,
      value: template.id,
    })) ?? []

  return { templateOptions, ...rest }
}
