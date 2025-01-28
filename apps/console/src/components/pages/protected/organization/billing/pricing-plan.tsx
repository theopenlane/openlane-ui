'use client'
import React, { useMemo } from 'react'
import { Panel } from '@repo/ui/panel'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { formatDistanceToNowStrict, parseISO, isBefore } from 'date-fns'
import { CircleCheck, ExternalLink } from 'lucide-react'
import { useOrganization } from '@/hooks/useOrganization'
import { useGetOrganizationBillingQuery } from '@repo/codegen/src/schema'
import { Card } from '@repo/ui/cardpanel'

const PricingPlan = () => {
  const { currentOrgId } = useOrganization()

  const [data] = useGetOrganizationBillingQuery({ pause: !currentOrgId, variables: { organizationId: currentOrgId } })

  const subscription = data.data?.organization.orgSubscriptions?.[0] ?? {}

  // @ts-ignore TODO: MISSING TYPES FROM CODEGEN
  const { expiresAt, subscriptionURL, active, productTier, stripeSubscriptionStatus, productPrice = {}, features = [] } = subscription
  const { amount: price, interval: priceInterval } = productPrice

  const badge: { text: string; variant: 'default' | 'secondary' | 'outline' | 'gold' | 'destructive' } = useMemo(() => {
    if (stripeSubscriptionStatus === 'trialing') {
      return { variant: 'gold', text: 'Trial' }
    }
    if (active) {
      return { variant: 'default', text: 'Active' }
    }
    if (!active) {
      return { variant: 'destructive', text: 'Expired' }
    }
    return { variant: 'destructive', text: 'Unknown' }
  }, [stripeSubscriptionStatus, active])

  const formattedExpiresDate = useMemo(() => {
    if (!expiresAt && !active) return 'Expired'

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
    <div className="p-6 w-1/3 2xl:w-1/4">
      <h2 className="text-2xl">Pricing Plan</h2>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-10 w-full">
          <div className="w-full">
            <div className="flex flex-col text-gray-700">
              <Card className="shadow-md max-w-96">
                <div className="flex flex-col   ">
                  <div className="p-4">
                    <div className="flex gap-3 items-center ">
                      <p className="text-lg font-medium">{productTier ?? 'N/A'}</p>
                      <Badge variant={badge.variant} className="text-xs font-normal text-white">
                        {badge.text}
                      </Badge>
                    </div>
                    {price && <p className="text-sm">{`$${price} / ${priceInterval}`}</p>}
                    <p className=" text-sm  ">{formattedExpiresDate}</p>
                  </div>
                </div>
                <div className=" border-t"></div>
                <div className="p-4 flex justify-center">
                  {' '}
                  <Button className=" flex  items-center gap-10 max-w-60" icon={<ExternalLink />} onClick={handleSubscriptionChange}>
                    Change Subscription
                  </Button>
                </div>
              </Card>
            </div>

            {/* Features List */}
            <h4 className="mt-7 text-lg font-medium text-text-header mb-5">Features in this plan</h4>
            <ul className="mt-2 flex flex-col gap-y-2 text-gray-700">
              {features?.length > 0 ? features.map((feature: string, index: number) => <FeatureItem key={index} feature={feature} />) : <p className="text-gray-500">No features listed.</p>}
            </ul>
          </div>
        </div>
      </div>
    </div>
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
