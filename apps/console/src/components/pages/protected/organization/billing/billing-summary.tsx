import { useOrganization } from '@/hooks/useOrganization'
import { useGetOrganizationBilling } from '@/lib/graphql-hooks/organization'
import { useOpenlaneProductsQuery, useSchedulesQuery, useSwitchIntervalMutation } from '@/lib/query-hooks/stripe'
import { OrgSubscription } from '@repo/codegen/src/schema'
import React, { useCallback, useMemo, useState } from 'react'
import { formatDistanceToNowStrict, parseISO, isBefore } from 'date-fns'
import { Price, SchedulePhase, SchedulePhaseItem, SubscriptionItem } from '@/types/stripe'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useNotification } from '@/hooks/useNotification'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { formatDate } from '@/utils/date'

type Props = {
  stripeCustomerId: string | null | undefined
  activePriceIds: Set<string | Price>
  nextPhaseStart: Date | null
}

const BillingSummary = ({ stripeCustomerId, activePriceIds, nextPhaseStart }: Props) => {
  const { currentOrgId } = useOrganization()
  const { data } = useGetOrganizationBilling(currentOrgId)
  const { data: schedules = [] } = useSchedulesQuery(stripeCustomerId)
  const subscription = data?.organization.orgSubscriptions?.[0] ?? ({} as OrgSubscription)
  const { expiresAt, active, stripeSubscriptionStatus, trialExpiresAt } = subscription
  const { mutateAsync: switchInterval, isPending: updating } = useSwitchIntervalMutation()
  const [confirmSwitchOpen, setConfirmSwitchOpen] = useState(false)
  const trialExpirationDate = trialExpiresAt ? parseISO(trialExpiresAt) : null
  const trialEnded = trialExpirationDate ? isBefore(trialExpirationDate, new Date()) : false
  const { errorNotification, successNotification } = useNotification()
  const { data: openlaneProducts } = useOpenlaneProductsQuery()

  const currentInterval = useMemo(() => {
    if (!schedules?.length) return null
    const firstItem = schedules[0].subscription?.items?.data?.[0]
    return firstItem?.price?.recurring?.interval ?? null
  }, [schedules])

  const modules = Object.values(openlaneProducts?.modules || {})
  const addons = Object.values(openlaneProducts?.addons || {})
  const modulesWithoutBase = modules.filter((m) => m.display_name !== 'Base Module')

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

  const futureCost = calcPhaseCost(nextPhase)

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
      <h2 className="text-3xl my-2">Summary</h2>
      <div className="border-y py-4">
        {/* Current subscription summary */}
        <div className="flex gap-4 items-center">
          {/* Interval + Cost */}
          {currentInterval && !!futureCost && (
            <p className="text-sm">
              <span className="text-sm font-medium">Interval:</span> {currentInterval.charAt(0).toUpperCase() + currentInterval.slice(1)}{' '}
              <span className="ml-4 font-medium text-sm">Upcoming cost:</span> ${futureCost} / {currentInterval}
            </p>
          )}
          {/* Expiration */}
          <Badge variant={badge.variant}>{badge.text}</Badge>
        </div>
        {/* Switch billing interval */}

        {/* Active Modules */}
        {modulesWithoutBase.length > 0 && (
          <div className="mt-4 flex gap-2 items-center">
            <p className="text-sm font-medium">Modules:</p>
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
        {addons.length > 0 && (
          <div className="mt-4 flex gap-2 items-center">
            <p className="text-sm font-medium">Add-Ons:</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {addons
                .filter((a) => {
                  const priceForInterval = a.billing.prices.find((p) => p.interval === currentInterval)
                  return priceForInterval && activePriceIds.has(priceForInterval.price_id)
                })
                .map((a) => (
                  <Badge key={a.product_id} variant="outline">
                    {a.display_name}
                  </Badge>
                ))}
            </div>
          </div>
        )}
        <div className="flex gap-3 items-center">
          {trialExpiresAt ? (
            <div className="mt-4 flex items-center gap-2">
              <p className=" text-sm font-medium">Trial status:</p>
              <p className="text-xs text-text-informational mt-1">{formattedExpiresDate}</p>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2">
              <p className=" text-sm font-medium">Next billing:</p>
              <p className="text-xs text-text-informational mt-1">{nextPhaseStart ? formatDate(nextPhaseStart.toISOString()) : 'N/A'}</p>
            </div>
          )}
          {currentInterval && (
            <Button className="h-7 p-2 mt-4" disabled={updating} onClick={() => setConfirmSwitchOpen(true)}>
              {currentInterval === 'month' ? 'Switch to annual' : 'Switch to monthly'}
            </Button>
          )}
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
            <div className="space-y-2">
              <span>
                Your subscription will switch from <strong>monthly</strong> to <strong>annual</strong> billing.
              </span>
              <span>The change takes effect at the end of your current billing period.</span>
            </div>
          ) : (
            <div className="space-y-2">
              <span>
                Your subscription will switch from <strong>annual</strong> to <strong>monthly</strong> billing.
              </span>
              <span>The change takes effect at the end of your current billing period.</span>
            </div>
          )
        }
        confirmationText="Confirm"
        confirmationTextVariant="success"
      />
    </>
  )
}

export default BillingSummary
