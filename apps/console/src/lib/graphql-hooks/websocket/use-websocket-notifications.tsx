'use client'

import { useCallback, useEffect, useState } from 'react'
import { useWebSocketClient } from '@/providers/websocket-provider'
import { useSession } from 'next-auth/react'
import { Notification as SchemaNotification } from '@repo/codegen/src/schema'
import { useMarkNotificationsAsRead } from '@/lib/graphql-hooks/notifications'

export type Notification = Pick<SchemaNotification, 'id' | 'title' | 'body' | 'topic' | 'data' | 'readAt' | 'objectType' | 'createdAt'>

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
      createdAt
    }
  }
`

export function useWebsocketNotifications() {
  const { status } = useSession()
  const { client: wsClient } = useWebSocketClient()
  const { mutateAsync } = useMarkNotificationsAsRead()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!wsClient || status !== 'authenticated') {
      return
    }

    const unsubscribe = wsClient.subscribe(
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
  }, [wsClient, status])

  const markAsRead = useCallback(
    async (id: string) => {
      const now = new Date().toISOString()

      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: now } : n)))

      try {
        await mutateAsync({ ids: [id] })
      } catch (err) {
        console.error('Failed to mark notification as read:', err)
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: null } : n)))
      }
    },
    [mutateAsync],
  )

  const markAllAsRead = useCallback(async () => {
    const now = new Date().toISOString()

    const unreadIds = notifications.filter((n) => !n.readAt).map((n) => n.id)

    if (unreadIds.length === 0) return

    setNotifications((prev) => prev.map((n) => (unreadIds.includes(n.id) ? { ...n, readAt: now } : n)))

    try {
      await mutateAsync({ ids: unreadIds })
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)

      setNotifications((prev) => prev.map((n) => (unreadIds.includes(n.id) ? { ...n, readAt: null } : n)))
    }
  }, [notifications, mutateAsync])

  return {
    notifications,
    setNotifications,
    markAsRead,
    markAllAsRead,
    isLoading: status === 'loading' || (isLoading && notifications.length === 0),
  }
}
