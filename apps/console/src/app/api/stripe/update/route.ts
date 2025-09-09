import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: Request) {
  try {
    const { customerId, removePriceId, keepPriceIds } = await req.json()

    // 1. Get active subscription
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    })
    if (!subs.data.length) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 404 })
    }

    const subscription = subs.data[0]

    // 2. Get current schedule (if any)
    if (!subscription.schedule) {
      return NextResponse.json({ error: 'No subscription schedule found' }, { status: 400 })
    }

    const scheduleId = subscription.schedule as string
    const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId)

    // 3. Build current items (active phase)
    const currentItems = subscription.items.data.map((i) => ({
      price: i.price.id,
      quantity: i.quantity ?? 1,
    }))

    // 4. Build next phase items
    let nextItems = currentItems
    if (removePriceId) {
      // remove a module
      nextItems = currentItems.filter((i) => i.price !== removePriceId)
    }
    if (keepPriceIds) {
      // replace with explicit list (useful for undo)
      nextItems = currentItems.filter((i) => keepPriceIds.includes(i.price))
    }

    // 5. Update the schedule with new phases
    const updated = await stripe.subscriptionSchedules.update(scheduleId, {
      end_behavior: 'release',
      phases: [
        {
          items: currentItems,
          iterations: 1, // finish out the current cycle
        },
        {
          items: nextItems,
          iterations: 12, // continue for a year; tweak for your billing model
        },
      ],
    })

    return NextResponse.json(updated)
  } catch (err: any) {
    console.error('❌ Schedule update error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
