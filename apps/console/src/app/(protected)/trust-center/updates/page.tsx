import React from 'react'
import { Metadata } from 'next'
import ShareUpdateSection from '@/components/pages/protected/trust-center/updates/updates-page'

export const metadata: Metadata = {
  title: 'Updates | Trust Center',
}

const Page: React.FC = () => {
  return <ShareUpdateSection />
}

export default Page
