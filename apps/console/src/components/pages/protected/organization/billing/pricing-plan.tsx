'use client'
import React, { useCallback, useEffect, useMemo } from 'react'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { formatDistanceToNowStrict, parseISO, isBefore } from 'date-fns'
import { useOrganization } from '@/hooks/useOrganization'
import { Card } from '@repo/ui/cardpanel'
import { useGetOrganizationBilling } from '@/lib/graphql-hooks/organization'
import { OrgSubscription } from '@repo/codegen/src/schema'
import { useOpenlaneProductsQuery, usePaymentMethodsQuery, useSchedulesQuery, useSwitchIntervalMutation, useUpdateScheduleMutation } from '@/lib/query-hooks/stripe'
import { ProductCard } from './product-card'
import { useNotification } from '@/hooks/useNotification'
import { useSearchParams } from 'next/navigation'

const PricingPlan = () => {
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const { data } = useGetOrganizationBilling(currentOrgId)
  const currentOrganization = getOrganizationByID(currentOrgId!)
  const { errorNotification, successNotification } = useNotification()
  const searchParams = useSearchParams()

  const stripeCustomerId = currentOrganization?.node?.stripeCustomerID

  const subscription = data?.organization.orgSubscriptions?.[0] ?? ({} as OrgSubscription)
  const { expiresAt, active, stripeSubscriptionStatus, trialExpiresAt, productPrice = {} } = subscription
  const { amount: price, interval: priceInterval } = productPrice

  const trialExpirationDate = trialExpiresAt ? parseISO(trialExpiresAt) : null
  const trialEnded = trialExpirationDate ? isBefore(trialExpirationDate, new Date()) : false

  const { data: openlaneProducts, isLoading: productsLoading } = useOpenlaneProductsQuery()
  const { data: schedules = [] } = useSchedulesQuery(stripeCustomerId)
  const { mutateAsync: updateSchedule, isPending: updating } = useUpdateScheduleMutation()
  const { mutateAsync: switchInterval } = useSwitchIntervalMutation()

  const { data: paymentData } = usePaymentMethodsQuery(stripeCustomerId)

  const badge = useMemo(() => {
    if (stripeSubscriptionStatus === 'trialing') return { variant: 'gold', text: 'Trial' } as const
    if (active) return { variant: 'default', text: 'Active' } as const
    if (!active) return { variant: 'destructive', text: 'Expired' } as const
    return { variant: 'destructive', text: 'Unknown' } as const
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

  const activePriceIds = useMemo(() => {
    if (!schedules?.length) return new Set<string>()
    const sub = schedules[0].subscription
    const items = sub?.items?.data || []
    return new Set(items.map((item) => item.price?.id || item.price))
  }, [schedules])

  const currentInterval = useMemo(() => {
    if (!schedules?.length) return null
    const firstItem = schedules[0].subscription?.items?.data?.[0]
    return firstItem?.price?.recurring?.interval ?? null
  }, [schedules])

  const endingPriceIds = useMemo(() => {
    if (!schedules?.length) return new Set<string>()

    const phases = schedules[0]?.phases || []
    if (phases.length < 2) return new Set<string>()

    const currentIds = new Set(phases[0].items.map((i) => i.price))
    const nextIds = new Set(phases[1].items.map((i) => i.price))

    const ending = Array.from(currentIds).filter((id) => !nextIds.has(id))
    return new Set(ending)
  }, [schedules])

  const nextPhaseStart = schedules?.[0]?.phases?.[1]?.start_date ? new Date(schedules[0].phases[1].start_date * 1000) : null

  const modules = Object.values(openlaneProducts?.modules || {})
  const addons = Object.values(openlaneProducts?.addons || {})

  type Product = {
    billing: {
      prices: {
        interval: 'month' | 'year'
        price_id: string
      }[]
    }
  }

  const buildSwaps = useCallback((modules: Product[], addons: Product[], currentInterval: 'month' | 'year') => {
    const allProducts = [...modules, ...addons]

    return allProducts
      .map((p) => {
        const monthly = p.billing.prices.find((pr) => pr.interval === 'month')
        const yearly = p.billing.prices.find((pr) => pr.interval === 'year')

        if (!monthly || !yearly) return null

        return currentInterval === 'month' ? { from: monthly.price_id, to: yearly.price_id } : { from: yearly.price_id, to: monthly.price_id }
      })
      .filter((swap): swap is { from: string; to: string } => swap !== null)
  }, [])

  const swaps = useMemo(() => {
    if (!currentInterval) return []
    return buildSwaps(modules, addons, currentInterval as 'month' | 'year')
  }, [modules, addons, currentInterval, buildSwaps])

  const handleSubscribe = async (priceId: string) => {
    if (!paymentData?.hasPaymentMethod) {
      errorNotification({
        title: 'Payment method required',
        description: 'Please add a payment method before subscribing.',
      })
      return
    }

    try {
      await updateSchedule({
        scheduleId: schedules[0].id,
        priceId,
        action: 'subscribe',
      })
      successNotification({
        title: 'Subscribed successfully',
        description: 'Your subscription has been updated.',
      })
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unable to subscribe to this plan.'
      errorNotification({
        title: 'Subscription failed',
        description: error,
      })
    }
  }

  const handleUnsubscribe = async (priceId: string) => {
    try {
      await updateSchedule({
        scheduleId: schedules[0].id,
        priceId,
        action: 'unsubscribe',
      })
      successNotification({
        title: 'Unsubscribed successfully',
        description: 'Your subscription has been updated.',
      })
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unable to unsubscribe from this plan.'
      errorNotification({
        title: 'Unsubscribe failed',
        description: error,
      })
    }
  }

  const handleSwitchInterval = async () => {
    try {
      await switchInterval({ scheduleId: schedules[0].id, swaps })
      successNotification({
        title: 'Interval switched',
        description: 'Your billing interval has been updated.',
      })
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unable to switch billing interval.'
      errorNotification({
        title: 'Switch failed',
        description: error,
      })
    }
  }

  useEffect(() => {
    const paymentUpdate = searchParams.get('paymentUpdate')

    if (paymentUpdate === 'success') {
      successNotification({
        title: 'Payment method updated',
        description: 'Your payment method was successfully added.',
      })
    }
  }, [searchParams, successNotification])

  return (
    <div className="min-w-[500px]">
      <h2 className="text-2xl">Pricing Plan</h2>
      {/* Current subscription summary */}
      <Card className="my-4 shadow-md p-4 max-w-[350px]">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-lg font-medium">Current Plan</p>
            {!!price && <p className="text-sm">{`$${price} / ${priceInterval}`}</p>}
            <p className="text-sm">{formattedExpiresDate}</p>
          </div>
          <Badge variant={badge.variant}>{badge.text}</Badge>
        </div>
      </Card>
      {/* Switch billing interval */}
      {currentInterval === 'month' && (
        <Button disabled={updating} onClick={handleSwitchInterval}>
          Switch to annual
        </Button>
      )}
      {currentInterval === 'year' && (
        <Button disabled={updating} onClick={handleSwitchInterval}>
          Switch to monthly
        </Button>
      )}

      {/* Available Modules */}
      <h3 className="mt-8 text-lg font-semibold">Available Modules</h3>
      {productsLoading ? (
        <p>Loading modules…</p>
      ) : (
        <div className="flex flex-wrap gap-6 mt-4">
          {modules
            .filter((m) => m.display_name !== 'Base Module')
            .map((p) => (
              <ProductCard
                key={p.product_id}
                product={p}
                currentInterval={currentInterval}
                activePriceIds={activePriceIds}
                endingPriceIds={endingPriceIds}
                nextPhaseStart={nextPhaseStart}
                updating={updating}
                onSubscribe={handleSubscribe}
                onUnsubscribe={handleUnsubscribe}
              />
            ))}
        </div>
      )}
      {/* Available Add-ons */}
      <h3 className="mt-8 text-lg font-semibold">Available Add-ons</h3>
      {productsLoading ? (
        <p>Loading add-ons…</p>
      ) : (
        <div className="flex flex-wrap gap-6 mt-4">
          {addons.map((p) => (
            <ProductCard
              key={p.product_id}
              product={p}
              currentInterval={currentInterval}
              activePriceIds={activePriceIds}
              endingPriceIds={endingPriceIds}
              nextPhaseStart={nextPhaseStart}
              updating={updating}
              onSubscribe={handleSubscribe}
              onUnsubscribe={handleUnsubscribe}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default PricingPlan
