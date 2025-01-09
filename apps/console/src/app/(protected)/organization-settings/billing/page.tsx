'use client'
import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import PricingPlan from '@/components/pages/protected/organization/billing/PricingPlan'
import BillingSettings from '@/components/pages/protected/organization/billing/billing-settings'
import { pageStyles } from '../general-settings/page.styles'

const Page: React.FC = () => {
  const { wrapper } = pageStyles()

  return (
    <>
      <PageHeading heading="Billing" eyebrow="Organization Settings" />
      <div className={wrapper()}>
        <PricingPlan />
        <BillingSettings />
      </div>
    </>
  )
}

export default Page
