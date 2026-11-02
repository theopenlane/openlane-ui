import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import type Stripe from 'stripe'
import { withBillingCustomer } from '@/lib/server/billing-customer'

export const GET = withBillingCustomer(async (customerId) => {
  try {
    const schedules: Stripe.ApiList<Stripe.SubscriptionSchedule> = await getStripe().subscriptionSchedules.list({
      customer: customerId,
      limit: 10,
      expand: ['data.subscription'],
    })

    return NextResponse.json(schedules.data)
  } catch (err: unknown) {
    console.error('❌ Error fetching subscription schedules:', err)
    return NextResponse.json({ error: 'Failed to fetch subscription schedules' }, { status: 500 })
  }
})
