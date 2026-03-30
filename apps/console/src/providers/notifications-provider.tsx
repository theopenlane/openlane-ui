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

  const isInitializedRef = useRef(false)
  const initTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isInitializedRef.current) {
      notifications.forEach((n) => {
        if (!seenIdsRef.current.has(n.id)) {
          seenIdsRef.current.add(n.id)
          listenersRef.current.forEach((listener) => listener(n))
        }
      })
      return
    }

    let hasNew = false
    notifications.forEach((n) => {
      if (!seenIdsRef.current.has(n.id)) {
        seenIdsRef.current.add(n.id)
        hasNew = true
      }
    })

    if (initTimerRef.current) clearTimeout(initTimerRef.current)
    initTimerRef.current = setTimeout(
      () => {
        isInitializedRef.current = true
        initTimerRef.current = null
      },
      hasNew ? 500 : 100,
    )
  }, [notifications])

  useEffect(() => {
    return () => {
      if (initTimerRef.current) clearTimeout(initTimerRef.current)
    }
  }, [])

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
