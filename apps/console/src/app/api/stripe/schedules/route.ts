import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET() {
  try {
    // For now: fetch all schedules (test mode by default)
    const schedules = await stripe.subscriptionSchedules.list({
      limit: 10,
      expand: ['data.subscription'], // expand to see linked subscriptions
    })

    console.log('✅ Subscription Schedules:', schedules.data)

    return NextResponse.json(schedules.data)
  } catch (err: any) {
    console.error('❌ Error fetching subscription schedules:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
