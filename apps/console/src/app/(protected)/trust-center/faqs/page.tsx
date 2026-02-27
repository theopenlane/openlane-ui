import React from 'react'
import { Metadata } from 'next'
import FaqsPage from '@/components/pages/protected/trust-center/faqs/faqs-page'

export const metadata: Metadata = {
  title: 'FAQs | Trust Center',
}

const Page: React.FC = () => {
  return <FaqsPage />
}

export default Page
