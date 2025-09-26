import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json({ error: 'Missing customerId' }, { status: 400 })
    }

    const schedules: Stripe.ApiList<Stripe.SubscriptionSchedule> = await stripe.subscriptionSchedules.list({
      customer: customerId,
      limit: 10,
      expand: ['data.subscription'],
    })

    return NextResponse.json(schedules.data)
  } catch (err: unknown) {
    console.error('❌ Error fetching subscription schedules:', err)
    const message = err instanceof Error ? err.message : 'Failed to fetch subscription schedules'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
