import React from 'react'
import type { Metadata } from 'next'
import NotificationsPage from '@/components/pages/protected/notifications/notifications-page'

export const metadata: Metadata = {
  title: 'Notifications',
}

const Page: React.FC = () => <NotificationsPage />

export default Page
