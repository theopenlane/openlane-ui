'use client'

import { useEffect, useState } from 'react'
import { useWebSocketClient } from '@/providers/websocket-provider'
import { useSession } from 'next-auth/react'

export interface Notification {
  id: string
  title: string
  body: string
  topic: string
  data?: any
  readAt?: string | null
  objectType: string
}

interface SubscriptionPayload {
  notificationCreated: Notification
}

const NOTIFICATION_SUBSCRIPTION = `
  subscription OnNotificationCreated {
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
  const { status } = useSession()
  const { client, isConnected } = useWebSocketClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Rely on the WebSocketProvider's isConnected state
    // This ensures CSRF/Auth logic in the provider is finished first
    if (!client || !isConnected || status !== 'authenticated') {
      return
    }

    console.log('📡 Hook: Subscribing to notificationCreated...')

    const unsubscribe = client.subscribe(
      {
        query: NOTIFICATION_SUBSCRIPTION,
      },
      {
        next: (payload) => {
          const data = payload.data as SubscriptionPayload
          const newNotification = data?.notificationCreated

          if (newNotification) {
            console.log('🔔 Hook: Notification received!', newNotification.title)
            setNotifications((prev) => {
              if (prev.some((n) => n.id === newNotification.id)) return prev
              return [newNotification, ...prev]
            })
          }
          setIsLoading(false)
        },
        error: (err) => {
          console.error('🔴 Hook: Subscription error:', err)
          setIsLoading(false)
        },
        complete: () => console.log('📡 Hook: Subscription complete'),
      },
    )

    return () => {
      console.log('📡 Hook: Unsubscribing')
      unsubscribe()
    }
  }, [client, isConnected, status])

  return {
    notifications,
    isLoading: status === 'loading' || (isLoading && notifications.length === 0),
    isConnected,
  }
}
