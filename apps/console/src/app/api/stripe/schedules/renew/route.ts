import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(req: Request) {
  try {
    const { scheduleId } = (await req.json()) as { scheduleId?: string }
    if (!scheduleId) {
      return NextResponse.json({ error: 'scheduleId required' }, { status: 400 })
    }

    const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId)

    if (!schedule.phases?.length) {
      return NextResponse.json({ error: 'No phases found in schedule' }, { status: 404 })
    }

    const lastPhase = schedule.phases.at(-1)!

    const firstItem = lastPhase.items[0]
    if (!firstItem) {
      return NextResponse.json({ error: 'No items in last phase' }, { status: 404 })
    }

    const price = await stripe.prices.retrieve(firstItem.price as string)
    const interval = price.recurring?.interval
    const newStart = lastPhase.end_date
    let newEnd = newStart

    if (interval === 'month') {
      newEnd += 30 * 24 * 60 * 60 // 30 days
    } else if (interval === 'year') {
      newEnd += 365 * 24 * 60 * 60 // 1 year
    } else {
      // fallback ti 30 days
      newEnd += 30 * 24 * 60 * 60
    }

    const newItems = lastPhase.items.map((item) => ({
      price: item.price as string,
      quantity: item.quantity ?? 1,
    }))

    const updated: Stripe.SubscriptionSchedule = await stripe.subscriptionSchedules.update(scheduleId, {
      end_behavior: 'release',
      phases: [
        ...schedule.phases.map((p) => ({
          items: p.items.map((i) => ({
            price: i.price as string,
            quantity: i.quantity ?? 1,
          })),
          start_date: p.start_date,
          end_date: p.end_date,
        })),
        {
          items: newItems,
          start_date: newStart,
          end_date: newEnd,
        },
      ],
    })

    return NextResponse.json(updated)
  } catch (err: unknown) {
    console.error('❌ Extend schedule failed:', err)
    const message = err instanceof Error ? err.message : 'Extend failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
