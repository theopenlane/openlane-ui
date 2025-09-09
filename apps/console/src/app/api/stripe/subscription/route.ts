import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET(req: Request) {
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
  } catch (err: any) {
    console.error('❌ Stripe error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
