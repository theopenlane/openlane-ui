import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'

import { CREATE_TEMPLATE, UPDATE_TEMPLATE, GET_ALL_TEMPLATES, FILTER_TEMPLATES, GET_TEMPLATE, DELETE_TEMPLATE } from '@repo/codegen/query/template'

import {
  CreateTemplateMutation,
  CreateTemplateMutationVariables,
  UpdateTemplateMutation,
  UpdateTemplateMutationVariables,
  GetAllTemplatesQuery,
  FilterTemplatesQuery,
  FilterTemplatesQueryVariables,
  GetTemplateQuery,
  GetTemplateQueryVariables,
  DeleteTemplateMutation,
  DeleteTemplateMutationVariables,
} from '@repo/codegen/src/schema'

export const useGetAllTemplates = () => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllTemplatesQuery>({
    queryKey: ['templates', 'all'],
    queryFn: () => client.request(GET_ALL_TEMPLATES),
  })
}

export const useFilterTemplates = (where?: FilterTemplatesQueryVariables['where']) => {
  const { client } = useGraphQLClient()

  return useQuery<FilterTemplatesQuery>({
    queryKey: ['templates', 'filter', where],
    queryFn: () => client.request(FILTER_TEMPLATES, { where }),
    enabled: where !== undefined,
  })
}

export const useGetTemplate = (getTemplateId?: string) => {
  const { client } = useGraphQLClient()

  return useQuery<GetTemplateQuery, GetTemplateQueryVariables>({
    queryKey: ['template', getTemplateId],
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
