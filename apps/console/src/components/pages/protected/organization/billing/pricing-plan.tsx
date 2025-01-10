'use client'
import React, { useMemo } from 'react'
import { Panel } from '@repo/ui/panel'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { formatDistanceToNowStrict, parseISO, isBefore } from 'date-fns'
import { CircleCheck, ExternalLink } from 'lucide-react'
import { useOrganization } from '@/hooks/useOrganization'

const PricingPlan = () => {
  const { currentOrg } = useOrganization()
  console.log('currentOrg', currentOrg)

  const subscription = currentOrg?.orgSubscriptions?.[0] ?? {}
  // @ts-ignore TODO: MISSING TYPES FROM CODEGEN
  const { expiresAt, subscriptionURL, active, productTier, productPrice = {}, features = [] } = subscription
  const { amount: price, interval: priceInterval } = productPrice

  const formattedExpiresDate = useMemo(() => {
    if (!expiresAt || !active) return 'Expired'

    try {
      const expirationDate = parseISO(expiresAt)
      if (isBefore(expirationDate, new Date())) {
        return 'Expired'
      }
      return `Expires in ${formatDistanceToNowStrict(expirationDate, { addSuffix: false })}`
    } catch (error) {
      console.error('Error parsing expiration date:', error)
      return 'N/A'
    }
  }, [expiresAt, active])

  const handleSubscriptionChange = () => {
    if (subscriptionURL) {
      window.open(subscriptionURL, '_blank', 'noopener,noreferrer')
    } else {
      console.warn('No subscription URL available')
    }
  }

  return (
    <Panel className="p-6">
      <h2 className="text-2xl">Pricing Plan</h2>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-10 w-full">
          <h3 className="text-xl font-medium w-1/5">Current Plan</h3>
          <div className="w-full">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex gap-3 items-center">
                  <p className="text-lg font-medium">{productTier ?? 'N/A'}</p>
                  <Badge className="text-xs font-medium" variant="outline">
                    {formattedExpiresDate}
                  </Badge>
                </div>
                {price && <p className="text-sm">{`$${price} / ${priceInterval}`}</p>}
              </div>
              <Button className="flex items-center gap-2" icon={<ExternalLink />} onClick={handleSubscriptionChange}>
                Change Subscription
              </Button>
            </div>

            {/* Divider */}
            <div className="my-7 border-t border-gray-300"></div>

            {/* Features List */}
            <h4 className="text-lg font-medium text-text-header mb-5">Features in this plan</h4>
            <ul className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700">
              {features.length > 0 ? features.map((feature: string, index: number) => <FeatureItem key={index} feature={feature} />) : <p className="text-gray-500">No features listed.</p>}
            </ul>
          </div>
        </div>
      </div>
    </Panel>
  )
}

// Extracted Feature Item Component
const FeatureItem = ({ feature }: { feature: string }) => (
  <li className="flex items-center gap-2">
    <CircleCheck className="w-5 h-5 text-brand" />
    <p>{feature}</p>
  </li>
)

export default PricingPlan
