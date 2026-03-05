import React from 'react'
import { type Metadata } from 'next'
import CustomerLogosPage from '@/components/pages/protected/trust-center/customer-logos/customer-logos-page'

export const metadata: Metadata = {
  title: 'Customer Logos | Trust Center',
}

const Page: React.FC = () => {
  return <CustomerLogosPage />
}

export default Page
