import { type Notification } from '@/lib/graphql-hooks/websocket/use-websocket-notifications'
import { NotificationNotificationTopic } from '@repo/codegen/src/schema'

interface NotificationRedirectRouter {
  push: (href: string) => void
}

export const getNotificationRedirectUrl = (notification: Notification) => {
  const isDomainScan = notification.topic === NotificationNotificationTopic.DOMAIN_SCAN || notification.objectType === 'DOMAIN_SCAN'
  if (isDomainScan) {
    return `/exposure/scans/domain-scan?id=${encodeURIComponent(notification.id)}`
  }

  const url = notification.data?.url
  if (!url) {
    return null
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  return url.startsWith('/') ? url : `/${url}`
}

export const redirectToNotification = (router: NotificationRedirectRouter, notification: Notification) => {
  const url = getNotificationRedirectUrl(notification)
  if (!url) {
    return false
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    window.location.assign(url)
    return true
  }

  router.push(url)
  return true
}
