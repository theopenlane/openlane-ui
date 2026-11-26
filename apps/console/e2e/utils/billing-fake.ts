import type { Page, Route } from '@playwright/test'

import type {
  Invoice,
  InvoicesResponse,
  PaymentMethodsResponse,
  SchedulePhase,
  SchedulePhaseItem,
  StripeCard,
  StripePaymentMethod,
  Subscription,
  SubscriptionItem,
  SubscriptionSchedule,
  UpcomingInvoiceResponse,
} from '@/types/stripe'

import type { GetOrganizationBillingQuery } from '@repo/codegen/src/schema'

import { switchedPrice, type BillingCatalog, type BillingInterval } from './billing-catalog'

const PERIOD_SECONDS = 14 * 24 * 60 * 60 // 14 days
const UNIT_AMOUNT = 45_000

export const FAKE_SCHEDULE_ID = 'sub_sched_e2e_fake'

type FakeCard = Pick<StripeCard, 'brand' | 'last4' | 'exp_month' | 'exp_year'>

type FakePaymentMethod = Pick<StripePaymentMethod, 'id' | 'type'> & { card: FakeCard }

type FakePaymentMethods = Pick<PaymentMethodsResponse, 'hasPaymentMethod'> & {
  defaultPaymentMethod: FakePaymentMethod | null
  paymentMethods: FakePaymentMethod[]
}

type FakeSubscriptionItem = Pick<SubscriptionItem, 'current_period_end'> & {
  price: { id: string; unit_amount: number; recurring: { interval: BillingInterval } }
}

type FakeSubscription = Pick<Subscription, 'id' | 'status'> & { items: { data: FakeSubscriptionItem[] } }

type FakePhase = Pick<SchedulePhase, 'start_date' | 'end_date' | 'trial' | 'trial_end'> & { items: Array<Pick<SchedulePhaseItem, 'price' | 'quantity'>> }

type FakeSchedule = Pick<SubscriptionSchedule, 'id' | 'status' | 'end_behavior' | 'current_phase' | 'released_subscription'> & {
  phases: FakePhase[]
  subscription: FakeSubscription | null
}

type ScheduleAction = 'cancel' | 'renew' | 'update' | 'switch'

type Endpoint = `schedules/${ScheduleAction}` | 'create-portal-session' | 'invoices'

export interface BillingScenario {
  catalog: BillingCatalog
  priceIds: string[]
  interval?: BillingInterval
  status?: Subscription['status']
  schedule?: Partial<Pick<SubscriptionSchedule, 'status' | 'end_behavior'>> | null
  trial?: boolean
  card?: FakeCard | null
  invoices?: Invoice[]
  upcoming?: UpcomingInvoiceResponse | null
  portalUrl?: string
  failures?: Partial<Record<Endpoint, string>>
}

export interface BillingFake {
  periodEnd: Date
  unexpectedRequests: string[]
}

export const VISA: FakeCard = { brand: 'visa', last4: '4242', exp_month: 4, exp_year: 2034 }

export const fakeInvoice = (id: string, overrides: Partial<Invoice> = {}): Invoice => ({
  id,
  number: `E2E-${id}`,
  status: 'paid',
  amount_paid: UNIT_AMOUNT,
  amount_due: UNIT_AMOUNT,
  hosted_invoice_url: null,
  invoice_pdf: `https://pay.stripe.com/invoice/${id}/pdf`,
  created: Math.floor(Date.now() / 1000),
  due_date: null,
  ...overrides,
})

const isBillingQuery = (route: Route): boolean => (route.request().postData() ?? '').includes('query GetOrganizationBilling(')

export const installBillingFake = async (page: Page, scenario: BillingScenario): Promise<BillingFake> => {
  const { priceIds, interval = 'month', status = 'active', trial = false, card = VISA, failures = {} } = scenario
  const now = Math.floor(Date.now() / 1000)
  const periodEnd = now + PERIOD_SECONDS
  const fake: BillingFake = { periodEnd: new Date(periodEnd * 1000), unexpectedRequests: [] }

  const subscriptionItem = (id: string, itemInterval: BillingInterval): FakeSubscriptionItem => ({
    current_period_end: periodEnd,
    price: { id, unit_amount: UNIT_AMOUNT, recurring: { interval: itemInterval } },
  })

  const subscription: FakeSubscription = { id: 'sub_e2e_fake', status, items: { data: priceIds.map((id) => subscriptionItem(id, interval)) } }

  const schedule: FakeSchedule = {
    id: FAKE_SCHEDULE_ID,
    status: 'active',
    end_behavior: 'release',
    current_phase: { start_date: now, end_date: periodEnd },
    released_subscription: null,
    phases: [{ start_date: now, end_date: periodEnd, trial, trial_end: trial ? periodEnd : null, items: priceIds.map((price) => ({ price, quantity: 1 })) }],
    subscription,
    ...scenario.schedule,
  }

  const paymentMethod: FakePaymentMethod | null = card ? { id: 'pm_e2e_fake', type: 'card', card } : null
  const paymentMethods: FakePaymentMethods = {
    hasPaymentMethod: !!paymentMethod,
    defaultPaymentMethod: paymentMethod,
    paymentMethods: paymentMethod ? [paymentMethod] : [],
  }

  const subscribe = (price: string): void => {
    for (const phase of schedule.phases) {
      if (!phase.items.some((item) => item.price === price)) phase.items.push({ price, quantity: 1 })
    }
    if (!subscription.items.data.some((item) => item.price.id === price)) subscription.items.data.push(subscriptionItem(price, interval))
  }

  const unsubscribe = (price: string): void => {
    const [current, next] = schedule.phases
    const items = (next ?? current).items.filter((item) => item.price !== price)
    schedule.phases = [current, { start_date: periodEnd, end_date: periodEnd + PERIOD_SECONDS, items }]
  }

  const actions: Record<ScheduleAction, (route: Route) => void> = {
    cancel: () => {
      schedule.end_behavior = 'cancel'
    },
    renew: () => {
      schedule.end_behavior = 'release'
    },
    update: (route) => {
      const { priceId, action } = route.request().postDataJSON() as { priceId: string; action: 'subscribe' | 'unsubscribe' }
      if (action === 'subscribe') subscribe(priceId)
      else unsubscribe(priceId)
    },
    switch: (route) => {
      const { interval: target } = route.request().postDataJSON() as { interval: BillingInterval }
      for (const phase of schedule.phases) {
        phase.items = phase.items.map((item) => ({ ...item, price: switchedPrice(scenario.catalog, item.price, target) }))
      }
      subscription.items.data = subscription.items.data.map(({ price }) => subscriptionItem(switchedPrice(scenario.catalog, price.id, target), target))
    },
  }

  const invoicesFor = (route: Route): InvoicesResponse => {
    const { status: wanted, limit } = route.request().postDataJSON() as { status?: Invoice['status']; limit: number }
    return { invoices: (scenario.invoices ?? []).filter((invoice) => !wanted || invoice.status === wanted).slice(0, limit) }
  }

  const respond = (route: Route, endpoint: Endpoint, payload: () => object): Promise<void> => {
    const error = failures[endpoint]
    return error ? route.fulfill({ status: 500, json: { error } }) : route.fulfill({ json: payload() })
  }

  await page.route('**/query', async (route) => {
    if (!isBillingQuery(route)) {
      await route.fallback()
      return
    }
    const data: GetOrganizationBillingQuery = {
      organization: {
        personalOrg: false,
        stripeCustomerID: 'cus_e2e_fake',
        orgSubscriptions: [{ active: true, expiresAt: null, stripeSubscriptionStatus: status, trialExpiresAt: trial ? fake.periodEnd.toISOString() : null }],
      },
    }
    await route.fulfill({ json: { data } })
  })

  await page.route('**/api/stripe/**', async (route) => {
    fake.unexpectedRequests.push(`${route.request().method()} ${new URL(route.request().url()).pathname}`)
    await route.abort()
  })

  await page.route('**/api/stripe/schedules', (route) => route.fulfill({ json: scenario.schedule === null ? [] : [schedule] }))
  await page.route(/\/api\/stripe\/subscription\?/, (route) => route.fulfill({ json: subscription }))
  await page.route('**/api/stripe/payment-methods', (route) => route.fulfill({ json: paymentMethods }))
  await page.route(/\/api\/stripe\/upcoming-invoice\?/, (route) => route.fulfill({ json: scenario.upcoming ?? null }))
  await page.route('**/api/stripe/invoices', (route) => respond(route, 'invoices', () => invoicesFor(route)))
  await page.route('**/api/stripe/create-portal-session', (route) => respond(route, 'create-portal-session', () => ({ url: scenario.portalUrl })))

  for (const action of Object.keys(actions) as ScheduleAction[]) {
    await page.route(`**/api/stripe/schedules/${action}`, (route) =>
      respond(route, `schedules/${action}`, () => {
        actions[action](route)
        return schedule
      }),
    )
  }

  return fake
}
