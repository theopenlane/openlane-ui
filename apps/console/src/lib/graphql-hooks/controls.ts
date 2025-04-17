import { useMutation, useQuery } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { GET_ALL_CONTROLS, GET_CONTROL_BY_ID, SEARCH_CONTROLS, UPDATE_CONTROL } from '@repo/codegen/query/control'

import {
  Control,
  GetAllControlsQuery,
  GetAllControlsQueryVariables,
  GetControlByIdQuery,
  SearchControlsQuery,
  SearchControlsQueryVariables,
  UpdateControlMutation,
  UpdateControlMutationVariables,
} from '@repo/codegen/src/schema'
import { TPagination } from '@repo/ui/pagination-types'
import { useDebounce } from '@uidotdev/usehooks'

type UseGetAllControlsArgs = {
  where?: GetAllControlsQueryVariables['where']
  pagination?: TPagination | null
  orderBy?: GetAllControlsQueryVariables['orderBy']
  search?: string
}

export const useGetAllControls = ({ where, pagination, orderBy, search = '' }: UseGetAllControlsArgs) => {
  const { client } = useGraphQLClient()
  const debouncedSearch = useDebounce(search, 300)
  const showSearch = !!debouncedSearch

  const rawAllControlsQuery = useQuery<GetAllControlsQuery>({
    queryKey: ['controls', where, orderBy, pagination?.page, pagination?.pageSize],
    queryFn: () =>
      client.request(GET_ALL_CONTROLS, {
        where,
        orderBy,
        ...pagination?.query,
      }),
    enabled: where !== undefined,
  })

  const searchQuery = useQuery<SearchControlsQuery>({
    queryKey: ['searchControls', debouncedSearch, pagination?.page, pagination?.pageSize],
    queryFn: () =>
      client.request(SEARCH_CONTROLS, {
        query: debouncedSearch,
        ...pagination?.query,
      } as SearchControlsQueryVariables),
    enabled: showSearch,
  })

  const allControls = (rawAllControlsQuery.data?.controls?.edges ?? []).map((edge) => edge?.node) as Control[]
  const searchControls = (searchQuery.data?.controlSearch?.edges ?? []).map((edge) => edge?.node) as Control[]

  const filteredControls = showSearch ? allControls.filter((ctrl) => searchControls.some((s) => s.id === ctrl.id)) : allControls

  const isLoading = showSearch ? searchQuery.isLoading : rawAllControlsQuery.isLoading

  const paginationMeta = () => {
    if (!showSearch) {
      return {
        totalCount: rawAllControlsQuery.data?.controls?.totalCount ?? 0,
        pageInfo: rawAllControlsQuery.data?.controls?.pageInfo,
        isLoading,
      }
    }

    return {
      totalCount: searchQuery.data?.controlSearch?.totalCount ?? 0,
      pageInfo: searchQuery.data?.controlSearch?.pageInfo,
      isLoading,
    }
  }

  return {
    paginationMeta: paginationMeta(),
    ...(showSearch ? searchQuery : rawAllControlsQuery),
    controls: filteredControls,
    isLoading,
  }
}

export const useGetControlById = (controlId?: string | null) => {
  const { client } = useGraphQLClient()

  return useQuery<GetControlByIdQuery, unknown>({
    queryKey: ['controls', controlId],
    queryFn: async () => client.request(GET_CONTROL_BY_ID, { controlId }),
    enabled: !!controlId,
  })
}

export const useUpdateControl = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateControlMutation, unknown, UpdateControlMutationVariables>({
    mutationFn: async (variables) => client.request(UPDATE_CONTROL, variables),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['controls'] }),
  })
}
