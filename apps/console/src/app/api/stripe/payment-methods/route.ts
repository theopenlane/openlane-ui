import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'
import { auth } from '@/lib/auth/auth'

export async function GET(req: Request) {
  // ensure we have a valid session
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json({ error: 'Missing customerId' }, { status: 400 })
    }

    const customer = await stripe.customers.retrieve(customerId, {
      expand: ['invoice_settings.default_payment_method'],
    })

    if (customer.deleted) {
      return NextResponse.json({ error: 'Customer deleted' }, { status: 404 })
    }

    const defaultPM = (customer as Stripe.Customer).invoice_settings.default_payment_method

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    })

    return NextResponse.json({
      hasPaymentMethod: Boolean(defaultPM) || paymentMethods.data.length > 0,
      defaultPaymentMethod: defaultPM,
      paymentMethods: paymentMethods.data,
    })
  } catch (err) {
    const error = err as Error
    console.error('❌ Error fetching payment methods:', error)
    return NextResponse.json({ error: error.message ?? 'Internal Server Error' }, { status: 500 })
  }
}
