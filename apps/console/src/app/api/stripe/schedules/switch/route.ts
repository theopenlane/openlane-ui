import { billingResourceNotFound, withBillingCustomer } from '@/lib/server/billing-customer'
import { getStripe, retrieveCustomerSchedule } from '@/lib/stripe'
import { fetchCatalogPrices, isSameCatalogProduct } from '@/lib/server/product-catalog'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

interface Swap {
  from: string
  to: string
}

interface RequestBody {
  scheduleId: string
  swaps: Swap[]
}

export const POST = withBillingCustomer(async (customerId, req) => {
  try {
    const { scheduleId, swaps } = (await req.json()) as RequestBody

    if (!scheduleId || !Array.isArray(swaps) || swaps.length === 0) {
      return NextResponse.json({ error: 'scheduleId and swaps[] are required' }, { status: 400 })
    }

    const catalog = await fetchCatalogPrices()
    if (!swaps.every((swap) => isSameCatalogProduct(catalog, swap.from, swap.to))) {
      return NextResponse.json({ error: 'Each swap must stay within the same product' }, { status: 400 })
    }

    const schedule = await retrieveCustomerSchedule(scheduleId, customerId)
    if (!schedule) {
      return billingResourceNotFound()
    }

    const currentPhase = schedule.current_phase
    if (!currentPhase) {
      return NextResponse.json({ error: 'Schedule has no current_phase' }, { status: 400 })
    }

    const phases: Stripe.SubscriptionScheduleUpdateParams.Phase[] = schedule.phases.map((phase) => {
      const normalized: Stripe.SubscriptionScheduleUpdateParams.Phase = {
        start_date: phase.start_date,
        end_date: phase.end_date,
        currency: phase.currency,
        proration_behavior: phase.proration_behavior ?? 'create_prorations',
        add_invoice_items: (phase.add_invoice_items ?? []).map(
          (item) =>
            ({
              price: typeof item.price === 'string' ? item.price : item.price.id,
              quantity: item.quantity,
              discounts: (item.discounts ?? []).map((d) => ({
                coupon: typeof d.coupon === 'string' ? d.coupon : (d.coupon?.id ?? undefined),
              })),
            }) as Stripe.SubscriptionScheduleUpdateParams.Phase.AddInvoiceItem,
        ),
        items: phase.items.map((i) => ({
          price: typeof i.price === 'string' ? i.price : i.price.id,
          quantity: i.quantity,
        })),
      }

      if (phase.trial_end) {
        normalized.trial_end = phase.trial_end
      }

      return normalized
    })

    const map: Record<string, string> = Object.fromEntries(swaps.map((s) => [s.from, s.to]))

    for (let i = 0; i < phases.length; i++) {
      phases[i].items = phases[i].items?.map((it) => {
        if (!it.price) {
          throw new Error('Phase item has no price id')
        }
        return {
          ...it,
          price: map[it.price] ?? it.price,
        }
      })
    }

    const updated = await getStripe().subscriptionSchedules.update(scheduleId, {
      phases,
    })

    return NextResponse.json({ scheduleId, swaps, phases, updated })
  } catch (err: unknown) {
    console.error('Failed to switch payment schedule', err)
    return NextResponse.json({ error: 'Failed to switch payment schedule' }, { status: 500 })
  }
})
