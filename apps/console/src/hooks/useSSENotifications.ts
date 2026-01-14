import { useEffect } from 'react'
import { useQueryClient, useQuery } from '@tanstack/react-query'

export interface NotificationData {
  url?: string
  entityId?: string
  entityType?: string
  priority?: 'low' | 'medium' | 'high'
  [key: string]: unknown
}

export type NotificationObjectType = 'Program' | 'Task' | 'Evidence' | 'Group' | 'Internal Policy' | 'Procedure' | 'Risk' | 'Questionnaire'

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
    let eventSource: EventSource | null = null

    const timeoutId = setTimeout(() => {
      eventSource = new EventSource('/api/notifications')

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
          console.error('SSE notification error:', e)
        }
      }

      eventSource.onmessage = handleMessage
      eventSource.addEventListener('next', handleMessage as EventListener)

      eventSource.onerror = () => {
        eventSource?.close()
      }
    }, 5000)

    return () => {
      clearTimeout(timeoutId)
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [queryClient])

  return {
    notifications,
    isLoading,
  }
}
