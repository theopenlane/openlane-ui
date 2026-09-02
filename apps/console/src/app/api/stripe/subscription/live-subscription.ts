import type Stripe from 'stripe'

export const LIVE_STATUSES: Stripe.Subscription.Status[] = ['active', 'trialing', 'past_due', 'unpaid', 'paused', 'incomplete']

export const isLive = (subscription: Stripe.Subscription) => LIVE_STATUSES.includes(subscription.status)

export const belongsToCustomer = (subscription: Stripe.Subscription, customerId: string) =>
  (typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id) === customerId

export const pickLiveSubscription = (subscriptions: readonly Stripe.Subscription[]): Stripe.Subscription | null =>
  subscriptions.filter(isLive).sort((a, b) => LIVE_STATUSES.indexOf(a.status) - LIVE_STATUSES.indexOf(b.status))[0] ?? null
