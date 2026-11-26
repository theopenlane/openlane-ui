import { useOrganization } from '@/hooks/useOrganization'
import { useGetOrganizationBilling } from '@/lib/graphql-hooks/organization'
import { useOutstandingInvoiceDueDateQuery, useSchedulesQuery, useUpcomingInvoiceQuery } from '@/lib/query-hooks/stripe'
import { type OrgSubscription } from '@repo/codegen/src/schema'
import React, { useCallback, useMemo, useState } from 'react'
import { formatDistanceToNowStrict, parseISO, isBefore } from 'date-fns'
import { type BillingInterval, type OpenlaneProductsResponse, type SchedulePhase, type SchedulePhaseItem, type SubscriptionItem } from '@/types/stripe'
import { Badge } from '@repo/ui/badge'
import { formatDate } from '@/utils/date'
import { isBaseModule, isProductActive } from '@/lib/billing/product-catalog'
import BillingIntervalSwitch from './billing-interval-switch'

type Props = {
  catalog: OpenlaneProductsResponse | undefined
  stripeCustomerId: string | null | undefined
  subscriptionId: string | undefined
  activePriceIds: ReadonlySet<string>
  nextPhaseStart: Date | null
  currentInterval: BillingInterval | null
  stripeStatus: string | null
}

const BillingSummary = ({ catalog, stripeCustomerId, subscriptionId, activePriceIds, nextPhaseStart, currentInterval, stripeStatus }: Props) => {
  const { currentOrgId } = useOrganization()
  const { data } = useGetOrganizationBilling(currentOrgId)
  const { data: schedules = [] } = useSchedulesQuery(stripeCustomerId)
  const schedule = schedules[0]
  const scheduleId = schedule?.id
  const { data: upcomingInvoice } = useUpcomingInvoiceQuery({
    customerId: stripeCustomerId,
    scheduleId,
    subscriptionId,
  })
  const subscription = data?.organization.orgSubscriptions?.[0] ?? ({} as OrgSubscription)
  const { expiresAt, active, stripeSubscriptionStatus, trialExpiresAt } = subscription
  // stripe is the source of truth, the org record only catches up once its webhook lands
  const status = stripeStatus ?? stripeSubscriptionStatus
  const trialExpirationDate = trialExpiresAt ? parseISO(trialExpiresAt) : null
  const [now] = useState(() => new Date())
  const trialEnded = trialExpirationDate ? isBefore(trialExpirationDate, now) : false

  const activeModules = useMemo(
    () => Object.values(catalog?.modules ?? {}).filter((m) => !isBaseModule(m) && isProductActive(m, currentInterval, activePriceIds)),
    [catalog, currentInterval, activePriceIds],
  )
  const activeAddons = useMemo(() => Object.values(catalog?.addons ?? {}).filter((a) => isProductActive(a, currentInterval, activePriceIds)), [catalog, currentInterval, activePriceIds])

  const calcPhaseCost = (phase: SchedulePhase): number => {
    if (!phase?.items) return 0
    return (
      phase.items.reduce((sum: number, item: SchedulePhaseItem) => {
        const price = (schedule?.subscription?.items?.data || []).find((subItem: SubscriptionItem) => subItem.price?.id === item.price)?.price

        const unitAmount = price?.unit_amount ?? 0
        return sum + unitAmount
      }, 0) / 100
    )
  }

  const nextPhase = schedule?.phases?.[1] ?? null

  const fallbackFutureCost = calcPhaseCost(nextPhase)
  const currency = upcomingInvoice?.currency?.toUpperCase() || 'USD'

  const futureCost = useMemo(() => {
    if (upcomingInvoice) {
      const totalCents = upcomingInvoice.total_excluding_tax ?? upcomingInvoice.total
      return totalCents / 100
    }

    return fallbackFutureCost
  }, [upcomingInvoice, fallbackFutureCost])

  const formatCurrency = useCallback(
    (amount: number) => {
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount)
      } catch {
        return `$${amount.toFixed(2)}`
      }
    },
    [currency],
  )

  const discountAmount = useMemo(() => {
    return (upcomingInvoice?.total_discount ?? 0) / 100
  }, [upcomingInvoice])

  const formattedFutureCost = useMemo(() => formatCurrency(futureCost), [futureCost, formatCurrency])
  const formattedDiscount = useMemo(() => formatCurrency(discountAmount), [discountAmount, formatCurrency])
  const hasDiscount = discountAmount > 0

  const subscriptionState = useMemo(() => {
    switch (status) {
      case 'trialing':
        return { variant: 'gold', text: 'Trial', expired: false, awaitingPayment: false } as const
      case 'past_due':
        return { variant: 'destructive', text: 'Past due', expired: false, awaitingPayment: true } as const
      case 'unpaid':
        return { variant: 'destructive', text: 'Unpaid', expired: false, awaitingPayment: true } as const
      case 'incomplete':
        return { variant: 'destructive', text: 'Incomplete', expired: false, awaitingPayment: false } as const
      case 'paused':
        return { variant: 'select', text: 'Paused', expired: false, awaitingPayment: false } as const
      case 'canceled':
      case 'incomplete_expired':
        return { variant: 'destructive', text: 'Expired', expired: true, awaitingPayment: false } as const
      case 'active':
        return { variant: 'default', text: 'Active', expired: false, awaitingPayment: false } as const
    }

    if (active) return { variant: 'default', text: 'Active', expired: false, awaitingPayment: false } as const
    return { variant: 'destructive', text: 'Expired', expired: true, awaitingPayment: false } as const
  }, [status, active])

  const { data: outstandingInvoiceDueDate, isPending: outstandingInvoicePending } = useOutstandingInvoiceDueDateQuery(subscriptionState.awaitingPayment ? stripeCustomerId : null)

  const showTrialStatus = status === 'trialing' && !!trialExpiresAt
  const showNextBilling = !showTrialStatus && !subscriptionState.expired && !(subscriptionState.awaitingPayment && outstandingInvoicePending)
  const nextBillingDate = subscriptionState.awaitingPayment && outstandingInvoiceDueDate ? outstandingInvoiceDueDate : nextPhaseStart

  const formattedExpiresDate = useMemo(() => {
    try {
      if (status === 'trialing') {
        const expirationDate = parseISO(trialExpiresAt)
        return `Expires in ${formatDistanceToNowStrict(expirationDate, { addSuffix: false })}`
      }
      if (!expiresAt && trialEnded) return 'Expired'

      const expirationDate = parseISO(expiresAt)
      if (isBefore(expirationDate, now)) return 'Expired'

      return `Expires in ${formatDistanceToNowStrict(expirationDate, { addSuffix: false })}`
    } catch {
      return 'N/A'
    }
  }, [expiresAt, status, trialExpiresAt, trialEnded, now])

  return (
    <>
      <h2 id="summary" className="text-2xl mb-2">
        Summary
      </h2>
      <div className="border rounded-lg">
        {/* Current subscription summary */}
        <div className="flex gap-2.5 items-center justify-between p-4 pt-5 border-b">
          <div className="flex gap-2">
            {/* Interval + Cost */}
            {currentInterval && (
              <div className="flex flex-col">
                <p className="text-base">
                  <span className="font-medium text-base w-28 inline-block mr-2">Upcoming cost</span> {formattedFutureCost} / {currentInterval}
                </p>
                {hasDiscount && (
                  <p className="text-sm text-text-informational">
                    <span className="font-medium w-28 inline-block mr-2">Discount applied</span>-{formattedDiscount}
                  </p>
                )}
              </div>
            )}
            {/* Expiration */}
            <Badge variant={subscriptionState.variant}>{subscriptionState.text}</Badge>
          </div>
          {showTrialStatus && (
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-text-informational">Trial status:</p>
              <p className="text-sm text-text-informational">{formattedExpiresDate}</p>
            </div>
          )}
          {showNextBilling && (
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Next billing:</p>
              <p className="text-sm text-text-informational">{nextBillingDate ? formatDate(nextBillingDate.toISOString()) : 'N/A'}</p>
            </div>
          )}
        </div>
        {/* Active Modules */}
        {activeModules.length > 0 && (
          <div className="flex gap-2 items-center p-4 pt-5 border-b">
            <p className="font-medium text-base w-28">Modules:</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {activeModules.map((m) => (
                <Badge key={m.product_id} variant="outline">
                  {m.display_name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Active Add-Ons */}
        <div className="flex gap-2 items-center p-4 pt-5 border-b">
          <p className="font-medium text-base w-28">Add-Ons:</p>
          {activeAddons.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-1">
              {activeAddons.map((a) => (
                <Badge key={a.product_id} variant="outline">
                  {a.display_name}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">None</span>
          )}
        </div>
        <BillingIntervalSwitch catalog={catalog} schedules={schedules} currentInterval={currentInterval} isTrialing={status === 'trialing'} />
      </div>
    </>
  )
}

export default BillingSummary
