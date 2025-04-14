import { useQuery, useMutation } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { GET_ALL_SUBSCRIBERS, DELETE_SUBSCRIBER, SEARCH_SUBSCRIBERS } from '@repo/codegen/query/subscribe'

import {
  GetAllSubscribersQuery,
  DeleteSubscriberMutation,
  DeleteSubscriberMutationVariables,
  GetAllSubscribersQueryVariables,
  Subscriber,
  SearchSubscribersQuery,
  SearchSubscribersQueryVariables,
} from '@repo/codegen/src/schema'
import { useDebounce } from '../../../../../packages/ui/src/hooks/use-debounce'
import { TPagination } from '@repo/ui/pagination-types'

type UseFilteredSubscribersArgs = {
  search?: string
  where?: GetAllSubscribersQueryVariables['where']
  orderBy?: GetAllSubscribersQueryVariables['orderBy']
  pagination?: TPagination
}

export const useFilteredSubscribers = ({ search, where, orderBy, pagination }: UseFilteredSubscribersArgs) => {
  const debouncedSearchTerm = useDebounce(search, 300) || ''

  const { subscribers: allSubscribers, isLoading: isFetchingAll, data: allData, ...allQueryRest } = useGetAllSubscribers({ where, orderBy, pagination })

  const { subscribers: searchSubscribersRaw, isLoading: isSearching, data: searchData, ...searchQueryRest } = useSearchSubscribers({ search: debouncedSearchTerm, pagination })

  const showSearch = !!debouncedSearchTerm
  const isLoading = showSearch ? isSearching : isFetchingAll

  const filteredAndOrderedSubscribers = showSearch ? allSubscribers?.filter((sub) => searchSubscribersRaw?.some((searchSub) => searchSub.id === sub.id)) : allSubscribers

  const paginationMeta = () => {
    if (!showSearch) {
      return {
        totalCount: allData?.subscribers?.totalCount ?? 0,
        pageInfo: allData?.subscribers?.pageInfo,
        isLoading,
      }
    }

    return {
      totalCount: searchData?.subscriberSearch?.totalCount ?? 0,
      pageInfo: searchData?.subscriberSearch?.pageInfo,
      isLoading,
    }
  }

  return {
    subscribers: filteredAndOrderedSubscribers,
    isLoading,
    paginationMeta: paginationMeta(),
    ...(showSearch ? searchQueryRest : allQueryRest),
  }
}

type UseGetAllSubscribersArgs = {
  where?: GetAllSubscribersQueryVariables['where']
  orderBy?: GetAllSubscribersQueryVariables['orderBy']
  pagination?: TPagination
}

export const useGetAllSubscribers = ({ where, orderBy, pagination }: UseGetAllSubscribersArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetAllSubscribersQuery>({
    queryKey: ['subscribers', where, orderBy, pagination?.pageSize, pagination?.page],
    queryFn: () =>
      client.request(GET_ALL_SUBSCRIBERS, {
        where,
        orderBy,
        ...pagination?.query,
      }),
  })

  const subscribers = (queryResult.data?.subscribers?.edges?.map((edge) => edge?.node) ?? []) as Subscriber[]

  return { ...queryResult, subscribers }
}

export function useSearchSubscribers({ search, pagination }: { search: string; pagination?: TPagination }) {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<SearchSubscribersQuery, unknown>({
    queryKey: ['searchSubscribers', search, pagination?.pageSize, pagination?.page],
    queryFn: async () =>
      client.request<SearchSubscribersQuery, SearchSubscribersQueryVariables>(SEARCH_SUBSCRIBERS, {
        query: search,
        ...pagination?.query,
      }),
    enabled: !!search,
  })

  const subscribers = (queryResult.data?.subscriberSearch ?? []) as Subscriber[]

  return { ...queryResult, subscribers }
}

export const useDeleteSubscriber = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteSubscriberMutation, unknown, DeleteSubscriberMutationVariables>({
    mutationFn: (variables) => client.request(DELETE_SUBSCRIBER, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscribers'] })
    },
  })
}
