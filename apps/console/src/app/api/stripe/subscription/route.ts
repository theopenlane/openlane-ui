import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'
import { auth } from '@/lib/auth/auth'

// statuses that still represent a subscription the customer is on, in preference order
// past_due / unpaid are included because a failed or unpaid invoice must not blank out the billing page
const LIVE_STATUSES: Stripe.Subscription.Status[] = ['active', 'trialing', 'past_due', 'unpaid', 'incomplete']

export async function GET(req: Request) {
  // ensure we have a valid session
  const session = await auth()
  if (!session || !session.user?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customer')
    const subscriptionId = searchParams.get('subscription')

    if (!customerId) {
      return NextResponse.json({ error: 'Missing customer id' }, { status: 400 })
    }

    // a released schedule keeps its subscription in released_subscription, so retrieve it directly when we know the id
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const belongsToCustomer = typeof subscription.customer === 'string' ? subscription.customer === customerId : subscription.customer.id === customerId

      if (belongsToCustomer && subscription.status !== 'canceled') {
        return NextResponse.json(subscription)
      }
    }

    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
    })

    const live = LIVE_STATUSES.map((status) => subs.data.find((sub) => sub.status === status)).find((sub) => !!sub)

    return NextResponse.json(live ?? null)
  } catch (err: unknown) {
    console.error('❌ Stripe error:', err)

    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
  }
}
