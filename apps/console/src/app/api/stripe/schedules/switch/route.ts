import { billingResourceNotFound, withBillingCustomer } from '@/lib/server/billing-customer'
import { getStripe, priceIdOf, retrieveCustomerSchedule, stripeErrorDetails } from '@/lib/stripe'
import { fetchCatalog } from '@/lib/server/fetch-catalog'
import { toPhaseParams } from '@/lib/server/schedule-phase'
import { FULL_CATALOG } from '@/lib/billing/product-catalog'
import {
  BILLING_INTERVALS,
  intervalSwitchBlockedReason,
  isCurrentOrFuturePhase,
  planIntervalSwitch,
  scheduleSwitchBlockedReason,
  SWITCH_UNAVAILABLE_REASON,
  switchingPriceIds,
} from '@/lib/billing/interval-switch'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { z } from 'zod'

const switchIntervalBody = z.object({
  scheduleId: z.string().min(1),
  interval: z.enum(BILLING_INTERVALS),
})

const conflict = (error: string) => NextResponse.json({ error }, { status: 409 })

export const POST = withBillingCustomer(async (customerId, req) => {
  const body = switchIntervalBody.safeParse(await req.json().catch(() => null))

  if (!body.success) {
    return NextResponse.json({ error: 'scheduleId and an interval of "month" or "year" are required' }, { status: 400 })
  }

  const { scheduleId, interval } = body.data

  try {
    const [schedule, catalog] = await Promise.all([retrieveCustomerSchedule(scheduleId, customerId), fetchCatalog(FULL_CATALOG)])
    if (!schedule) {
      return billingResourceNotFound()
    }

    const scheduleBlockedReason = scheduleSwitchBlockedReason(schedule)
    const currentPhase = schedule.current_phase
    if (scheduleBlockedReason || !currentPhase) {
      return conflict(scheduleBlockedReason ?? SWITCH_UNAVAILABLE_REASON)
    }

    const plan = planIntervalSwitch(
      catalog,
      switchingPriceIds(
        schedule.phases.map((phase) => ({ start_date: phase.start_date, items: phase.items.map((item) => ({ price: priceIdOf(item.price) })) })),
        currentPhase,
      ),
      interval,
    )

    const blockedReason = intervalSwitchBlockedReason(plan, interval)
    if (blockedReason) {
      console.warn('[billing] interval switch blocked', { scheduleId, interval, unswitchableProducts: plan.unswitchableProducts, unknownPriceIds: plan.unknownPriceIds })
      return conflict(blockedReason)
    }

    const swapTargets = new Map(plan.swaps.map(({ from, to }) => [from, to]))

    const phases = schedule.phases.map((phase) => (isCurrentOrFuturePhase(phase, currentPhase) ? toPhaseParams(phase, (priceId) => swapTargets.get(priceId) ?? priceId) : toPhaseParams(phase)))

    const updated = await getStripe().subscriptionSchedules.update(scheduleId, { phases })

    return NextResponse.json({ scheduleId, interval, swaps: plan.swaps, updated })
  } catch (err: unknown) {
    console.error('[billing] Failed to switch billing interval', { scheduleId, interval, ...stripeErrorDetails(err) })

    if (err instanceof Stripe.errors.StripeInvalidRequestError) {
      return conflict("Your subscription couldn't be switched. Contact support to change your billing interval.")
    }

    return NextResponse.json({ error: 'Failed to switch billing interval. Please try again later.' }, { status: 500 })
  }
})
