import { auth } from '@/lib/auth/auth'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

type Action = 'subscribe' | 'unsubscribe'

interface RequestBody {
  scheduleId: string
  priceId: string
  quantity?: number
  action: Action
}

export async function POST(req: Request) {
  // ensure we have a valid session
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { scheduleId, priceId, quantity = 1, action } = (await req.json()) as RequestBody

    if (!scheduleId || !priceId || !action) {
      return NextResponse.json({ error: 'scheduleId, priceId and action are required' }, { status: 400 })
    }

    const schedule = (await stripe.subscriptionSchedules.retrieve(scheduleId)) as Stripe.SubscriptionSchedule

    const newPrice = (await stripe.prices.retrieve(priceId)) as Stripe.Price

    if (action === 'subscribe' && !newPrice.recurring) {
      return NextResponse.json(
        {
          error: 'This endpoint only supports recurring prices. One-time prices should be billed immediately as invoice items.',
        },
        { status: 400 },
      )
    }

    const rawPhases = schedule.phases ?? []
    const currentPhase = schedule.current_phase
    if (!currentPhase) {
      return NextResponse.json({ error: 'Schedule has no current_phase' }, { status: 400 })
    }

    const currentIdx = rawPhases.findIndex((p) => p.start_date === currentPhase.start_date && p.end_date === currentPhase.end_date)

    const phases: Stripe.SubscriptionScheduleUpdateParams.Phase[] = rawPhases.map((phase) => {
      const normalized: Stripe.SubscriptionScheduleUpdateParams.Phase = {
        start_date: phase.start_date,
        end_date: phase.end_date,
        currency: phase.currency,
        proration_behavior: phase.proration_behavior ?? 'create_prorations',
        add_invoice_items: (phase.add_invoice_items as Stripe.SubscriptionScheduleUpdateParams.Phase.AddInvoiceItem[]) ?? [],
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

    if (currentIdx === -1) {
      return NextResponse.json({ error: 'Unable to identify current phase in phases[]' }, { status: 400 })
    }

    if (action === 'subscribe') {
      for (let i = currentIdx; i < phases.length; i++) {
        const phase = phases[i]
        const exists = phase.items?.some((it) => it.price === priceId)
        if (!exists) {
          phase.items = [...(phase.items ?? []), { price: priceId, quantity }]
        }
      }
    } else if (action === 'unsubscribe') {
      const hasFuture = currentIdx < phases.length - 1

      if (hasFuture) {
        for (let i = currentIdx + 1; i < phases.length; i++) {
          phases[i].items = phases[i].items?.filter((it) => it.price !== priceId)
        }
      } else {
        const lastPhase = phases[phases.length - 1]
        const newItems = (lastPhase.items ?? []).filter((it) => it.price !== priceId)

        if (newItems.length === 0) {
          return NextResponse.json(
            {
              error: 'Removing this item would leave the future phase empty. If you intend to cancel, use a cancel flow.',
            },
            { status: 400 },
          )
        }

        phases.push({
          start_date: currentPhase.end_date,
          // no end_date → ongoing
          currency: lastPhase.currency,
          proration_behavior: 'create_prorations',
          items: newItems,
          add_invoice_items: lastPhase.add_invoice_items ?? [],
        })
      }
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "subscribe" or "unsubscribe".' }, { status: 400 })
    }

    const updated = await stripe.subscriptionSchedules.update(scheduleId, {
      phases,
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('❌ Failed to update schedule:', err)
    const message = err instanceof Error ? err.message : 'Schedule update failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
