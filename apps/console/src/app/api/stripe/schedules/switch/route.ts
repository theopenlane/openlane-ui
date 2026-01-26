import { auth } from '@/lib/auth/auth'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

interface Swap {
  from: string
  to: string
}

interface RequestBody {
  scheduleId: string
  swaps: Swap[]
}

export async function POST(req: Request) {
  // ensure we have a valid session
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { scheduleId, swaps } = (await req.json()) as RequestBody

    if (!scheduleId || !swaps?.length) {
      return NextResponse.json({ error: 'scheduleId and swaps[] are required' }, { status: 400 })
    }

    const schedule: Stripe.SubscriptionSchedule = await stripe.subscriptionSchedules.retrieve(scheduleId)

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
                coupon: typeof d.coupon === 'string' ? d.coupon : d.coupon?.id ?? undefined,
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

    const updated = await stripe.subscriptionSchedules.update(scheduleId, {
      phases,
    })

    return NextResponse.json({ scheduleId, swaps, phases, updated })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Switch failed unexpectedly'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
