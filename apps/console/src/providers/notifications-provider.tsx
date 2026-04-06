'use client'

import React, { createContext, use, useCallback, useEffect, useRef } from 'react'
import { useWebsocketNotifications, type Notification } from '@/lib/graphql-hooks/websocket/use-websocket-notifications'

type NewNotificationListener = (notification: Notification) => void

type NotificationsContextValue = ReturnType<typeof useWebsocketNotifications> & {
  addNewNotificationListener: (listener: NewNotificationListener) => () => void
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

export const NotificationsProvider = ({ children }: { children: React.ReactNode }) => {
  const websocketNotifications = useWebsocketNotifications()
  const { notifications, liveNotifications, subscriptionStartedAt } = websocketNotifications
  const listenersRef = useRef<NewNotificationListener[]>([])
  const seenIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (notifications.length === 0 && liveNotifications.length === 0) {
      seenIdsRef.current = new Set()
    }
  }, [liveNotifications, notifications.length])

  useEffect(() => {
    liveNotifications.forEach((notification) => {
      if (!seenIdsRef.current.has(notification.id)) {
        seenIdsRef.current.add(notification.id)
        const isNew = subscriptionStartedAt !== null && notification.createdAt != null && new Date(notification.createdAt).getTime() >= subscriptionStartedAt
        if (isNew) {
          listenersRef.current.forEach((listener) => listener(notification))
        }
      }
    })
  }, [liveNotifications, subscriptionStartedAt])

  const addNewNotificationListener = useCallback((listener: NewNotificationListener) => {
    listenersRef.current.push(listener)
    return () => {
      listenersRef.current = listenersRef.current.filter((l) => l !== listener)
    }
  }, [])

  return <NotificationsContext value={{ ...websocketNotifications, addNewNotificationListener }}>{children}</NotificationsContext>
}

export const useNotificationsContext = () => {
  const ctx = use(NotificationsContext)
  if (!ctx) throw new Error('useNotificationsContext must be used within NotificationsProvider')
  return ctx
}
