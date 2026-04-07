import { type Notification } from '@/lib/graphql-hooks/websocket/use-websocket-notifications'

interface NotificationRedirectRouter {
  push: (href: string) => void
}

export const getNotificationRedirectUrl = (notification: Notification) => {
  const url = notification.data?.url
  if (!url) {
    return null
  }

  return url.startsWith('/') ? url : `/${url}`
}

export const redirectToNotification = (router: NotificationRedirectRouter, notification: Notification) => {
  const url = getNotificationRedirectUrl(notification)
  if (!url) {
    return false
  }

  router.push(url)
  return true
}
