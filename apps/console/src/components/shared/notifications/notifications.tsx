'use client'

import { NovuProvider, PopoverNotificationCenter, NotificationBell } from '@novu/notification-center'
import { useSession } from 'next-auth/react'

export const Notifications = () => {
  const { data: sessionData } = useSession()
  return (
    <NovuProvider subscriberId={sessionData?.user.userId} applicationIdentifier={process.env.NEXT_PUBLIC_NOVU_APP_IDENTIFIER!}>
      <PopoverNotificationCenter colorScheme="light">{({ unseenCount }) => <NotificationBell unseenCount={unseenCount} />}</PopoverNotificationCenter>
    </NovuProvider>
  )
}
