'use client'

import React, { createContext, use, useEffect, useRef } from 'react'
import { useWebsocketNotifications, type Notification } from '@/lib/graphql-hooks/websocket/use-websocket-notifications'

type NewNotificationListener = (notification: Notification) => void

type NotificationsContextValue = ReturnType<typeof useWebsocketNotifications> & {
  addNewNotificationListener: (listener: NewNotificationListener) => () => void
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null)

export const NotificationsProvider = ({ children }: { children: React.ReactNode }) => {
  const websocketNotifications = useWebsocketNotifications()
  const { notifications } = websocketNotifications
  const listenersRef = useRef<NewNotificationListener[]>([])
  const seenIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    notifications.forEach((n) => {
      if (!seenIdsRef.current.has(n.id)) {
        seenIdsRef.current.add(n.id)
        listenersRef.current.forEach((listener) => listener(n))
      }
    })
  }, [notifications])

  const addNewNotificationListener = (listener: NewNotificationListener) => {
    listenersRef.current.push(listener)
    return () => {
      listenersRef.current = listenersRef.current.filter((l) => l !== listener)
    }
  }

  return <NotificationsContext value={{ ...websocketNotifications, addNewNotificationListener }}>{children}</NotificationsContext>
}

export const useNotificationsContext = () => {
  const ctx = use(NotificationsContext)
  if (!ctx) throw new Error('useNotificationsContext must be used within NotificationsProvider')
  return ctx
}
