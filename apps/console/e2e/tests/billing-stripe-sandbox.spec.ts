import { test, expect, type Page } from '@playwright/test'
import type Stripe from 'stripe'

import { createSharedOrg, getSelf, gqlData, loginViaApi, setDefaultOrg, type ApiSession } from '../utils/api'
import { allProducts, fetchBillingCatalog, isSwitchable, pickProducts, priceIdFor, type BillingCatalog, type CatalogProduct } from '../utils/billing-catalog'
import { confirmDialog, intervalButton, openBilling, productAction } from '../utils/billing-page'
import { PASSWORD } from '../utils/constants'
import { loginViaForm } from '../utils/login'
import { registerAndVerify } from '../utils/registerUser'
import { STRIPE_SANDBOX_KEY_ENV, attachTestCard, createTrialCustomer, deleteCustomers, findActiveSchedule, phasePriceIds, stripeSandboxFromEnv } from '../utils/stripe-sandbox'
import { uniqueRef } from '../utils/unique'

const PROVISIONING_TIMEOUT = 60_000 // 1min
const SETUP_TIMEOUT = 5 * 60 * 1000 // 5min

const stripeCustomerOf = async (sess: ApiSession, id: string): Promise<string | null> => {
  const { organization } = await gqlData<{ organization: { stripeCustomerID: string | null } }>(sess, 'stripeCustomerID', `query($id: ID!){ organization(id: $id){ stripeCustomerID } }`, { id })
  return organization.stripeCustomerID
}

const personalOrgIds = async (sess: ApiSession): Promise<string[]> => {
  const { self } = await gqlData<{ self: { organizations: { edges: Array<{ node: { id: string; personalOrg: boolean } }> } } }>(
    sess,
    'personal organizations',
    `{ self { organizations(first: 50) { edges { node { id personalOrg } } } } }`,
  )
  return self.organizations.edges.map(({ node }) => node).flatMap(({ id, personalOrg }) => (personalOrg ? [id] : []))
}

test.describe('billing — real Stripe sandbox', () => {
  test.describe.configure({ mode: 'serial', retries: 0 })
  test.skip(!process.env[STRIPE_SANDBOX_KEY_ENV], `set ${STRIPE_SANDBOX_KEY_ENV} and run core with entitlements on the same sandbox (see e2e/README.md)`)

  const customers = new Set<string>()
  let stripe: Stripe
  let session: ApiSession
  let page: Page
  let customerId: string
  let orgId: string | undefined
  let catalog: BillingCatalog
  let product: CatalogProduct

  const schedule = async (): Promise<Stripe.SubscriptionSchedule> => {
    const active = await findActiveSchedule(stripe, customerId)
    if (!active) throw new Error(`no active subscription schedule for ${customerId}`)
    return active
  }

  const succeed = async (path: string, act: () => Promise<void>): Promise<void> => {
    const pending = page.waitForResponse((response) => new URL(response.url()).pathname === path)
    await act()
    const response = await pending
    expect(response.status(), await response.text()).toBe(200)
  }

  const expectRenewRefused = async (current: Stripe.SubscriptionSchedule): Promise<void> => {
    const response = await page.request.post('/api/stripe/schedules/renew', { data: { scheduleId: current.id } })
    expect(response.status()).toBe(409)
    expect(await response.json()).toEqual({ error: 'Trial subscriptions cannot be renewed' })

    const after = await stripe.subscriptionSchedules.retrieve(current.id)
    expect(after.end_behavior).toBe(current.end_behavior)
    expect(after.phases).toEqual(current.phases)
  }

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(SETUP_TIMEOUT)
    const client = stripeSandboxFromEnv()
    if (!client) throw new Error(`${STRIPE_SANDBOX_KEY_ENV} is not set`)
    stripe = client
    catalog = await fetchBillingCatalog()

    const { email } = await registerAndVerify({ email: `user@${uniqueRef('stripe')}.invalid`.toLowerCase() })
    session = await loginViaApi(email)
    const { settingId } = await getSelf(session)
    const createdOrgId = await createSharedOrg(session, uniqueRef('E2E Stripe'))
    orgId = createdOrgId
    await setDefaultOrg(session, settingId, createdOrgId)

    await expect
      .poll(() => stripeCustomerOf(session, createdOrgId).catch(() => null), {
        timeout: PROVISIONING_TIMEOUT,
        message: 'core attached no Stripe customer: run it with entitlements enabled on the same sandbox account as the runner (see e2e/README.md)',
      })
      .not.toBeNull()
    customerId = (await stripeCustomerOf(session, createdOrgId)) ?? ''

    const customer = await stripe.customers.retrieve(customerId)
    if (customer.deleted || customer.livemode) throw new Error(`${customerId} is not a usable sandbox customer`)
    customers.add(customerId)
    await expect.poll(async () => (await findActiveSchedule(stripe, customerId))?.id ?? null, { timeout: PROVISIONING_TIMEOUT }).not.toBeNull()
    await attachTestCard(stripe, customerId)

    const subscribed = new Set(phasePriceIds(await schedule()).flat())
    const available = [...catalog.modules, ...catalog.addons].filter((candidate) => !candidate.billing.prices.some(({ price_id }) => subscribed.has(price_id)))
    ;[product] = pickProducts(available, 1, 'unsubscribed products')

    page = await browser.newPage({ baseURL: test.info().project.use.baseURL })
    await loginViaForm(page, email, PASSWORD)
    await page.waitForURL(/\/dashboard/, { timeout: 60_000 }) // 1min
  })

  test.afterAll(async () => {
    if (!stripe) return
    try {
      const orgs = [...(orgId ? [orgId] : []), ...(session ? await personalOrgIds(session) : [])]
      for (const result of await Promise.allSettled(orgs.map((id) => stripeCustomerOf(session, id)))) {
        if (result.status === 'fulfilled' && result.value) customers.add(result.value)
      }
      await page?.close()
    } finally {
      await deleteCustomers(stripe, customers)
    }
  })

  test('the page shows the live trial and the card on file', async () => {
    await openBilling(page)
    await expect(page.getByText('Trial', { exact: true })).toBeVisible()
    await expect(page.getByText('4242', { exact: true })).toBeVisible()
  })

  test("another customer's schedule can be neither read nor changed", async () => {
    const foreign = await createTrialCustomer(stripe, uniqueRef('e2e-foreign'), priceIdFor(product, 'month'), (id) => customers.add(id))
    const body = { scheduleId: foreign.id }
    const price = priceIdFor(product, 'month')

    const own = await page.request.get(`/api/stripe/upcoming-invoice?scheduleId=${(await schedule()).id}`)
    expect(own.status(), 'the same route must work for our own schedule').toBe(200)

    const responses = [
      await page.request.get(`/api/stripe/upcoming-invoice?scheduleId=${foreign.id}`),
      await page.request.post('/api/stripe/schedules/cancel', { data: body }),
      await page.request.post('/api/stripe/schedules/renew', { data: body }),
      await page.request.post('/api/stripe/schedules/update', { data: { ...body, priceId: price, action: 'unsubscribe' } }),
      await page.request.post('/api/stripe/schedules/switch', { data: { ...body, swaps: [{ from: price, to: priceIdFor(product, 'year') }] } }),
    ]
    for (const response of responses) {
      expect(response.status(), response.url()).toBe(404)
      expect(await response.json()).toEqual({ error: 'Billing resource not found' })
    }

    const after = await stripe.subscriptionSchedules.retrieve(foreign.id)
    expect(after.end_behavior).toBe(foreign.end_behavior)
    expect(phasePriceIds(after)).toEqual(phasePriceIds(foreign))
  })

  test('a price outside the catalog is refused', async () => {
    const response = await page.request.post('/api/stripe/schedules/update', { data: { scheduleId: (await schedule()).id, priceId: 'price_not_in_catalog', action: 'subscribe' } })
    expect(response.status()).toBe(400)
    expect(await response.json()).toEqual({ error: 'This price is not available for purchase' })
  })

  test('subscribing adds the price to the Stripe schedule', async () => {
    await openBilling(page)
    await expect(page.getByText('4242', { exact: true })).toBeVisible()
    await succeed('/api/stripe/schedules/update', async () => {
      await productAction(page, product, 'Subscribe').click()
      await confirmDialog(page, `Add ${product.display_name}?`)
    })
    for (const prices of phasePriceIds(await schedule())) expect(prices).toContain(priceIdFor(product, 'month'))
  })

  test('unsubscribing removes the price from the next phase only', async () => {
    await openBilling(page)
    await expect(page.getByText('4242', { exact: true })).toBeVisible()
    await succeed('/api/stripe/schedules/update', async () => {
      await productAction(page, product, 'Unsubscribe').click()
      await confirmDialog(page, `Remove ${product.display_name}?`)
    })
    const phases = phasePriceIds(await schedule())
    expect(phases[0]).toContain(priceIdFor(product, 'month'))
    expect(phases.at(-1)).not.toContain(priceIdFor(product, 'month'))
  })

  test('the billing portal opens on Stripe', async () => {
    await openBilling(page)
    await page.getByRole('button', { name: 'View all in stripe' }).click()
    await page.waitForURL((url) => url.hostname === 'billing.stripe.com', { timeout: 60_000, waitUntil: 'commit' }) // 1min
  })

  test('switching to annual replaces every switchable price with its counterpart', async () => {
    const counterpart = new Map(
      allProducts(catalog)
        .filter(isSwitchable)
        .map((candidate) => [priceIdFor(candidate, 'month'), priceIdFor(candidate, 'year')]),
    )
    const before = phasePriceIds(await schedule())

    await openBilling(page)
    await intervalButton(page, 'Annual (15% off)').click()
    await succeed('/api/stripe/schedules/switch', () => confirmDialog(page, 'Switch to annual billing?'))

    expect(phasePriceIds(await schedule())).toEqual(before.map((prices) => prices.map((price) => counterpart.get(price) ?? price)))
  })

  test('a cancelled trial keeps its end date and cannot be renewed', async () => {
    const before = await schedule()
    expect(before.phases[0].trial_end).not.toBeNull()
    await expectRenewRefused(before)

    await openBilling(page)
    await page.getByRole('button', { name: 'Cancel subscription', exact: true }).click()
    await succeed('/api/stripe/schedules/cancel', () => confirmDialog(page, 'Cancel subscription?'))

    const cancelled = await stripe.subscriptionSchedules.retrieve(before.id)
    expect(cancelled.end_behavior).toBe('cancel')
    expect(cancelled.phases[0].trial_end).toBe(before.phases[0].trial_end)

    await expect(page.getByText('Your trial subscription was cancelled and cannot be renewed.')).toBeVisible()
    await expectRenewRefused(cancelled)
  })
})
