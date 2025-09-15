import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { customerId } = (await req.json()) as { customerId?: string }

    if (!customerId) {
      return NextResponse.json({ error: 'Missing customerId' }, { status: 400 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: 'http://localhost:3001/organization-settings/billing',
      flow_data: {
        type: 'payment_method_update',
        after_completion: {
          type: 'redirect',
          redirect: {
            return_url: 'http://localhost:3001/organization-settings/billing?paymentUpdate=success',
          },
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    console.error('❌ Stripe portal error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    // In dev, return full error message for debugging
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
