'use client'
import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import PricingPlan from '@/components/pages/protected/organization/billing/pricing-plan'
import BillingSettings from '@/components/pages/protected/organization/billing/billing-settings'
import { pageStyles } from '../general-settings/page.styles'
import { useOrganization } from '@/hooks/useOrganization'

const Page: React.FC = () => {
  const { wrapper } = pageStyles()
  const { currentOrg } = useOrganization()

  return (
    <>
      <PageHeading heading="Billing" eyebrow="Organization Settings" />
      <div className={wrapper()}>
        {currentOrg?.personalOrg ? (
          <h2 className="text-2xl">
            You're currently logged into your personal organization - you can switch into another organization you are a member of, or create an organization to use paid features of the Openlane
            platform
          </h2>
        ) : (
          <>
            <PricingPlan />
            <BillingSettings />
          </>
        )}
      </div>
    </>
  )
}

export default Page
