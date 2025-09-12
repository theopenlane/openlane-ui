// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature') as string
  const body = await req.text()

  try {
    const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)

    // Handle events like checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      // Save subscription to your DB (link by metadata.orgId)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}
