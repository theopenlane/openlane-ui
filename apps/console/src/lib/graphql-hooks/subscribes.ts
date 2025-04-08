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

export const useFilteredSubscribers = (searchQuery: string, where?: GetAllSubscribersQueryVariables['where'], orderBy?: GetAllSubscribersQueryVariables['orderBy']) => {
  const debouncedSearchTerm = useDebounce(searchQuery, 300)
  const { subscribers: allSubscribers, isLoading: isFetchingAll, ...allQueryRest } = useGetAllSubscribers(where, orderBy)
  const { subscribers: searchSubscribersRaw, isLoading: isSearching, ...searchQueryRest } = useSearchSubscribers(debouncedSearchTerm)
  const showSearch = !!debouncedSearchTerm
  const filteredAndOrderedSubscribers = showSearch ? allSubscribers?.filter((proc) => searchSubscribersRaw?.some((searchProc) => searchProc.id === proc.id)) : allSubscribers
  const isLoading = showSearch ? isSearching : isFetchingAll

  return {
    subscribers: filteredAndOrderedSubscribers,
    isLoading,
    ...(showSearch ? searchQueryRest : allQueryRest),
  }
}

export const useGetAllSubscribers = (where?: GetAllSubscribersQueryVariables['where'], orderBy?: GetAllSubscribersQueryVariables['orderBy']) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetAllSubscribersQuery>({
    queryKey: ['subscribers', { where, orderBy }],
    queryFn: () => client.request(GET_ALL_SUBSCRIBERS, { where, orderBy }),
  })

  const subscribers = (queryResult.data?.subscribers?.edges?.map((edge) => edge?.node) ?? []) as Subscriber[]

  return { ...queryResult, subscribers }
}

export function useSearchSubscribers(searchQuery: string) {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<SearchSubscribersQuery, unknown>({
    queryKey: ['searchSubscribers', searchQuery],
    queryFn: async () =>
      client.request<SearchSubscribersQuery, SearchSubscribersQueryVariables>(SEARCH_SUBSCRIBERS, {
        query: searchQuery,
      }),
    enabled: !!searchQuery,
  })

  const subscribers = (queryResult.data?.subscriberSearch?.subscribers ?? []) as Subscriber[]

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
