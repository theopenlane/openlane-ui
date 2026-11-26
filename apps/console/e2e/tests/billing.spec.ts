import type { Page, Request } from '@playwright/test'

import { FULL_CATALOG } from '@/lib/billing/product-catalog'
import { SWITCH_CANCELED_REASON, intervalSwitchBlockedReason } from '@/lib/billing/interval-switch'
import type { OpenlaneProductsResponse } from '@/types/stripe'
import { formatDate } from '@/utils/date'

import { test, expect } from '../fixtures/auth'
import { fetchBillingCatalog, pickProducts, priceIdFor, type BillingCatalog, type CatalogProduct } from '../utils/billing-catalog'
import { FAKE_SCHEDULE_ID, VISA, fakeInvoice, installBillingFake, type BillingFake, type BillingScenario } from '../utils/billing-fake'
import { BILLING_PATH, confirmDialog, disabledReason, intervalButton, openBilling, productAction } from '../utils/billing-page'
import { toast } from '../utils/mutations'

const PRICE_OUTSIDE_CATALOG = 'price_e2e_not_in_catalog'

const TEN_DAYS_SECONDS = 10 * 24 * 60 * 60 // 10 days

const BILLING_ENDPOINTS = [
  { method: 'GET', path: '/api/stripe/schedules' },
  { method: 'GET', path: '/api/stripe/subscription' },
  { method: 'GET', path: '/api/stripe/payment-methods' },
  { method: 'GET', path: '/api/stripe/upcoming-invoice?scheduleId=sub_sched_unknown' },
  { method: 'POST', path: '/api/stripe/invoices' },
  { method: 'POST', path: '/api/stripe/create-portal-session' },
  { method: 'POST', path: '/api/stripe/schedules/cancel' },
  { method: 'POST', path: '/api/stripe/schedules/renew' },
  { method: 'POST', path: '/api/stripe/schedules/switch' },
  { method: 'POST', path: '/api/stripe/schedules/update' },
] as const

const openFakeBilling = async (page: Page, scenario: BillingScenario): Promise<BillingFake> => {
  const fake = await installBillingFake(page, scenario)
  await openBilling(page)
  return fake
}

const bodyOfRequest = async (page: Page, path: string, act: () => Promise<void>): Promise<object> => {
  const pending = page.waitForRequest((request) => new URL(request.url()).pathname === path)
  await act()
  return (await pending).postDataJSON() as object
}

test.describe('billing — access control', () => {
  test('every billing endpoint rejects a signed-out caller', async ({ playwright, baseURL }) => {
    const anonymous = await playwright.request.newContext({ baseURL, storageState: { cookies: [], origins: [] } })
    try {
      for (const { method, path } of [...BILLING_ENDPOINTS, { method: 'GET', path: '/api/stripe/products' }]) {
        const response = await anonymous.fetch(path, { method, data: method === 'POST' ? {} : undefined })
        expect(response.status(), `${method} ${path}`).toBe(401)
      }
    } finally {
      await anonymous.dispose()
    }
  })

  for (const role of ['admin', 'member', 'readonly'] as const) {
    test.describe(`as ${role}`, () => {
      test.use({ authProfile: role })

      test('the page is protected and every billing endpoint is forbidden', async ({ page }) => {
        await page.goto(BILLING_PATH, { waitUntil: 'domcontentloaded' })
        await expect(page.getByText(/this page is part of a protected area/i)).toBeVisible({ timeout: 60_000 }) // 1min

        for (const { method, path } of BILLING_ENDPOINTS) {
          const response = await page.request.fetch(path, { method, data: method === 'POST' ? {} : undefined })
          expect(response.status(), `${method} ${path}`).toBe(403)
        }
      })
    })
  }
})

test.describe('billing — subscription state', () => {
  let catalog: BillingCatalog
  let fullCatalog: BillingCatalog
  let primary: CatalogProduct
  let secondary: CatalogProduct
  let fake: BillingFake | undefined

  const open = async (page: Page, scenario: Partial<BillingScenario> = {}): Promise<BillingFake> => {
    fake = await openFakeBilling(page, { catalog: fullCatalog, priceIds: [priceIdFor(primary, scenario.interval ?? 'month')], ...scenario })
    return fake
  }

  test.beforeAll(async () => {
    ;[catalog, fullCatalog] = await Promise.all([fetchBillingCatalog(), fetchBillingCatalog(FULL_CATALOG)])
    ;[primary, secondary] = pickProducts(catalog.modules, 2, 'modules')
  })

  test.afterEach(() => {
    expect(fake?.unexpectedRequests ?? [], 'requests to billing endpoints the fake does not know').toEqual([])
    fake = undefined
  })

  test.describe('summary', () => {
    test('shows the plan, upcoming cost, discount and saved card', async ({ page }) => {
      const { periodEnd } = await open(page, { upcoming: { currency: 'usd', subtotal: 80_000, total: 75_000, total_excluding_tax: 75_000, total_discount: 5_000 } })

      await expect(page.getByText('$750.00 / month')).toBeVisible()
      await expect(page.getByText('-$50.00')).toBeVisible()
      await expect(page.getByText('Active', { exact: true })).toBeVisible()
      await expect(page.getByText(formatDate(periodEnd.toISOString()), { exact: true }).first()).toBeVisible()
      await expect(intervalButton(page, 'Monthly')).toHaveAttribute('aria-pressed', 'true')
      await expect(page.getByText(VISA.last4, { exact: true })).toBeVisible()
      await expect(page.getByText('Expires 04/34')).toBeVisible()
    })

    test('shows the remaining time of a trial', async ({ page }) => {
      await open(page, { status: 'trialing', trial: true })
      await expect(page.getByText('Trial', { exact: true })).toBeVisible()
      await expect(page.getByText(/^Expires in \d+ days?$/)).toBeVisible()
    })

    for (const [status, label] of [
      ['past_due', 'Past due'],
      ['unpaid', 'Unpaid'],
    ] as const) {
      test(`a ${status} subscription shows the oldest outstanding invoice as the next billing date`, async ({ page }) => {
        const dueDate = Math.floor(new Date('2026-03-14T12:00:00Z').getTime() / 1000)
        await open(page, {
          status,
          invoices: [fakeInvoice('newer', { status: 'open', due_date: dueDate + TEN_DAYS_SECONDS }), fakeInvoice('oldest', { status: 'open', due_date: dueDate })],
        })
        await expect(page.getByText(label, { exact: true })).toBeVisible()
        await expect(page.getByText('Next billing:').locator('xpath=following-sibling::p')).toHaveText(formatDate(new Date(dueDate * 1000).toISOString()))
      })
    }

    for (const [status, label] of [
      ['incomplete', 'Incomplete'],
      ['paused', 'Paused'],
      ['canceled', 'Expired'],
    ] as const) {
      test(`a ${status} subscription is labelled ${label}`, async ({ page }) => {
        await open(page, { status })
        await expect(page.getByText(label, { exact: true })).toBeVisible()
      })
    }
  })

  test.describe('invoices', () => {
    test('lists the five most recent with status, amount and download link', async ({ page }) => {
      const invoices = [fakeInvoice('open', { status: 'open', amount_paid: 0, amount_due: 12_345 }), ...Array.from({ length: 6 }, (_, index) => fakeInvoice(`paid-${index}`))]
      await open(page, { invoices })

      await expect(page.getByText(/^Invoice #E2E-/)).toHaveCount(5)
      await expect(page.getByText('$123.45')).toBeVisible()
      await expect(page.getByText('Pending', { exact: true })).toBeVisible()
      await expect(page.getByText('Paid', { exact: true })).toHaveCount(4)
      await expect(page.getByRole('link', { name: 'Download invoice E2E-open' })).toHaveAttribute('href', 'https://pay.stripe.com/invoice/open/pdf')
    })

    test('says when there are no invoices', async ({ page }) => {
      await open(page)
      await expect(page.getByText('No invoices found')).toBeVisible()
    })

    test('a failed load does not read as no invoices', async ({ page }) => {
      await open(page, { failures: { invoices: 'Failed to fetch invoices' } })
      await expect(page.getByText('Failed to load invoices')).toBeVisible({ timeout: 30_000 }) // 30s
      await expect(page.getByText('No invoices found')).toHaveCount(0)
    })
  })

  test.describe('modules', () => {
    test('subscribing is refused without a payment method and sends nothing', async ({ page }) => {
      const updates: Request[] = []
      page.on('request', (request) => {
        if (request.url().endsWith('/api/stripe/schedules/update')) updates.push(request)
      })
      await open(page, { card: null })

      await expect(page.getByText('No payment method on file')).toBeVisible()
      await productAction(page, secondary, 'Subscribe').click()
      await confirmDialog(page, `Add ${secondary.display_name}?`, 'Confirm')

      await expect(toast(page, 'Payment method required')).toBeVisible()
      expect(updates).toHaveLength(0)
    })

    test('a module can be added, removed at period end, and kept again', async ({ page }) => {
      await open(page)
      await expect(page.getByText(VISA.last4, { exact: true })).toBeVisible()
      const updatePath = '/api/stripe/schedules/update'
      const payload = { scheduleId: FAKE_SCHEDULE_ID, priceId: priceIdFor(secondary, 'month'), quantity: 1 }

      await expect(productAction(page, primary, 'Unsubscribe')).toBeDisabled()

      const added = await bodyOfRequest(page, updatePath, async () => {
        await productAction(page, secondary, 'Subscribe').click()
        await confirmDialog(page, `Add ${secondary.display_name}?`, 'Confirm')
      })
      expect(added).toEqual({ ...payload, action: 'subscribe' })
      await expect(toast(page, 'Subscribed successfully')).toBeVisible()
      await expect(productAction(page, primary, 'Unsubscribe')).toBeEnabled()

      const removed = await bodyOfRequest(page, updatePath, async () => {
        await productAction(page, secondary, 'Unsubscribe').click()
        await confirmDialog(page, `Remove ${secondary.display_name}?`, 'Confirm')
      })
      expect(removed).toEqual({ ...payload, action: 'unsubscribe' })
      await expect(toast(page, 'Unsubscribed successfully')).toBeVisible()

      const kept = await bodyOfRequest(page, updatePath, async () => {
        await productAction(page, secondary, 'Renew').click()
        await confirmDialog(page, `Renew ${secondary.display_name}?`, 'Confirm')
      })
      expect(kept).toEqual({ ...payload, action: 'subscribe' })
      await expect(productAction(page, secondary, 'Unsubscribe')).toBeEnabled()
    })

    test('a private module the org already has is listed and can be removed', async ({ page }) => {
      const [owned, notOwned] = pickProducts(
        fullCatalog.modules.filter((module) => module.audience !== 'public'),
        2,
        'private modules',
      )
      await open(page, { priceIds: [priceIdFor(primary, 'month'), priceIdFor(owned, 'month')] })
      await expect(page.getByText(VISA.last4, { exact: true })).toBeVisible()

      await expect(productAction(page, notOwned, 'Subscribe')).toHaveCount(0)
      const removed = await bodyOfRequest(page, '/api/stripe/schedules/update', async () => {
        await productAction(page, owned, 'Unsubscribe').click()
        await confirmDialog(page, `Remove ${owned.display_name}?`, 'Confirm')
      })
      expect(removed).toEqual({ scheduleId: FAKE_SCHEDULE_ID, priceId: priceIdFor(owned, 'month'), quantity: 1, action: 'unsubscribe' })
      await expect(productAction(page, owned, 'Renew')).toBeVisible()
    })

    test('a product without a Stripe price is not offered', async ({ page }) => {
      await page.route('**/v1/products**', async (route) => {
        const response = await route.fetch()
        const json = (await response.json()) as OpenlaneProductsResponse
        const unpriced = Object.values(json.modules ?? {}).find((module) => module.lookup_key === secondary.lookup_key)
        if (unpriced) unpriced.billing.prices = unpriced.billing.prices.map((price) => ({ ...price, price_id: undefined }))
        await route.fulfill({ response, json })
      })
      await open(page)

      await expect(productAction(page, primary, 'Unsubscribe')).toBeVisible()
      await expect(productAction(page, secondary, 'Subscribe')).toHaveCount(0)
      await page.unrouteAll({ behavior: 'wait' })
    })

    test('a rejected change surfaces the reason', async ({ page }) => {
      await open(page, { failures: { 'schedules/update': 'This price is not available for purchase' } })
      await expect(page.getByText(VISA.last4, { exact: true })).toBeVisible()
      await productAction(page, secondary, 'Subscribe').click()
      await confirmDialog(page, `Add ${secondary.display_name}?`, 'Confirm')
      await expect(toast(page, 'Subscription failed')).toBeVisible()
      await expect(toast(page, 'This price is not available for purchase')).toBeVisible()
    })
  })

  test.describe('billing interval', () => {
    for (const [from, to, label, title] of [
      ['month', 'year', 'Annual (15% off)', 'Switch to annual billing?'],
      ['year', 'month', 'Monthly', 'Switch to monthly billing?'],
    ] as const) {
      test(`switching from ${from} to ${to} sends only the target interval and refreshes the upcoming cost`, async ({ page }) => {
        await open(page, { interval: from })

        const body = await bodyOfRequest(page, '/api/stripe/schedules/switch', async () => {
          await intervalButton(page, label).click()
          await confirmDialog(page, title, 'Confirm')
        })
        const costRefetched = page.waitForRequest((request) => new URL(request.url()).pathname === '/api/stripe/upcoming-invoice')

        expect(body).toEqual({ scheduleId: FAKE_SCHEDULE_ID, interval: to })
        await costRefetched
        await expect(toast(page, 'Interval switched')).toBeVisible()
        await expect(intervalButton(page, label)).toHaveAttribute('aria-pressed', 'true')
      })
    }

    test('a failed switch keeps the current interval', async ({ page }) => {
      await open(page, { failures: { 'schedules/switch': 'Failed to switch payment schedule' } })
      await intervalButton(page, 'Annual (15% off)').click()
      await confirmDialog(page, 'Switch to annual billing?', 'Confirm')
      await expect(toast(page, 'Switch failed')).toBeVisible()
      await expect(toast(page, 'Failed to switch payment schedule')).toBeVisible()
      await expect(intervalButton(page, 'Monthly')).toHaveAttribute('aria-pressed', 'true')
    })

    test('an item outside the catalog blocks the switch, says why and sends nothing', async ({ page }) => {
      const switches: Request[] = []
      page.on('request', (request) => {
        if (request.url().endsWith('/api/stripe/schedules/switch')) switches.push(request)
      })
      await open(page, { priceIds: [priceIdFor(primary, 'month'), PRICE_OUTSIDE_CATALOG] })

      const annual = intervalButton(page, 'Annual (15% off)')
      await expect(annual).toBeDisabled()
      const reason = intervalSwitchBlockedReason({ swaps: [], unswitchableProducts: [], unknownPriceIds: [PRICE_OUTSIDE_CATALOG] }, 'year')
      await expect(await disabledReason(page, annual)).toHaveText(reason ?? '')
      expect(switches).toHaveLength(0)
    })

    test('during a trial the confirmation says the trial continues', async ({ page }) => {
      const switches: Request[] = []
      page.on('request', (request) => {
        if (request.url().endsWith('/api/stripe/schedules/switch')) switches.push(request)
      })
      await open(page, { status: 'trialing', trial: true })

      await intervalButton(page, 'Annual (15% off)').click()
      const dialog = page.getByRole('alertdialog', { name: 'Switch to annual billing?' })
      await expect(dialog).toContainText('The change applies now. Your trial continues, and your first annual charge is made when it ends.')
      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()

      await expect(intervalButton(page, 'Monthly')).toHaveAttribute('aria-pressed', 'true')
      expect(switches).toHaveLength(0)
    })
  })

  test.describe('cancel and renew', () => {
    test('cancelling locks plan changes until the subscription is renewed', async ({ page }) => {
      const { periodEnd } = await open(page)

      await page.getByRole('button', { name: 'Cancel subscription', exact: true }).click()
      await expect(page.getByRole('alertdialog')).toContainText(formatDate(periodEnd.toISOString()))
      const cancelled = await bodyOfRequest(page, '/api/stripe/schedules/cancel', () => confirmDialog(page, 'Cancel subscription?', 'Confirm'))
      expect(cancelled).toEqual({ scheduleId: FAKE_SCHEDULE_ID })
      await expect(toast(page, 'Subscription cancelled')).toBeVisible()
      await expect(intervalButton(page, 'Annual (15% off)')).toBeDisabled()
      await expect(await disabledReason(page, intervalButton(page, 'Annual (15% off)'))).toHaveText(SWITCH_CANCELED_REASON)
      await page.mouse.move(0, 0)
      await expect(productAction(page, secondary, 'Subscribe')).toBeDisabled()

      await page.getByRole('button', { name: 'Renew subscription', exact: true }).click()
      const renewed = await bodyOfRequest(page, '/api/stripe/schedules/renew', () => confirmDialog(page, 'Renew subscription?', 'Renew'))
      expect(renewed).toEqual({ scheduleId: FAKE_SCHEDULE_ID })
      await expect(toast(page, 'Subscription renewed')).toBeVisible()
      await expect(intervalButton(page, 'Annual (15% off)')).toBeEnabled()
    })

    for (const { endpoint, trigger, title, action, failure, endBehavior } of [
      { endpoint: 'schedules/cancel', trigger: 'Cancel subscription', title: 'Cancel subscription?', action: 'Confirm', failure: 'Cancellation failed', endBehavior: 'release' },
      { endpoint: 'schedules/renew', trigger: 'Renew subscription', title: 'Renew subscription?', action: 'Renew', failure: 'Renewal failed', endBehavior: 'cancel' },
    ] as const) {
      test(`a failed ${endpoint} leaves the subscription as it was`, async ({ page }) => {
        await open(page, { schedule: { end_behavior: endBehavior }, failures: { [endpoint]: 'Stripe said no' } })
        await page.getByRole('button', { name: trigger, exact: true }).click()
        await confirmDialog(page, title, action)
        await expect(toast(page, failure)).toBeVisible()
        await expect(toast(page, 'Stripe said no')).toBeVisible()
        await expect(page.getByRole('button', { name: trigger, exact: true })).toBeEnabled()
      })
    }

    test('a cancelled trial cannot be renewed', async ({ page }) => {
      await open(page, { status: 'trialing', trial: true, schedule: { end_behavior: 'cancel' } })
      await expect(page.getByText('Your trial subscription was cancelled and cannot be renewed.')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Renew subscription' })).toHaveCount(0)
    })

    test('an ended subscription is reported as expired', async ({ page }) => {
      await open(page, { schedule: { status: 'canceled' } })
      await expect(page.getByText('Your subscription has expired.')).toBeVisible()
    })
  })

  test.describe('billing portal', () => {
    const portalUrl = `${BILLING_PATH}?paymentUpdate=success`
    const portalPath = '/api/stripe/create-portal-session'

    test('updating the payment method returns to billing with a confirmation', async ({ page }) => {
      await open(page, { portalUrl })
      const body = await bodyOfRequest(page, portalPath, () => page.getByRole('button', { name: 'Manage', exact: true }).click())
      expect(body).toEqual({ isBillingSettings: false })
      await page.waitForURL((url) => url.searchParams.get('paymentUpdate') === 'success')
      await expect(toast(page, 'Payment method updated')).toBeVisible({ timeout: 30_000 })
    })

    test('viewing all invoices opens the full portal', async ({ page }) => {
      await open(page, { portalUrl })
      const body = await bodyOfRequest(page, portalPath, () => page.getByRole('button', { name: 'View all in stripe' }).click())
      expect(body).toEqual({ isBillingSettings: true })
      await page.waitForURL((url) => url.searchParams.get('paymentUpdate') === 'success')
    })

    test('a subscription with no schedule is managed in the full portal', async ({ page }) => {
      await open(page, { schedule: null, portalUrl })
      const body = await bodyOfRequest(page, portalPath, () => page.getByRole('button', { name: 'Manage subscription in Stripe' }).click())
      expect(body).toEqual({ isBillingSettings: true })
      await page.waitForURL((url) => url.searchParams.get('paymentUpdate') === 'success')
    })

    test('a portal failure is reported and can be retried', async ({ page }) => {
      await open(page, { failures: { 'create-portal-session': 'Failed to create portal session' } })
      const manage = page.getByRole('button', { name: 'Manage', exact: true })
      await manage.click()
      await expect(toast(page, 'Could not open the billing portal')).toBeVisible()
      await expect(manage).toBeEnabled()
    })
  })
})
