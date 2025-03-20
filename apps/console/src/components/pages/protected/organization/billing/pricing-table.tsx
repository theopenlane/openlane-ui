import { stripePricingTableId, stripePublishableKey } from '@repo/dally/auth'
import * as React from 'react'

function PricingPage() {
  return React.createElement('stripe-pricing-table', {
    'pricing-table-id': stripePricingTableId,
    'publishable-key': stripePublishableKey,
  })
}

export default PricingPage
