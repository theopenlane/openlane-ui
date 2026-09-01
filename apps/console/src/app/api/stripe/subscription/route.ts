import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'
import { auth } from '@/lib/auth/auth'

const LIVE_STATUSES: Stripe.Subscription.Status[] = ['active', 'trialing', 'past_due', 'unpaid', 'paused', 'incomplete']

const isLive = (subscription: Stripe.Subscription) => LIVE_STATUSES.includes(subscription.status)

const belongsToCustomer = (subscription: Stripe.Subscription, customerId: string) => (typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id) === customerId

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

    if (subscriptionId) {
      const releasedSubscription = await stripe.subscriptions.retrieve(subscriptionId).catch(() => null)

      if (releasedSubscription && belongsToCustomer(releasedSubscription, customerId) && isLive(releasedSubscription)) {
        return NextResponse.json(releasedSubscription)
      }
    }

    const subs = await stripe.subscriptions.list({
      customer: customerId,
      limit: 100,
    })

    const live = subs.data.filter(isLive).sort((a, b) => LIVE_STATUSES.indexOf(a.status) - LIVE_STATUSES.indexOf(b.status))[0]

    return NextResponse.json(live ?? null)
  } catch (err: unknown) {
    console.error('❌ Stripe error:', err)

    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
  }
}
