import { useQuery, useMutation } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { CREATE_SUBSCRIBER, GET_ALL_SUBSCRIBERS, DELETE_SUBSCRIBER } from '@repo/codegen/query/subscribe' // adjust path as needed

import { CreateSubscriberMutation, CreateSubscriberMutationVariables, GetAllSubscribersQuery, DeleteSubscriberMutation, DeleteSubscriberMutationVariables } from '@repo/codegen/src/schema'

export const useGetAllSubscribers = () => {
  const { client } = useGraphQLClient()

  return useQuery<GetAllSubscribersQuery>({
    queryKey: ['subscribers'],
    queryFn: () => client.request(GET_ALL_SUBSCRIBERS),
  })
}

export const useCreateSubscriber = () => {
  const { client, queryClient } = useGraphQLClient()

  return useMutation<CreateSubscriberMutation, unknown, CreateSubscriberMutationVariables>({
    mutationFn: (variables) => client.request(CREATE_SUBSCRIBER, variables),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscribers'] }),
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
