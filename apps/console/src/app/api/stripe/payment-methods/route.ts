import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import type Stripe from 'stripe'
import { withBillingCustomer } from '@/lib/server/billing-customer'

export const GET = withBillingCustomer(async (customerId) => {
  try {
    const customer = await getStripe().customers.retrieve(customerId, {
      expand: ['invoice_settings.default_payment_method'],
    })

    if (customer.deleted) {
      return NextResponse.json({ error: 'Customer deleted' }, { status: 404 })
    }

    const defaultPM = (customer as Stripe.Customer).invoice_settings.default_payment_method

    const paymentMethods = await getStripe().paymentMethods.list({
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
    return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 })
  }
})
