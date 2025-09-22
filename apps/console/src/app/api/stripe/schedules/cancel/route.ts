import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(req: Request) {
  try {
    const { scheduleId } = (await req.json()) as { scheduleId?: string }

    if (!scheduleId) {
      return NextResponse.json({ error: 'scheduleId required' }, { status: 400 })
    }

    const updated: Stripe.SubscriptionSchedule = await stripe.subscriptionSchedules.update(scheduleId, {
      end_behavior: 'cancel',
    })

    return NextResponse.json(updated)
  } catch (err: unknown) {
    console.error('❌ Cancel subscription failed:', err)
    const message = err instanceof Error ? err.message : 'Cancel failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
