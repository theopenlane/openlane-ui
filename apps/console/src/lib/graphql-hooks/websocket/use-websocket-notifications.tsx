'use client'

import { useSubscription } from '@/lib/subscription-plan/hooks/use-subscription'
import { useQueryClient, useQuery } from '@tanstack/react-query'

export interface NotificationData {
  url?: string
  entityId?: string
  entityType?: string
  priority?: 'low' | 'medium' | 'high'
  [key: string]: unknown
}

export type NotificationObjectType = 'Program' | 'Task' | 'Evidence' | 'Group' | 'Internal Policy' | 'Procedure' | 'Risk' | 'Questionnaire' | 'Evidence'

export interface Notification {
  id: string
  title: string
  body: string
  topic: string
  data?: NotificationData
  readAt?: string | null
  objectType: NotificationObjectType
}

interface SubscriptionPayload {
  notificationCreated: Notification
}

const NOTIFICATION_SUBSCRIPTION = `
  subscription {
    notificationCreated {
      id
      body
      topic
      title
      data
      readAt
      objectType
    }
  }
`

export function useWebsocketNotifications() {
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => [],
    staleTime: Infinity,
  })

  useSubscription<SubscriptionPayload>({
    query: NOTIFICATION_SUBSCRIPTION,
    onData: (data) => {
      const newNotification = data.notificationCreated
      if (newNotification) {
        queryClient.setQueryData<Notification[]>(['notifications'], (old = []) => {
          if (old.some((n) => n.id === newNotification.id)) return old
          return [newNotification, ...old]
        })
      }
    },
  })

  return {
    notifications,
    isLoading,
  }
}
