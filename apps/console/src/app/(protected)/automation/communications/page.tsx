import React from 'react'
import CommunicationsPage from '@/components/pages/protected/communications/communications-page'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Communications',
}

const Page: React.FC = () => {
  return <CommunicationsPage />
}

export default Page
