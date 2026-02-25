import React from 'react'
import BillingPage from '@/components/pages/protected/organization-settings/billing/billing-page'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Billing',
}
const Page: React.FC = () => <BillingPage />

export default Page
