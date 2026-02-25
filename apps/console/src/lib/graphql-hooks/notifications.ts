import { useMutation } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { MARK_NOTIFICATIONS_AS_READ } from '@repo/codegen/query/notifications'
import { MarkNotificationsAsReadMutation, MarkNotificationsAsReadMutationVariables } from '@repo/codegen/src/schema'

export const useMarkNotificationsAsRead = () => {
  const { client } = useGraphQLClient()

  return useMutation<MarkNotificationsAsReadMutation, unknown, MarkNotificationsAsReadMutationVariables>({
    mutationFn: async (variables) => client.request(MARK_NOTIFICATIONS_AS_READ, variables),
  })
}
