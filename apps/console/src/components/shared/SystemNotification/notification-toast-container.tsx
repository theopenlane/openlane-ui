'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import * as ToastPrimitives from '@radix-ui/react-toast'
import { Bell, X } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import { useNotificationsContext } from '@/providers/notifications-provider'
import { type Notification } from '@/lib/graphql-hooks/websocket/use-websocket-notifications'
import { getNotificationRedirectUrl, redirectToNotification } from './notification-redirect'
import { useRouter } from 'next/navigation'

const BATCH_WINDOW_MS = 1500
const TOAST_DURATION_MS = 6000
const MAX_VISIBLE_TOASTS = 3
const BELL_COLOR = '#38bdf8'

interface NotificationToastData {
  id: string
  notifications: Notification[]
  open: boolean
}

const toastRootClass = cn(
  'group pointer-events-auto relative flex w-full items-center gap-3 overflow-hidden rounded-lg',
  'border border-border bg-card p-4 shadow-lg',
  'transition-all',
  'data-[swipe=cancel]:translate-x-0',
  'data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
  'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
  'data-[swipe=move]:transition-none',
  'data-[state=open]:animate-in data-[state=closed]:animate-out',
  'data-[swipe=end]:animate-out',
  'data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full',
  'data-[state=open]:slide-in-from-bottom-full',
)

const BellIconContainer = () => {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
      style={{
        backgroundColor: `color-mix(in srgb, ${BELL_COLOR}, transparent 80%)`,
        border: `1px solid color-mix(in srgb, ${BELL_COLOR}, transparent 70%)`,
      }}
    >
      <Bell size={15} style={{ color: BELL_COLOR }} />
    </div>
  )
}

const DismissButton = () => {
  return (
    <ToastPrimitives.Close
      className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none group-hover:opacity-100"
      onClick={(e) => e.stopPropagation()}
    >
      <X className="h-3.5 w-3.5" />
    </ToastPrimitives.Close>
  )
}

interface ToastItemProps {
  data: NotificationToastData
  onOpenChange: (open: boolean) => void
  onView: (notifications: Notification[]) => void
}

const SingleNotificationToast = ({ data, onOpenChange, onView }: ToastItemProps) => {
  const notification = data.notifications[0]
  const hasUrl = !!(notification && getNotificationRedirectUrl(notification))

  return (
    <ToastPrimitives.Root
      open={data.open}
      onOpenChange={onOpenChange}
      duration={TOAST_DURATION_MS}
      className={toastRootClass}
      onClick={() => onView(data.notifications)}
      style={{ cursor: hasUrl ? 'pointer' : 'default' }}
    >
      <BellIconContainer />
      <div className="min-w-0 flex-1">
        <ToastPrimitives.Title className="truncate text-sm font-semibold text-foreground">{notification?.title}</ToastPrimitives.Title>
        {notification?.body && <ToastPrimitives.Description className="truncate text-xs text-muted-foreground mt-0.5">{notification.body}</ToastPrimitives.Description>}
        {hasUrl && (
          <p className="mt-1.5 text-xs font-medium" style={{ color: BELL_COLOR }}>
            View →
          </p>
        )}
      </div>
      <DismissButton />
    </ToastPrimitives.Root>
  )
}

const BatchNotificationToast = ({ data, onOpenChange, onView }: ToastItemProps) => {
  const count = data.notifications.length

  return (
    <ToastPrimitives.Root open={data.open} onOpenChange={onOpenChange} duration={TOAST_DURATION_MS} className={toastRootClass} onClick={() => onView(data.notifications)} style={{ cursor: 'pointer' }}>
      <BellIconContainer />
      <div className="min-w-0 flex-1">
        <ToastPrimitives.Title className="text-sm font-semibold text-foreground">{count} new notifications</ToastPrimitives.Title>
        <ToastPrimitives.Description className="text-xs text-muted-foreground mt-0.5">Click to view all notifications</ToastPrimitives.Description>
        <p className="mt-1.5 text-xs font-medium" style={{ color: BELL_COLOR }}>
          View All →
        </p>
      </div>
      <DismissButton />
    </ToastPrimitives.Root>
  )
}

export const NotificationToastContainer = () => {
  const { addNewNotificationListener, markAsRead } = useNotificationsContext()
  const router = useRouter()
  const [toasts, setToasts] = useState<NotificationToastData[]>([])
  const batchRef = useRef<Notification[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flushBatch = useCallback(() => {
    const batch = [...batchRef.current]
    if (batch.length === 0) return
    batchRef.current = []
    timerRef.current = null

    const toastId = `notif-${Date.now()}`
    setToasts((prev) => {
      const visible = prev.filter((t) => t.open)
      const trimmed = visible.length >= MAX_VISIBLE_TOASTS ? visible.slice(1) : visible
      return [...trimmed, { id: toastId, notifications: batch, open: true }]
    })
  }, [])

  useEffect(() => {
    const unsubscribe = addNewNotificationListener((notification) => {
      batchRef.current.push(notification)
      if (!timerRef.current) {
        timerRef.current = setTimeout(flushBatch, BATCH_WINDOW_MS)
      }
    })
    return () => {
      unsubscribe()
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [addNewNotificationListener, flushBatch])

  const handleOpenChange = useCallback((toastId: string, open: boolean) => {
    if (!open) {
      setToasts((prev) => prev.map((t) => (t.id === toastId ? { ...t, open: false } : t)))
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId))
      }, 300)
    }
  }, [])

  const handleView = useCallback(
    async (notifications: Notification[]) => {
      const unread = notifications.filter((n) => !n.readAt)
      await Promise.all(unread.map((n) => markAsRead(n.id)))

      if (notifications.length > 1) {
        router.push('/notifications')
        return
      }

      const firstWithUrl = notifications.find((notification) => getNotificationRedirectUrl(notification))
      if (firstWithUrl) {
        redirectToNotification(router, firstWithUrl)
      }
    },
    [markAsRead, router],
  )

  return (
    <ToastPrimitives.Provider swipeDirection="right">
      {toasts.map((toast) =>
        toast.notifications.length === 1 ? (
          <SingleNotificationToast key={toast.id} data={toast} onOpenChange={(open) => handleOpenChange(toast.id, open)} onView={handleView} />
        ) : (
          <BatchNotificationToast key={toast.id} data={toast} onOpenChange={(open) => handleOpenChange(toast.id, open)} onView={handleView} />
        ),
      )}
      <ToastPrimitives.Viewport className="fixed bottom-0 right-0 z-100 flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-105 focus:outline-none" />
    </ToastPrimitives.Provider>
  )
}
