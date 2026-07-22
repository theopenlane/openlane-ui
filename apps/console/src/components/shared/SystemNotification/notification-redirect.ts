import { type Notification } from '@/lib/graphql-hooks/websocket/use-websocket-notifications'
import { NotificationNotificationTopic } from '@repo/codegen/src/schema'

interface NotificationRedirectRouter {
  push: (href: string) => void
}

interface DomainScanEntry {
  internal_scan_id?: string
}

const isDomainScanEntryArray = (value: unknown): value is DomainScanEntry[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'object' && entry !== null && (!('internal_scan_id' in entry) || typeof entry.internal_scan_id === 'string'))

export const getNotificationRedirectUrl = (notification: Notification) => {
  const isDomainScan = notification.topic === NotificationNotificationTopic.DOMAIN_SCAN || notification.objectType === 'DOMAIN_SCAN'
  if (isDomainScan) {
    const scans: unknown = notification.data?.scans
    const singleScanId = isDomainScanEntryArray(scans) && scans.length === 1 ? scans[0].internal_scan_id : undefined
    return `/exposure/scans/domain-scan?scanId=${encodeURIComponent(singleScanId || notification.id)}`
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
