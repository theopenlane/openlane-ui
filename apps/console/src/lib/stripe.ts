import { stripeSecretKey } from '@repo/dally/auth'
import Stripe from 'stripe'
import { belongsToCustomer } from './stripe-customer'

let client: Stripe | undefined

// Created on first use rather than at import, so building or loading a route (e.g. `next build`
// collecting page data) doesn't require STRIPE_SECRET_KEY; only an actual Stripe call does
export const getStripe = (): Stripe => {
  if (!stripeSecretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY in .env')
  }

  client ??= new Stripe(stripeSecretKey)

  return client
}

const nullIfMissing = (err: Error) => {
  if (err instanceof Stripe.errors.StripeInvalidRequestError && err.code === 'resource_missing') {
    return null
  }
  throw err
}

export const retrieveCustomerSchedule = async (scheduleId: string, customerId: string): Promise<Stripe.SubscriptionSchedule | null> => {
  const schedule = await getStripe().subscriptionSchedules.retrieve(scheduleId).catch(nullIfMissing)
  return schedule && belongsToCustomer(schedule, customerId) ? schedule : null
}

export const retrieveCustomerSubscription = async (subscriptionId: string, customerId: string): Promise<Stripe.Subscription | null> => {
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId).catch(nullIfMissing)
  return subscription && belongsToCustomer(subscription, customerId) ? subscription : null
}
