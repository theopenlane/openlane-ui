import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import PricingPage from '@/components/pages/protected/organization/billing/pricing-table'

const Page: React.FC = () => {
  return (
    <>
    <PageHeading heading="Pricing Plans" eyebrow="Billing" />
    <PricingPage />
    </>
  )
}

export default Page
