import React from 'react'
import { type Metadata } from 'next'
import SubscribersPage from '@/components/pages/protected/trust-center/subscribers/subscribers-page'

export const metadata: Metadata = {
  title: 'Subscribers | Trust Center',
}

const Page: React.FC = () => {
  return <SubscribersPage />
}

export default Page
