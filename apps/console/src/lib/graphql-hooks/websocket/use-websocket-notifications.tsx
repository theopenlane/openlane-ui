'use client'

import { useEffect, useState } from 'react'
import { useWebSocketClient } from '@/providers/websocket-provider'
import { useSession } from 'next-auth/react'
import { Notification as SchemaNotification } from '@repo/codegen/src/schema'

export type Notification = Pick<SchemaNotification, 'id' | 'title' | 'body' | 'topic' | 'data' | 'readAt' | 'objectType'>

type SubscriptionData = {
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
    if (!client || !isConnected || status !== 'authenticated') {
      return
    }

    const unsubscribe = client.subscribe(
      {
        query: NOTIFICATION_SUBSCRIPTION,
      },
      {
        next: (value) => {
          const data = value.data as unknown as SubscriptionData
          const newNotification = data?.notificationCreated

          if (newNotification) {
            setNotifications((prev) => {
              const exists = prev.some((n) => n.id === newNotification.id)
              if (exists) return prev
              return [newNotification, ...prev]
            })
          }
          setIsLoading(false)
        },
        error: (err) => {
          console.error('Subscription error:', err)
          setIsLoading(false)
        },
        complete: () => {
          setIsLoading(false)
        },
      },
    )

    return () => {
      unsubscribe()
    }
  }, [client, isConnected, status])

  return {
    notifications,
    setNotifications,
    isLoading: status === 'loading' || (isLoading && notifications.length === 0),
    isConnected,
  }
}
