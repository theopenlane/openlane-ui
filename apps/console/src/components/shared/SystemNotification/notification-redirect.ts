import { type Notification } from '@/lib/graphql-hooks/websocket/use-websocket-notifications'
import { NotificationNotificationTopic } from '@repo/codegen/src/schema'
import { domainScanReviewHref } from '@/constants/scan-routes'
import { sanitizeLoginRedirect } from '@/lib/auth/utils/redirect'

export const NOTIFICATIONS_PAGE_HREF = '/notifications'

interface NotificationRedirectRouter {
  push: (href: string) => void
}

interface DomainScanEntry {
  internal_scan_id?: string
}

const isDomainScanEntryArray = (value: unknown): value is DomainScanEntry[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'object' && entry !== null && (!('internal_scan_id' in entry) || typeof entry.internal_scan_id === 'string'))

const isExternalUrl = (url: string) => url.startsWith('http://') || url.startsWith('https://')

export const getNotificationHref = (notification: Notification, returnTo?: string | null) => {
  const isDomainScan = notification.topic === NotificationNotificationTopic.DOMAIN_SCAN || notification.objectType === 'DOMAIN_SCAN'
  const url: unknown = notification.data?.url
  const hasUrl = typeof url === 'string' && url.trim() !== ''

  if (isDomainScan && !hasUrl) {
    const scans: unknown = notification.data?.scans
    const singleScanId = isDomainScanEntryArray(scans) && scans.length === 1 ? scans[0].internal_scan_id : undefined
    return domainScanReviewHref(singleScanId || notification.id, returnTo)
  }

  if (!hasUrl) {
    return NOTIFICATIONS_PAGE_HREF
  }

  if (isExternalUrl(url)) {
    return url
  }

  return sanitizeLoginRedirect(url.startsWith('/') ? url : `/${url}`, NOTIFICATIONS_PAGE_HREF)
}

export const goToNotificationsPage = (router: NotificationRedirectRouter) => {
  if (window.location.pathname === NOTIFICATIONS_PAGE_HREF) {
    return
  }

  router.push(NOTIFICATIONS_PAGE_HREF)
}

export const redirectToNotification = (router: NotificationRedirectRouter, notification: Notification, returnTo?: string | null) => {
  const url = getNotificationHref(notification, returnTo)

  if (isExternalUrl(url)) {
    window.location.assign(url)
    return
  }

  if (url === NOTIFICATIONS_PAGE_HREF) {
    goToNotificationsPage(router)
    return
  }

  router.push(url)
}
