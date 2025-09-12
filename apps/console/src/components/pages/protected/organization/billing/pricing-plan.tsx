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
import { useProductsQuery, useSchedulesQuery, useSwitchIntervalMutation, useUpdateScheduleMutation } from '@/lib/query-hooks/stripe'
import { formatDate } from '@/utils/date'

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

  const stripeCustomerId = currentOrganization?.node?.stripeCustomerID

  const subscription = data?.organization.orgSubscriptions?.[0] ?? ({} as OrgSubscription)
  const { expiresAt, active, stripeSubscriptionStatus, trialExpiresAt, productPrice = {}, features = [] } = subscription
  const { amount: price, interval: priceInterval } = productPrice

  const trialExpirationDate = trialExpiresAt ? parseISO(trialExpiresAt) : null
  const trialEnded = trialExpirationDate ? isBefore(trialExpirationDate, new Date()) : false

  const { data: products = [], isLoading: productsLoading } = useProductsQuery()
  const { data: schedules = [], isLoading: schedulesLoading } = useSchedulesQuery(stripeCustomerId)
  const { mutate: updateSchedule, isPending: updating } = useUpdateScheduleMutation()
  const { mutate: switchInterval, isPending: switching } = useSwitchIntervalMutation()

  console.log('products', products)
  console.log('schedules', schedules)

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

  // Collect active price IDs from the current subscription
  const activePriceIds = useMemo(() => {
    if (!schedules?.length) return new Set<string>()
    const sub = schedules[0].subscription
    const items = sub?.items?.data || []
    return new Set(items.map((item: any) => item.price?.id || item.price))
  }, [schedules])

  const currentInterval = useMemo(() => {
    if (!schedules?.length) return null
    const firstItem = schedules[0].subscription?.items?.data?.[0]
    return firstItem?.price?.recurring?.interval ?? null
  }, [schedules])

  function buildPriceMap(products: StripeProduct[]) {
    const map: Record<string, string> = {}
    for (const product of products) {
      const monthly = product.prices.find((p) => p.recurring?.interval === 'month')
      const yearly = product.prices.find((p) => p.recurring?.interval === 'year')
      // Only include if both exist
      if (monthly && yearly) {
        map[monthly.id] = yearly.id
        map[yearly.id] = monthly.id
      }
    }
    return map
  }

  function getSwappedPrices(activePriceIds: Set<string>, priceMap: Record<string, string>) {
    const swaps: { from: string; to: string }[] = []
    activePriceIds.forEach((id) => {
      if (priceMap[id]) {
        swaps.push({ from: id, to: priceMap[id] })
      }
    })
    return swaps
  }

  useEffect(() => {
    if (!schedules?.length || !products?.length) return

    schedules.forEach((schedule: any) => {
      const sub = schedule.subscription
      const org = sub?.metadata?.organization_name || 'N/A'
      const trialEnd = sub?.trial_end ? new Date(sub.trial_end * 1000).toLocaleDateString() : '—'

      console.group(`📌 Org: ${org}`)
      console.log('🆔 Subscription ID:', sub?.id)
      console.log('📅 Trial Ends:', trialEnd)

      const priceMap: Record<string, string> = {}

      products.forEach((p) => {
        if (p.prices?.length) {
          p.prices.forEach((price) => {
            priceMap[price.id] = p.name
          })
        }
        priceMap[p.id] = p.name
      })

      const items = sub?.items?.data || []
      items.forEach((item: any) => {
        const priceId = item.price?.id || item.price
        const productId = item.price?.product
        const productName = priceMap[priceId] || priceMap[productId] || 'Unknown Product'

        const amount = item.price?.unit_amount ?? item.plan?.amount ?? 0
        const currency = item.price?.currency ?? item.plan?.currency ?? 'usd'
        const interval = item.price?.recurring?.interval ?? item.plan?.interval ?? 'month'

        console.log(`📦 ${productName} → ${amount / 100} ${currency.toUpperCase()}/${interval}`)
      })

      console.groupEnd()
    })
  }, [schedules, products])

  // 🔑 Separate modules and add-ons
  const modules = products.filter((p) => !p.metadata?.module?.includes('addon') && p.metadata?.module !== 'base_module')

  const addons = products.filter((p) => p.metadata?.module?.includes('addon'))

  const priceMap = buildPriceMap(products)
  const swaps = getSwappedPrices(activePriceIds, priceMap)

  const endingPriceIds = useMemo(() => {
    if (!schedules?.length) return new Set<string>()

    const phases = schedules[0]?.phases || []
    if (phases.length < 2) return new Set<string>()

    const currentPhase = phases[0]
    const nextPhase = phases[1]

    const currentIds = new Set(currentPhase.items.map((i: any) => i.price))
    const nextIds = new Set(nextPhase.items.map((i: any) => i.price))

    // IDs present now but not in the next phase
    const ending = Array.from(currentIds).filter((id) => !nextIds.has(id))
    return new Set(ending)
  }, [schedules])

  const nextPhaseStart = schedules?.[0]?.phases?.[1]?.start_date ? new Date(schedules[0].phases[1].start_date * 1000) : null

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

      {currentInterval === 'month' && (
        <Button
          disabled={updating}
          onClick={() =>
            switchInterval(
              { scheduleId: schedules[0].id, swaps },
              {
                onSuccess: (data) => {
                  console.log('✅ Response:', data)
                  // if error occurred inside API you’ll also see debugPayload
                },
                onError: (err) => {
                  console.error('❌ Switch error:', err.error)
                  console.log('📦 Debug payload:', err.debugPayload)
                },
              },
            )
          }
        >
          Switch to annual
        </Button>
      )}

      {currentInterval === 'year' && (
        <Button
          disabled={updating}
          onClick={() =>
            switchInterval({
              scheduleId: schedules[0].id,
              swaps,
            })
          }
        >
          Switch to monthly
        </Button>
      )}

      {/* Available Modules */}
      <h3 className="mt-8 text-lg font-semibold">Available Modules</h3>
      {productsLoading ? (
        <p>Loading modules…</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {modules.map((p) => {
            const priceForCurrentInterval = p.prices.find((price) => price.recurring?.interval === currentInterval)
            if (!priceForCurrentInterval) return null

            const alreadySubscribed = activePriceIds.has(priceForCurrentInterval.id)

            return (
              <Card key={p.id} className="p-6 flex flex-col justify-between">
                <div>
                  <h4 className="text-xl font-medium">{p.name}</h4>
                  {p.description && <p className="text-sm text-gray-500">{p.description}</p>}

                  {/* show all prices */}
                  <div className="mt-2 flex flex-col gap-1 text-sm text-gray-600">
                    {p.prices.map((price) => (
                      <span key={price.id}>
                        ${price.unit_amount / 100} / {price.recurring?.interval}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3">
                    {alreadySubscribed ? (
                      endingPriceIds.has(priceForCurrentInterval.id) ? (
                        <Button disabled>Ends at {formatDate(nextPhaseStart?.toISOString())}</Button>
                      ) : (
                        <Button
                          variant="destructive"
                          disabled={updating}
                          onClick={() =>
                            updateSchedule({
                              scheduleId: schedules[0].id,
                              priceId: priceForCurrentInterval.id,
                              action: 'remove',
                            })
                          }
                        >
                          Cancel
                        </Button>
                      )
                    ) : (
                      <Button
                        disabled={updating}
                        onClick={() =>
                          updateSchedule({
                            scheduleId: schedules[0].id,
                            priceId: priceForCurrentInterval.id,
                            action: 'add',
                          })
                        }
                      >
                        Add
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Available Add-ons */}
      <h3 className="mt-8 text-lg font-semibold">Available Add-ons</h3>
      {productsLoading ? (
        <p>Loading add-ons…</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {addons.map((p) => {
            const priceForCurrentInterval = p.prices.find((price) => price.recurring?.interval === currentInterval)
            if (!priceForCurrentInterval) return null

            const alreadySubscribed = activePriceIds.has(priceForCurrentInterval.id)

            return (
              <Card key={p.id} className="p-6 flex flex-col justify-between">
                <div>
                  <h4 className="text-xl font-medium">{p.name}</h4>
                  {p.description && <p className="text-sm text-gray-500">{p.description}</p>}

                  <div className="mt-2 flex flex-col gap-1 text-sm text-gray-600">
                    {p.prices.map((price) => (
                      <span key={price.id}>
                        ${price.unit_amount / 100} / {price.recurring?.interval}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3">
                    {alreadySubscribed ? (
                      <Button
                        variant="destructive"
                        disabled={updating}
                        onClick={() =>
                          updateSchedule({
                            scheduleId: schedules[0].id,
                            priceId: priceForCurrentInterval.id,
                            action: 'remove',
                          })
                        }
                      >
                        Cancel
                      </Button>
                    ) : (
                      <Button
                        disabled={updating}
                        onClick={() =>
                          updateSchedule({
                            scheduleId: schedules[0].id,
                            priceId: priceForCurrentInterval.id,
                            action: 'add',
                          })
                        }
                      >
                        Add
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
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
