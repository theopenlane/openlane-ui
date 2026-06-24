import { useQuery, useMutation } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { GET_ALL_SUBSCRIBERS, DELETE_SUBSCRIBER, UPDATE_SUBSCRIBER, CREATE_CSV_BULK_SUBSCRIBER } from '@repo/codegen/query/subscriber'

import {
  type GetAllSubscribersQuery,
  type DeleteSubscriberMutation,
  type DeleteSubscriberMutationVariables,
  type GetAllSubscribersQueryVariables,
  type Subscriber,
  type UpdateSubscriberMutation,
  type UpdateSubscriberMutationVariables,
  type CreateBulkCsvSubscriberMutation,
  type CreateBulkCsvSubscriberMutationVariables,
} from '@repo/codegen/src/schema'
import { type TPagination } from '@repo/ui/pagination-types'
import { fetchGraphQLWithUpload } from '@/lib/fetchGraphql.ts'

type UseGetAllSubscribersArgs = {
  where?: GetAllSubscribersQueryVariables['where']
  orderBy?: GetAllSubscribersQueryVariables['orderBy']
  pagination?: TPagination
  enabled?: boolean
}

export const useGetAllSubscribers = ({ where, orderBy, pagination, enabled = true }: UseGetAllSubscribersArgs) => {
  const { client } = useGraphQLClient()

  const queryResult = useQuery<GetAllSubscribersQuery>({
    queryKey: ['subscribers', where, orderBy, pagination?.pageSize, pagination?.page],
    queryFn: () =>
      client.request(GET_ALL_SUBSCRIBERS, {
        where,
        orderBy,
        ...pagination?.query,
      }),
    enabled,
  })

  const subscribers = (queryResult.data?.subscribers?.edges ?? []).map((edge) => edge?.node) as Subscriber[]

  const paginationMeta = {
    totalCount: queryResult.data?.subscribers?.totalCount ?? 0,
    pageInfo: queryResult.data?.subscribers?.pageInfo,
    isLoading: queryResult.isPending,
  }

  return {
    ...queryResult,
    subscribers,
    paginationMeta,
    isLoading: queryResult.isPending,
  }
}

export const useDeleteSubscriber = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<DeleteSubscriberMutation, Error, DeleteSubscriberMutationVariables>({
    mutationFn: (variables) => client.request(DELETE_SUBSCRIBER, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscribers'] })
    },
  })
}

export const useUpdateSubscriber = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<UpdateSubscriberMutation, Error, UpdateSubscriberMutationVariables>({
    mutationFn: (variables) => client.request(UPDATE_SUBSCRIBER, variables),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscribers'] })
    },
  })
}

export const useCreateBulkCSVSubscriber = () => {
  const { queryClient } = useGraphQLClient()

  return useMutation<CreateBulkCsvSubscriberMutation, Error, CreateBulkCsvSubscriberMutationVariables>({
    mutationFn: async (variables) => fetchGraphQLWithUpload({ query: CREATE_CSV_BULK_SUBSCRIBER, variables }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscribers'] })
    },
  })
}
