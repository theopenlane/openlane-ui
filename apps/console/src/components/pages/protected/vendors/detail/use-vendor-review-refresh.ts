'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { NotificationNotificationTopic } from '@repo/codegen/src/schema'
import { useNotificationsContext } from '@/providers/notifications-provider'

export const useVendorReviewRefresh = (vendorId: string) => {
  const queryClient = useQueryClient()
  const { addNewNotificationListener } = useNotificationsContext()

  useEffect(
    () =>
      addNewNotificationListener((notification) => {
        if (notification.topic !== NotificationNotificationTopic.REPORT_SCAN || notification.data?.vendor_id !== vendorId) return
        queryClient.invalidateQueries({ queryKey: ['entities', vendorId] })
        queryClient.invalidateQueries({ queryKey: ['reviews'] })
        queryClient.invalidateQueries({ queryKey: ['entityFiles', vendorId] })
      }),
    [addNewNotificationListener, queryClient, vendorId],
  )
}
