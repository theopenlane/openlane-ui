import { useOrganization } from '@/hooks/useOrganization'
import { useGetOrganizationBilling } from '@/lib/graphql-hooks/organization'
import { useOpenlaneProductsQuery, useOutstandingInvoiceDueDateQuery, useSchedulesQuery, useSwitchIntervalMutation, useUpcomingInvoiceQuery } from '@/lib/query-hooks/stripe'
import { type OrgSubscription } from '@repo/codegen/src/schema'
import React, { useCallback, useMemo, useState } from 'react'
import { formatDistanceToNowStrict, parseISO, isBefore } from 'date-fns'
import { type Price, type SchedulePhase, type SchedulePhaseItem, type SubscriptionItem } from '@/types/stripe'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useNotification } from '@/hooks/useNotification'
import { Badge } from '@repo/ui/badge'
import { formatDate } from '@/utils/date'
import { billingIntervalStyles } from './billing-settings.styles'

type BillingInterval = 'month' | 'year'

type Props = {
  stripeCustomerId: string | null | undefined
  activePriceIds: Set<string | Price>
  nextPhaseStart: Date | null
  currentInterval: BillingInterval | null
  stripeStatus: string | null
}

const BILLING_INTERVALS: readonly { value: BillingInterval; label: string }[] = [
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Annual (15% off)' },
]

const BillingSummary = ({ stripeCustomerId, activePriceIds, nextPhaseStart, currentInterval, stripeStatus }: Props) => {
  const { toggle, option } = billingIntervalStyles()
  const { currentOrgId } = useOrganization()
  const { data } = useGetOrganizationBilling(currentOrgId)
  const { data: schedules = [] } = useSchedulesQuery(stripeCustomerId)
  const scheduleId = schedules[0]?.id
  const subscriptionId = schedules[0]?.subscription?.id
  const { data: upcomingInvoice } = useUpcomingInvoiceQuery({
    customerId: stripeCustomerId,
    scheduleId,
    subscriptionId,
  })
  const subscription = data?.organization.orgSubscriptions?.[0] ?? ({} as OrgSubscription)
  const { expiresAt, active, stripeSubscriptionStatus, trialExpiresAt } = subscription
  // stripe is the source of truth, the org record only catches up once its webhook lands
  const status = stripeStatus ?? stripeSubscriptionStatus
  const { mutateAsync: switchInterval, isPending: updating } = useSwitchIntervalMutation()
  const [confirmSwitchOpen, setConfirmSwitchOpen] = useState(false)
  const trialExpirationDate = trialExpiresAt ? parseISO(trialExpiresAt) : null
  const [now] = useState(() => new Date())
  const trialEnded = trialExpirationDate ? isBefore(trialExpirationDate, now) : false
  const { errorNotification, successNotification } = useNotification()
  const { data: openlaneProducts } = useOpenlaneProductsQuery()

  const isSubscriptionCanceled = schedules[0]?.end_behavior === 'cancel'

  const modules = useMemo(() => Object.values(openlaneProducts?.modules || {}), [openlaneProducts])
  const addons = useMemo(() => Object.values(openlaneProducts?.addons || {}), [openlaneProducts])
  const modulesWithoutBase = useMemo(() => modules.filter((m) => m.display_name !== 'Base Module'), [modules])

  const activeAddons = useMemo(() => {
    return addons.filter((a) => {
      const priceForInterval = a.billing.prices.find((p) => p.interval === currentInterval)
      return priceForInterval && activePriceIds.has(priceForInterval.price_id)
    })
  }, [addons, currentInterval, activePriceIds])

  type Product = {
    billing: {
      prices: {
        interval: BillingInterval
        price_id: string
      }[]
    }
  }

  const buildSwaps = useCallback((modules: Product[], addons: Product[], currentInterval: BillingInterval) => {
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
    return buildSwaps(modules, addons, currentInterval)
  }, [modules, addons, currentInterval, buildSwaps])

  const calcPhaseCost = (phase: SchedulePhase): number => {
    if (!phase?.items) return 0
    return (
      phase.items.reduce((sum: number, item: SchedulePhaseItem) => {
        const price = (schedules[0]?.subscription?.items?.data || []).find((subItem: SubscriptionItem) => subItem.price?.id === item.price)?.price

        const unitAmount = price?.unit_amount ?? 0
        return sum + unitAmount
      }, 0) / 100
    )
  }

  const nextPhase = schedules?.[0]?.phases?.[1] ?? null

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
        {/* Switch billing interval */}

        {/* Active Modules */}
        {modulesWithoutBase.length > 0 && (
          <div className="flex gap-2 items-center p-4 pt-5 border-b">
            <p className="font-medium text-base w-28">Modules:</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {modulesWithoutBase
                .filter((m) => {
                  const priceForInterval = m.billing.prices.find((p) => p.interval === currentInterval)
                  return priceForInterval && activePriceIds.has(priceForInterval.price_id)
                })
                .map((m) => (
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
            <span className="text-sm text-gray-500">None</span>
          )}
        </div>
        <div className="flex gap-3 items-center p-4 pt-5">
          <span className="font-medium text-base w-28">Billing interval</span>
          <div className={toggle()} role="group" aria-label="Billing interval">
            {BILLING_INTERVALS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={currentInterval === value}
                disabled={updating || isSubscriptionCanceled || currentInterval === value}
                onClick={() => setConfirmSwitchOpen(true)}
                className={option({ active: currentInterval === value })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <ConfirmationDialog
        open={confirmSwitchOpen}
        onOpenChange={setConfirmSwitchOpen}
        onConfirm={() => {
          setConfirmSwitchOpen(false)
          handleSwitchInterval()
        }}
        title={currentInterval === 'month' ? 'Switch to annual billing?' : 'Switch to monthly billing?'}
        description={
          currentInterval === 'month' ? (
            <span className="block space-y-2">
              <span className="block">
                Your subscription will switch from <strong>monthly</strong> to <strong>annual</strong> billing.
              </span>
              <span className="block">The change takes effect at the end of your current billing period.</span>
            </span>
          ) : (
            <span className="block space-y-2">
              <span className="block">
                Your subscription will switch from <strong>annual</strong> to <strong>monthly</strong> billing.
              </span>
              <span className="block">The change takes effect at the end of your current billing period.</span>
            </span>
          )
        }
        confirmationText="Confirm"
        confirmationTextVariant="success"
      />
    </>
  )
}

export default BillingSummary
