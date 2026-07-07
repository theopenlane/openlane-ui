'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { NotificationNotificationTopic } from '@repo/codegen/src/schema'
import { getNotificationRedirectUrl, redirectToNotification } from '@/components/shared/SystemNotification/notification-redirect'
import { type Notification } from '@/lib/graphql-hooks/websocket/use-websocket-notifications'
import { useNotificationsContext } from '@/providers/notifications-provider'

export const useDomainScanNotification = () => {
  const router = useRouter()
  const { addNewNotificationListener, markAsRead } = useNotificationsContext()
  const [domainScanNotification, setDomainScanNotification] = useState<Notification | null>(null)

  useEffect(() => {
    return addNewNotificationListener((notification) => {
      if (notification.topic === NotificationNotificationTopic.DOMAIN_SCAN) {
        setDomainScanNotification(notification)
      }
    })
  }, [addNewNotificationListener])

  const canReviewDomainScanFindings = !!domainScanNotification && !!getNotificationRedirectUrl(domainScanNotification)

  const reviewDomainScanFindings = async () => {
    if (!domainScanNotification) return
    await markAsRead(domainScanNotification.id)
    redirectToNotification(router, domainScanNotification)
  }

  return {
    domainScanNotification,
    canReviewDomainScanFindings,
    reviewDomainScanFindings,
  }
}
