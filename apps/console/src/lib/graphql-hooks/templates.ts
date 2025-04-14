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
import { TPagination } from '@repo/ui/pagination-types'

export const useGetAllTemplates = () => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllTemplatesQuery>({
    queryKey: ['templates', 'all'],
    queryFn: () => client.request(GET_ALL_TEMPLATES),
  })
}

type UseFilteredTemplatesArgs = {
  search: string
  where?: FilterTemplatesQueryVariables['where']
  orderBy?: FilterTemplatesQueryVariables['orderBy']
  pagination?: TPagination
}

export const useFilteredTemplates = ({ search, where, orderBy, pagination }: UseFilteredTemplatesArgs) => {
  const debouncedSearchTerm = useDebounce(search, 300)

  const { templates: allTemplates, isLoading: isFetchingAll, data: allData, ...allQueryRest } = useFilterTemplates({ where, orderBy, pagination })

  const { templates: searchTemplatesRaw, isLoading: isSearching, data: searchData, ...searchQueryRest } = useSearchTemplates({ search: debouncedSearchTerm, pagination })

  const showSearch = !!debouncedSearchTerm
  const isLoading = showSearch ? isSearching : isFetchingAll

  const filteredAndOrderedTemplates = showSearch ? allTemplates?.filter((template) => searchTemplatesRaw?.some((searchTemplate) => searchTemplate.id === template.id)) : allTemplates

  const paginationMeta = () => {
    if (!showSearch) {
      return {
        totalCount: allData?.templates?.totalCount ?? 0,
        pageInfo: allData?.templates?.pageInfo,
        isLoading,
      }
    }

    return {
      totalCount: searchData?.templateSearch?.totalCount ?? 0,
      pageInfo: searchData?.templateSearch?.pageInfo,
      isLoading,
    }
  }

  return {
    templates: filteredAndOrderedTemplates,
    isLoading,
    paginationMeta: paginationMeta(),
    ...(showSearch ? searchQueryRest : allQueryRest),
  }
}

export function useSearchTemplates({ search, pagination }: { search: string; pagination?: TPagination }) {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<SearchTemplatesQuery, unknown>({
    queryKey: ['searchTemplates', search, pagination?.pageSize, pagination?.page],
    queryFn: async () =>
      client.request<SearchTemplatesQuery, SearchTemplatesQueryVariables>(SEARCH_TEMPLATE, {
        query: search,
        ...pagination?.query,
      }),
    enabled: !!search,
  })

  const templates = (queryResult.data?.templateSearch ?? []) as Template[]

  return { ...queryResult, templates }
}

type useFilterTemplatesArgs = {
  where?: FilterTemplatesQueryVariables['where']
  orderBy?: FilterTemplatesQueryVariables['orderBy']
  pagination?: TPagination
}

export const useFilterTemplates = ({ where, orderBy, pagination }: useFilterTemplatesArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<FilterTemplatesQuery>({
    queryKey: ['templates', where, orderBy, pagination?.pageSize, pagination?.page],
    queryFn: () => client.request(FILTER_TEMPLATES, { where, orderBy, ...pagination?.query }),
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
