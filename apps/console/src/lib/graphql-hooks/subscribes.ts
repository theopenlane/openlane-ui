import { useQuery, useMutation } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { GET_ALL_SUBSCRIBERS, DELETE_SUBSCRIBER } from '@repo/codegen/query/subscribe'

import { GetAllSubscribersQuery, DeleteSubscriberMutation, DeleteSubscriberMutationVariables, GetAllSubscribersQueryVariables } from '@repo/codegen/src/schema'

export const useGetAllSubscribers = (where?: GetAllSubscribersQueryVariables['where'], orderBy?: GetAllSubscribersQueryVariables['orderBy']) => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllSubscribersQuery>({
    queryKey: ['subscribers', { where, orderBy }],
    queryFn: () => client.request(GET_ALL_SUBSCRIBERS, { where, orderBy }),
  })
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
