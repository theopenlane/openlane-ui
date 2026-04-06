import { useMutation } from '@tanstack/react-query'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { MARK_NOTIFICATIONS_AS_READ } from '@repo/codegen/query/notifications'
import { type Notification as SchemaNotification, type MarkNotificationsAsReadMutation, type MarkNotificationsAsReadMutationVariables } from '@repo/codegen/src/schema'

export type Notification = Pick<SchemaNotification, 'id' | 'title' | 'body' | 'topic' | 'data' | 'readAt' | 'objectType' | 'createdAt'>

export const useMarkNotificationsAsRead = () => {
  const { client } = useGraphQLClient()

  return useMutation<MarkNotificationsAsReadMutation, unknown, MarkNotificationsAsReadMutationVariables>({
    mutationFn: async (variables) => client.request(MARK_NOTIFICATIONS_AS_READ, variables),
  })
}
