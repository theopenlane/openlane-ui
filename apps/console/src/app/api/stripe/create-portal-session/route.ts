import { getStripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { withBillingCustomer } from '@/lib/server/billing-customer'

export const POST = withBillingCustomer(async (customerId, req) => {
  try {
    const { isBillingSettings } = (await req.json()) as { isBillingSettings?: boolean }

    // ✅ Derive base URL dynamically
    const headersList = await headers()
    const protocol = headersList.get('x-forwarded-proto') ?? 'http'
    const host = headersList.get('x-forwarded-host') ?? headersList.get('host')
    const baseUrl = `${protocol}://${host}`

    let session

    if (isBillingSettings) {
      // ✅ Full subscription portal (no flow_data)
      session = await getStripe().billingPortal.sessions.create({
        customer: customerId,
        return_url: `${baseUrl}/organization-settings/billing`,
      })
    } else {
      // ✅ Direct payment method update flow
      session = await getStripe().billingPortal.sessions.create({
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
    }

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    console.error('❌ Stripe portal error:', err)
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
  }
})
