import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function POST(req: Request) {
  try {
    const { customerId } = (await req.json()) as { customerId?: string }

    if (!customerId) {
      return NextResponse.json({ error: 'Missing customerId' }, { status: 400 })
    }

    // ✅ Derive base URL dynamically
    const headersList = await headers()
    const protocol = headersList.get('x-forwarded-proto') ?? 'http'
    const host = headersList.get('x-forwarded-host') ?? headersList.get('host')
    const baseUrl = `${protocol}://${host}`

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/organization-settings/billing`,
      flow_data: {
        type: 'payment_method_update',
        after_completion: {
          type: 'redirect',
          redirect: {
            return_url: `${baseUrl}/organization-settings/billing?paymentUpdate=success`,
          },
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    console.error('❌ Stripe portal error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
