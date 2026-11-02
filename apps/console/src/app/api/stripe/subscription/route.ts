import { NextResponse } from 'next/server'
import { getStripe, retrieveCustomerSubscription } from '@/lib/stripe'
import { withBillingCustomer } from '@/lib/server/billing-customer'
import { isLive, pickLiveSubscription } from './live-subscription'

export const GET = withBillingCustomer(async (customerId, req) => {
  try {
    const { searchParams } = new URL(req.url)
    const subscriptionId = searchParams.get('subscription')

    if (subscriptionId) {
      const releasedSubscription = await retrieveCustomerSubscription(subscriptionId, customerId)

      if (releasedSubscription && isLive(releasedSubscription)) {
        return NextResponse.json(releasedSubscription)
      }
    }

    const subs = await getStripe().subscriptions.list({
      customer: customerId,
      limit: 100,
    })

    return NextResponse.json(pickLiveSubscription(subs.data))
  } catch (err: unknown) {
    console.error('❌ Stripe error:', err)

    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
  }
})
