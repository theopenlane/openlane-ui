import React from 'react'
import BillingPage from '@/components/pages/protected/billing/billing-page'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Billing',
}
const Page: React.FC = () => {
  return <BillingPage></BillingPage>
}

export default Page
