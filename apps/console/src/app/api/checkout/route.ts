// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { priceId, orgId } = await req.json()

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription', // or "payment" if one-time
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.nextUrl.origin}/organization-settings/billing?success=1`,
      cancel_url: `${req.nextUrl.origin}/organization-settings/billing?canceled=1`,
      metadata: {
        orgId,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
