import Stripe from 'stripe'

import { API_BASE } from './constants'

export const STRIPE_SANDBOX_KEY_ENV = 'E2E_STRIPE_SECRET_KEY'

const TEST_MODE_KEY = /^(sk|rk)_test_/
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

export const stripeSandboxFromEnv = (): Stripe | null => {
  const key = process.env[STRIPE_SANDBOX_KEY_ENV]
  if (!key) return null
  if (!LOOPBACK_HOSTS.has(new URL(API_BASE).hostname)) throw new Error(`the Stripe sandbox specs only run against a local core, not ${API_BASE}`)
  if (!TEST_MODE_KEY.test(key)) throw new Error(`${STRIPE_SANDBOX_KEY_ENV} must be a Stripe test-mode key (sk_test_… or rk_test_…)`)
  return new Stripe(key, { maxNetworkRetries: 2 })
}

export const attachTestCard = async (stripe: Stripe, customerId: string): Promise<void> => {
  const paymentMethod = await stripe.paymentMethods.attach('pm_card_visa', { customer: customerId })
  await stripe.customers.update(customerId, { invoice_settings: { default_payment_method: paymentMethod.id } })
}

export const findActiveSchedule = async (stripe: Stripe, customerId: string): Promise<Stripe.SubscriptionSchedule | null> => {
  const { data } = await stripe.subscriptionSchedules.list({ customer: customerId, limit: 10 })
  return data.find((schedule) => schedule.status === 'active') ?? null
}

export const phasePriceIds = (schedule: Stripe.SubscriptionSchedule): string[][] => schedule.phases.map((phase) => phase.items.map(({ price }) => (typeof price === 'string' ? price : price.id)))

export const createTrialCustomer = async (stripe: Stripe, name: string, price: string, track: (customerId: string) => void): Promise<Stripe.SubscriptionSchedule> => {
  const customer = await stripe.customers.create({ name, metadata: { source: 'openlane-console-e2e' } })
  track(customer.id)
  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price }],
    trial_period_days: 30,
    trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
  })
  return stripe.subscriptionSchedules.create({ from_subscription: subscription.id })
}

export const deleteCustomers = async (stripe: Stripe, customerIds: Iterable<string>): Promise<void> => {
  const failures: string[] = []
  for (const id of customerIds) {
    try {
      await stripe.customers.del(id)
    } catch (err) {
      const alreadyGone = err instanceof Stripe.errors.StripeInvalidRequestError && err.code === 'resource_missing'
      if (!alreadyGone) failures.push(`${id}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  if (failures.length > 0) throw new Error(`failed to delete Stripe sandbox customers:\n${failures.join('\n')}`)
}
