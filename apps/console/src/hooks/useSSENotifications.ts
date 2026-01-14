import { useEffect } from 'react'
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

interface SSESubscriptionPayload {
  data: {
    notificationCreated: Notification
  }
}

export function useSSENotifications() {
  const queryClient = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => [],
    staleTime: Infinity,
  })

  useEffect(() => {
    const eventSource = new EventSource('/api/notifications')

    const handleMessage = (event: MessageEvent) => {
      try {
        const payload: SSESubscriptionPayload = JSON.parse(event.data)
        const newNotification = payload?.data?.notificationCreated

        if (newNotification) {
          queryClient.setQueryData<Notification[]>(['notifications'], (old = []) => {
            if (old.some((n) => n.id === newNotification.id)) return old
            return [newNotification, ...old]
          })
        }
      } catch (e: unknown) {
        console.error('SSE nofitication error:', e)
      }
    }

    eventSource.onmessage = handleMessage
    eventSource.addEventListener('next', handleMessage as EventListener)

    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => {
      eventSource.removeEventListener('next', handleMessage as EventListener)
      eventSource.close()
    }
  }, [queryClient])

  return {
    notifications,
    isLoading,
  }
}
