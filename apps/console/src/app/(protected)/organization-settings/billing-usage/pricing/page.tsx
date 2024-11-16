import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import StripePricingTable from '@/components/pages/protected/organization/billing/pricing-table'

const Page: React.FC = () => {
  return (
    <>
    <PageHeading heading="Pricing Plans" eyebrow="Billing" />
    <StripePricingTable 
      pricingTableId="prctbl_1QKO15Bvxky1R7SvxYRBAjs7"
      publishableKey="pk_live_51Pt0QSBvxky1R7SvaJ84iz2bKdKAdeyDj5NqfbK8ofEYQNgXj0aAou0to3TF5YcbWLmAwfSqzTJBWOgSyyMGCUrC00lPIl5iZd"
      />
    </>
  )
}

export default Page
