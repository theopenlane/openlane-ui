import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'

import { CREATE_TEMPLATE, UPDATE_TEMPLATE, GET_ALL_TEMPLATES, FILTER_TEMPLATES, GET_TEMPLATE, DELETE_TEMPLATE, SEARCH_TEMPLATE } from '@repo/codegen/query/template'

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
  SearchTemplatesQuery,
  SearchTemplatesQueryVariables,
  Template,
} from '@repo/codegen/src/schema'
import { useDebounce } from '../../../../../packages/ui/src/hooks/use-debounce'

export const useGetAllTemplates = () => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllTemplatesQuery>({
    queryKey: ['templates', 'all'],
    queryFn: () => client.request(GET_ALL_TEMPLATES),
  })
}

export const useFilteredTemplates = (searchQuery: string, where?: FilterTemplatesQueryVariables['where'], orderBy?: FilterTemplatesQueryVariables['orderBy']) => {
  const debouncedSearchTerm = useDebounce(searchQuery, 300)
  const { templates: allTemplates, isLoading: isFetchingAll, ...allQueryRest } = useFilterTemplates(where, orderBy)
  const { templates: searchTemplatesRaw, isLoading: isSearching, ...searchQueryRest } = useSearchTemplates(debouncedSearchTerm)
  const showSearch = !!debouncedSearchTerm
  const filteredAndOrderedTemplates = showSearch ? allTemplates?.filter((proc) => searchTemplatesRaw?.some((searchProc) => searchProc.id === proc.id)) : allTemplates
  const isLoading = showSearch ? isSearching : isFetchingAll

  return {
    templates: filteredAndOrderedTemplates,
    isLoading,
    ...(showSearch ? searchQueryRest : allQueryRest),
  }
}

export function useSearchTemplates(searchQuery: string) {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<SearchTemplatesQuery, unknown>({
    queryKey: ['searchTemplates', searchQuery],
    queryFn: async () =>
      client.request<SearchTemplatesQuery, SearchTemplatesQueryVariables>(SEARCH_TEMPLATE, {
        query: searchQuery,
      }),
    enabled: !!searchQuery,
  })

  const templates = (queryResult.data?.templateSearch?.templates ?? []) as Template[]

  return { ...queryResult, templates }
}

export const useFilterTemplates = (where?: FilterTemplatesQueryVariables['where'], orderBy?: FilterTemplatesQueryVariables['orderBy']) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<FilterTemplatesQuery>({
    queryKey: ['templates', 'filter', { where, orderBy }],
    queryFn: () => client.request(FILTER_TEMPLATES, { where, orderBy }),
    enabled: where !== undefined,
  })

  const templates = (queryResult.data?.templates?.edges?.map((edge) => edge?.node) ?? []) as Template[]

  return { ...queryResult, templates }
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
