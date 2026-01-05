import { useEffect } from 'react'
import { useQueryClient, useQuery } from '@tanstack/react-query'

export function useSSENotifications() {
  const queryClient = useQueryClient()

  const { data: initialNotifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      return []
    },
  })

  useEffect(() => {
    let eventSource: EventSource | null = null

    const timeoutId = setTimeout(() => {
      eventSource = new EventSource('/api/notifications')

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          const newNotification = payload?.data?.notificationCreated

          if (newNotification) {
            queryClient.setQueryData(['notifications'], (old: any[] = []) => {
              if (old.some((n) => n.id === newNotification.id)) return old
              return [newNotification, ...old]
            })
          }
        } catch (err) {
          // Ignored
        }
      }

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close()
        }
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
    notifications: initialNotifications || [],
    isLoading,
  }
}
