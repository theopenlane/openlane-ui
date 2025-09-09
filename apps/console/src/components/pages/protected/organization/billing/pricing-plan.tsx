'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { formatDistanceToNowStrict, parseISO, isBefore } from 'date-fns'
import { CircleCheck } from 'lucide-react'
import { useOrganization } from '@/hooks/useOrganization'
import { Card } from '@repo/ui/cardpanel'
import { useGetOrganizationBilling } from '@/lib/graphql-hooks/organization'
import { OrgSubscription } from '@repo/codegen/src/schema'
import { useSession } from 'next-auth/react'

export type StripePrice = {
  id: string
  unit_amount: number
  currency: string
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year'
  }
}

export type StripeProduct = {
  id: string
  name: string
  description?: string
  metadata?: Record<string, string>
  prices: StripePrice[]
}

const PricingPlan = () => {
  const { data: session } = useSession()
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const { data } = useGetOrganizationBilling(currentOrgId)
  const currentOrganization = getOrganizationByID(currentOrgId!)

  const [subscriptionItems, setSubscriptionItems] = useState<any[]>([])
  const stripeCustomerId = currentOrganization?.node?.stripeCustomerID

  const subscription = data?.organization.orgSubscriptions?.[0] ?? ({} as OrgSubscription)
  const { expiresAt, active, stripeSubscriptionStatus, trialExpiresAt, productPrice = {}, features = [] } = subscription
  const { amount: price, interval: priceInterval } = productPrice

  const trialExpirationDate = trialExpiresAt ? parseISO(trialExpiresAt) : null
  const trialEnded = trialExpirationDate ? isBefore(trialExpirationDate, new Date()) : false

  const badge: { text: string; variant: 'default' | 'secondary' | 'outline' | 'gold' | 'destructive' } = useMemo(() => {
    if (stripeSubscriptionStatus === 'trialing') return { variant: 'gold', text: 'Trial' }
    if (active) return { variant: 'default', text: 'Active' }
    if (!active) return { variant: 'destructive', text: 'Expired' }
    return { variant: 'destructive', text: 'Unknown' }
  }, [stripeSubscriptionStatus, active])

  const formattedExpiresDate = useMemo(() => {
    try {
      if (stripeSubscriptionStatus === 'trialing') {
        const expirationDate = parseISO(trialExpiresAt)
        return `Expires in ${formatDistanceToNowStrict(expirationDate, { addSuffix: false })}`
      }
      if (!expiresAt && trialEnded) return 'Expired'

      const expirationDate = parseISO(expiresAt)
      if (isBefore(expirationDate, new Date())) return 'Expired'

      return `Expires in ${formatDistanceToNowStrict(expirationDate, { addSuffix: false })}`
    } catch {
      return 'N/A'
    }
  }, [expiresAt, stripeSubscriptionStatus, trialExpiresAt, trialEnded])

  const handleSubscribe = async (priceId: string) => {
    if (!stripeCustomerId) {
      alert('No Stripe customer ID found.')
      return
    }

    try {
      const res = await fetch('/api/stripe/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: stripeCustomerId,
          priceId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to subscribe')
      }

      if (data.url) {
        // redirect to Stripe Checkout or Billing Portal
        window.location.href = data.url
      } else {
        alert('Subscription updated successfully!')
      }
    } catch (err: any) {
      console.error('❌ Subscription error:', err)
      alert(err.message)
    }
  }

  const [products, setProducts] = useState<StripeProduct[]>([])
  const [loading, setLoading] = useState(true)

  // fetch all products
  useEffect(() => {
    const fetchProducts = async () => {
      const res = await fetch('/api/stripe/products')
      const data: StripeProduct[] = await res.json()
      setProducts(data)
      setLoading(false)
    }
    fetchProducts()
  }, [])

  // fetch current subscription
  useEffect(() => {
    if (!stripeCustomerId) return
    const fetchSubscription = async () => {
      const res = await fetch(`/api/stripe/subscription?customer=${stripeCustomerId}`)
      const data = await res.json()
      setSubscriptionItems(data?.items?.data || [])
    }
    fetchSubscription()
  }, [stripeCustomerId])

  // fetch schedules (just log for now)
  useEffect(() => {
    const fetchSchedules = async () => {
      const res = await fetch('/api/stripe/schedules')
      const data = await res.json()
      console.log('📌 Subscription Schedules:', data)
    }
    fetchSchedules()
  }, [])

  // 🔑 Separate modules and add-ons
  const modules = products.filter((p) => !p.metadata?.module?.includes('addon') && p.metadata?.module !== 'base_module')

  const addons = products.filter((p) => p.metadata?.module?.includes('addon'))

  return (
    <div>
      <h2 className="text-2xl">Pricing Plan</h2>

      {/* Current subscription summary */}
      <Card className="mt-4 shadow-md p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-lg font-medium">Current Plan</p>
            {price && <p className="text-sm">{`$${price} / ${priceInterval}`}</p>}
            <p className="text-sm">{formattedExpiresDate}</p>
          </div>
          <Badge variant={badge.variant}>{badge.text}</Badge>
        </div>
      </Card>

      {/* Available Modules */}
      <h3 className="mt-8 text-lg font-semibold">Available Modules</h3>
      {loading ? (
        <p>Loading modules…</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {modules.map((p) => (
            <Card key={p.id} className="p-6 flex flex-col justify-between">
              <div>
                <h4 className="text-xl font-medium">{p.name}</h4>
                {p.description && <p className="text-sm text-gray-500">{p.description}</p>}
                <div className="mt-2 flex flex-col gap-2">
                  {p.prices.map((price) => (
                    <div key={price.id} className="flex justify-between items-center">
                      <span className="text-lg font-semibold">
                        ${price.unit_amount / 100} / {price.recurring?.interval}
                      </span>
                      <Button onClick={() => handleSubscribe(price.id)}>Add</Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Available Add-ons */}
      <h3 className="mt-8 text-lg font-semibold">Available Add-ons</h3>
      {loading ? (
        <p>Loading add-ons…</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {addons.map((p) => (
            <Card key={p.id} className="p-6 flex flex-col justify-between">
              <div>
                <h4 className="text-xl font-medium">{p.name}</h4>
                {p.description && <p className="text-sm text-gray-500">{p.description}</p>}
                <div className="mt-2 flex flex-col gap-2">
                  {p.prices.map((price) => (
                    <div key={price.id} className="flex justify-between items-center">
                      <span className="text-lg font-semibold">
                        ${price.unit_amount / 100} / {price.recurring?.interval}
                      </span>
                      <Button onClick={() => handleSubscribe(price.id)}>Add</Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Features */}
      <h4 className="mt-10 text-lg font-medium mb-4">Features in current plan</h4>
      <ul className="flex flex-col gap-y-2 text-gray-700">
        {features && features.length > 0 ? features.map((feature: string, index: number) => <FeatureItem key={index} feature={feature} />) : <p className="text-gray-500">No features listed.</p>}
      </ul>
    </div>
  )
}

const FeatureItem = ({ feature }: { feature: string }) => (
  <li className="flex items-center gap-2">
    <CircleCheck className="w-5 h-5 text-brand" />
    <p>{feature}</p>
  </li>
)

export default PricingPlan
