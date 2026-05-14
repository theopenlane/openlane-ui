import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { auth } from '@/lib/auth/auth'

export async function GET(req: Request) {
  // ensure we have a valid session
  const session = await auth()
  if (!session || !session.user?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customer')

    if (!customerId) {
      return NextResponse.json({ error: 'Missing customer id' }, { status: 400 })
    }

    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      expand: ['data.items.data.price'],
    })

    return NextResponse.json(subs.data[0] ?? null)
  } catch (err: unknown) {
    console.error('❌ Stripe error:', err)

    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
  }
}
