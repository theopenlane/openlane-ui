'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useWebSocketClient } from '@/providers/websocket-provider'
import { useSession } from 'next-auth/react'
import { type Notification, useMarkNotificationsAsRead } from '@/lib/graphql-hooks/notifications'

export type { Notification } from '@/lib/graphql-hooks/notifications'

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

const getNotificationTime = (notification: Notification) => {
  if (!notification.createdAt) {
    return 0
  }

  return new Date(notification.createdAt).getTime()
}

const sortNotifications = (notifications: Notification[]) => {
  return [...notifications].sort((a, b) => getNotificationTime(b) - getNotificationTime(a))
}

const mergeNotification = (existing: Notification, incoming: Notification): Notification => {
  return {
    ...existing,
    ...incoming,
    readAt: existing.readAt ?? incoming.readAt,
  }
}

const mergeNotifications = (current: Notification[], incoming: Notification[]) => {
  const notificationsById = new Map(current.map((notification) => [notification.id, notification]))

  incoming.forEach((notification) => {
    const existing = notificationsById.get(notification.id)
    notificationsById.set(notification.id, existing ? mergeNotification(existing, notification) : notification)
  })

  return sortNotifications(Array.from(notificationsById.values()))
}

const updateReadState = (current: Notification[], ids: string[], readAt: string | null) => {
  const idsSet = new Set(ids)
  return current.map((notification) => (idsSet.has(notification.id) ? { ...notification, readAt } : notification))
}

export function useWebsocketNotifications() {
  const { status } = useSession()
  const { client: wsClient, isConnected, resetConnection } = useWebSocketClient()
  const { mutateAsync } = useMarkNotificationsAsRead()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [liveNotifications, setLiveNotifications] = useState<Notification[]>([])
  const [subscriptionStartedAt, setSubscriptionStartedAt] = useState<number | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') {
      setNotifications([])
      setLiveNotifications([])
      setSubscriptionStartedAt(null)
    }
  }, [status])

  useEffect(() => {
    if (!wsClient || status !== 'authenticated') {
      return
    }

    let isActive = true
    setSubscriptionStartedAt(Date.now())

    const unsubscribe = wsClient.subscribe(
      {
        query: NOTIFICATION_SUBSCRIPTION,
      },
      {
        next: (value) => {
          const data = value.data as unknown as SubscriptionData
          const newNotification = data?.notificationCreated

          if (newNotification) {
            setNotifications((prev) => mergeNotifications(prev, [newNotification]))
            setLiveNotifications((prev) => mergeNotifications(prev, [newNotification]))
          }
        },
        error: (err) => {
          if (!isActive) {
            return
          }
          console.error('Subscription error:', err)
          resetConnection()
        },
        complete: () => {
          if (!isActive) {
            return
          }
          resetConnection()
        },
      },
    )

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [resetConnection, wsClient, status])

  useEffect(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (status !== 'authenticated' || !wsClient || isConnected) {
      return
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      resetConnection()
    }, 5000)

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [isConnected, resetConnection, status, wsClient])

  const markAsRead = useCallback(
    async (id: string) => {
      const now = new Date().toISOString()

      setNotifications((prev) => updateReadState(prev, [id], now))
      setLiveNotifications((prev) => updateReadState(prev, [id], now))

      try {
        await mutateAsync({ ids: [id] })
      } catch (err) {
        console.error('Failed to mark notification as read:', err)
        setNotifications((prev) => updateReadState(prev, [id], null))
        setLiveNotifications((prev) => updateReadState(prev, [id], null))
      }
    },
    [mutateAsync],
  )

  const markAllAsRead = useCallback(async () => {
    const now = new Date().toISOString()

    const unreadIds = notifications.filter((n) => !n.readAt).map((n) => n.id)

    if (unreadIds.length === 0) return

    setNotifications((prev) => updateReadState(prev, unreadIds, now))
    setLiveNotifications((prev) => updateReadState(prev, unreadIds, now))

    try {
      await mutateAsync({ ids: unreadIds })
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)

      setNotifications((prev) => updateReadState(prev, unreadIds, null))
      setLiveNotifications((prev) => updateReadState(prev, unreadIds, null))
    }
  }, [notifications, mutateAsync])

  return {
    notifications,
    liveNotifications,
    markAsRead,
    markAllAsRead,
    isLoading: status === 'loading',
    subscriptionStartedAt,
  }
}
