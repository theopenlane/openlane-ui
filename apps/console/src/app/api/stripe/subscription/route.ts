import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { auth } from '@/lib/auth/auth'
import { belongsToCustomer, isLive, pickLiveSubscription } from './live-subscription'

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

    return NextResponse.json(pickLiveSubscription(subs.data))
  } catch (err: unknown) {
    console.error('❌ Stripe error:', err)

    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
  }
}
