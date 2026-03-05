import React from 'react'
import { type Metadata } from 'next'
import FaqsPage from '@/components/pages/protected/trust-center/faqs/faqs-page'

export const metadata: Metadata = {
  title: 'FAQs | Trust Center',
}

const Page: React.FC = () => {
  return <FaqsPage />
}

export default Page
