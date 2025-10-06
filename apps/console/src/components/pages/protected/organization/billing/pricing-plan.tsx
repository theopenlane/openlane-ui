'use client'
import React, { useEffect, useMemo } from 'react'

import { useOrganization } from '@/hooks/useOrganization'
import { useOpenlaneProductsQuery, usePaymentMethodsQuery, useSchedulesQuery, useUpdateScheduleMutation } from '@/lib/query-hooks/stripe'
import { ProductCard } from './product-card'
import { useNotification } from '@/hooks/useNotification'
import { useSearchParams } from 'next/navigation'
import BillingSummary from './billing-summary'
import BillingSettings from './billing-settings'
import SideNavigation from './side-navigation'

const PricingPlan = () => {
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId!)
  const { errorNotification, successNotification } = useNotification()
  const searchParams = useSearchParams()

  const stripeCustomerId = currentOrganization?.node?.stripeCustomerID

  const { data: openlaneProducts, isLoading: productsLoading } = useOpenlaneProductsQuery()
  const { data: schedules = [] } = useSchedulesQuery(stripeCustomerId)
  const { mutateAsync: updateSchedule, isPending: updating } = useUpdateScheduleMutation()

  const { data: paymentData } = usePaymentMethodsQuery(stripeCustomerId)

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

  const nextOrCurrentPhase = schedules?.[0]?.phases?.[1] || schedules?.[0]?.phases?.[0] || null

  const nextPhaseActivePriceIds = useMemo(() => {
    if (!nextOrCurrentPhase) return new Set<string>()
    return new Set(nextOrCurrentPhase.items.map((i) => i.price))
  }, [nextOrCurrentPhase])

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
  const isSubscriptionCanceled = schedules[0]?.end_behavior === 'cancel'

  const modules = Object.values(openlaneProducts?.modules || {})
  const modulesWithoutBase = modules.filter((m) => m.display_name !== 'Base Module')

  const nextPhaseModulesNumber = useMemo(() => {
    if (!nextOrCurrentPhase || !currentInterval) return 0

    return modulesWithoutBase.filter((m) => {
      const priceForInterval = m.billing.prices.find((p) => p.interval === currentInterval)
      if (!priceForInterval) return false
      return nextPhaseActivePriceIds.has(priceForInterval.price_id)
    }).length
  }, [modulesWithoutBase, nextOrCurrentPhase, nextPhaseActivePriceIds, currentInterval])

  const addons = Object.values(openlaneProducts?.addons || {})

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

  const paymentUpdate = searchParams.get('paymentUpdate')

  useEffect(() => {
    if (paymentUpdate === 'success') {
      successNotification({
        title: 'Payment method updated',
        description: 'Your payment method was successfully added.',
      })
    }
  }, [paymentUpdate, successNotification])

  return (
    <div className="flex relative">
      <SideNavigation />

      <div className="max-w-[1000px] ml-14">
        <BillingSummary activePriceIds={activePriceIds} stripeCustomerId={stripeCustomerId} nextPhaseStart={nextPhaseStart} />
        <>
          {!!schedules[0] && (
            <div>
              {/* Available Modules */}
              <h3 id="modules" className="mt-8 text-2xl">
                Modules
              </h3>
              {productsLoading ? (
                <p>Loading modules…</p>
              ) : (
                <div className="flex flex-col mt-4 w-full">
                  {modulesWithoutBase.map((p) => (
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
                      isOnlyActiveModule={nextPhaseModulesNumber === 1}
                      isSubscriptionCanceled={isSubscriptionCanceled}
                    />
                  ))}
                </div>
              )}
              {/* Available Add-ons */}
              <h3 id="addons" className="mt-8 text-2xl">
                Add-ons
              </h3>
              {productsLoading ? (
                <p>Loading add-ons…</p>
              ) : (
                <div className="flex flex-col mt-4 w-full">
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
                      isSubscriptionCanceled={isSubscriptionCanceled}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
        <BillingSettings />
      </div>
    </div>
  )
}

export default PricingPlan
