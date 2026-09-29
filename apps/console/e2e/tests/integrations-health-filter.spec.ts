import type { Page, Route } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { uniqueName } from '../utils/unique'

type TFakeIntegration = {
  name: string
  status: string
  health?: Record<string, unknown>
}

const fakeNode = ({ name, status, health }: TFakeIntegration, index: number) => ({
  id: `e2e-fake-integration-${index}-${name.replace(/\W+/g, '-')}`,
  name,
  kind: null,
  integrationType: null,
  definitionID: null,
  definitionSlug: null,
  family: null,
  status,
  tags: [],
  description: null,
  metadata: null,
  health: health ?? null,
  primaryDirectory: false,
  createdAt: new Date().toISOString(),
  createdBy: null,
  environmentName: null,
  scopeName: null,
  credentials: null,
  config: null,
})

const isGetIntegrations = (route: Route): boolean => {
  const request = route.request()
  if (request.method() !== 'POST') return false
  const body = request.postData() ?? ''
  return body.includes('query GetIntegrations')
}

const stubIntegrations = async (page: Page, integrations: TFakeIntegration[]): Promise<void> => {
  await page.route('**/query', async (route) => {
    if (!isGetIntegrations(route)) {
      await route.fallback()
      return
    }
    const response = await route.fetch()
    const json = await response.json()
    json.data = { integrations: { edges: integrations.map((integration, index) => ({ node: fakeNode(integration, index) })) } }
    await route.fulfill({ response, json })
  })
}

const openInstalledTab = async (page: Page): Promise<void> => {
  await page.goto('/automation/integrations?tab=installed', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { level: 2, name: /^Integrations$/ })).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('tab', { name: /^Installed \(\d+\)$/ })).toHaveAttribute('aria-selected', 'true', { timeout: 15_000 })
}

const healthGroup = (page: Page) => page.getByRole('group', { name: 'Health:' })
const chip = (page: Page, label: string, count: number) => healthGroup(page).getByRole('button', { name: `${label} (${count})`, exact: true })

const mixedFleet = () => {
  const prefix = uniqueName('E2E Health')
  return {
    connected: { name: `${prefix} Connected`, status: 'CONNECTED' },
    degraded: { name: `${prefix} Degraded`, status: 'DEGRADED', health: { unhealthyOperations: { 'sync-users': 'rate limited by provider' } } },
    errored: { name: `${prefix} Errored`, status: 'ERRORED', health: { unhealthyReason: 'credentials revoked' } },
    disabled: { name: `${prefix} Disabled`, status: 'DISABLED' },
    pending: { name: `${prefix} Pending`, status: 'PENDING' },
  }
}

test.describe('automation — installed integrations health filter (ISS-3052)', () => {
  test('the health chips count only finalized integrations and group Degraded + Needs Attention under Unhealthy', async ({ page }) => {
    test.slow()
    const fleet = mixedFleet()
    await stubIntegrations(page, Object.values(fleet))
    await openInstalledTab(page)

    await expect(page.getByRole('tab', { name: 'Installed (4)', exact: true })).toBeVisible()
    await expect(chip(page, 'All', 4)).toBeVisible({ timeout: 15_000 })
    await expect(chip(page, 'Unhealthy', 2)).toBeVisible()
    await expect(chip(page, 'Healthy', 1)).toBeVisible()
    await expect(chip(page, 'Degraded', 1)).toBeVisible()
    await expect(chip(page, 'Needs Attention', 1)).toBeVisible()
    await expect(chip(page, 'Disabled', 1)).toBeVisible()
    await expect(healthGroup(page).getByRole('button', { name: /^Pending/ })).toHaveCount(0)
    await expect(page.getByText(fleet.pending.name, { exact: true })).toHaveCount(0)
    await expect(chip(page, 'All', 4)).toHaveAttribute('aria-pressed', 'true')
  })

  test('selecting Unhealthy shows exactly the degraded and errored cards, matching its count', async ({ page }) => {
    test.slow()
    const fleet = mixedFleet()
    await stubIntegrations(page, Object.values(fleet))
    await openInstalledTab(page)

    const unhealthy = chip(page, 'Unhealthy', 2)
    await expect(unhealthy).toBeVisible({ timeout: 15_000 })
    await unhealthy.click()

    await expect(unhealthy).toHaveAttribute('aria-pressed', 'true')
    await expect(unhealthy).toHaveClass(/(^|\s)is-active(\s|$)/)
    await expect(chip(page, 'All', 4)).toHaveAttribute('aria-pressed', 'false')

    await expect(page.getByText(fleet.degraded.name, { exact: true })).toBeVisible()
    await expect(page.getByText(fleet.errored.name, { exact: true })).toBeVisible()
    await expect(page.getByText(fleet.connected.name, { exact: true })).toHaveCount(0)
    await expect(page.getByText(fleet.disabled.name, { exact: true })).toHaveCount(0)
    await expect(page.getByText(/^E2E Health .* (Connected|Degraded|Errored|Disabled)$/)).toHaveCount(2)
  })

  test('a single-status chip narrows the grid to that status', async ({ page }) => {
    test.slow()
    const fleet = mixedFleet()
    await stubIntegrations(page, Object.values(fleet))
    await openInstalledTab(page)

    await chip(page, 'Healthy', 1).click()
    await expect(chip(page, 'Healthy', 1)).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 })
    await expect(page.getByText(fleet.connected.name, { exact: true })).toBeVisible()
    await expect(page.getByText(/^E2E Health .* (Connected|Degraded|Errored|Disabled)$/)).toHaveCount(1)

    await chip(page, 'All', 4).click()
    await expect(page.getByText(/^E2E Health .* (Connected|Degraded|Errored|Disabled)$/)).toHaveCount(4, { timeout: 10_000 })
  })

  test('the search box narrows the chip counts along with the cards', async ({ page }) => {
    test.slow()
    const fleet = mixedFleet()
    await stubIntegrations(page, Object.values(fleet))
    await openInstalledTab(page)
    await expect(chip(page, 'All', 4)).toBeVisible({ timeout: 15_000 })

    await page.getByPlaceholder('Search integrations...').fill(fleet.degraded.name)

    await expect(chip(page, 'All', 1)).toBeVisible({ timeout: 10_000 })
    await expect(chip(page, 'Unhealthy', 1)).toBeVisible()
    await expect(chip(page, 'Degraded', 1)).toBeVisible()
    await expect(healthGroup(page).getByRole('button', { name: /^(Healthy|Needs Attention|Disabled) \(/ })).toHaveCount(0)
    await expect(page.getByText(fleet.degraded.name, { exact: true })).toBeVisible()
  })

  test('the Unhealthy tooltip names the statuses it includes', async ({ page }) => {
    test.slow()
    await stubIntegrations(page, Object.values(mixedFleet()))
    await openInstalledTab(page)

    await chip(page, 'Unhealthy', 2).hover()
    await expect(page.getByText('Includes Degraded and Needs Attention integrations.').first()).toBeVisible({ timeout: 10_000 })
  })

  test('a degraded card surfaces its failing operations and an errored card its reason', async ({ page }) => {
    test.slow()
    await stubIntegrations(page, Object.values(mixedFleet()))
    await openInstalledTab(page)

    await page.getByText('Degraded', { exact: true }).last().hover()
    await expect(page.getByText('sync-users: rate limited by provider').first()).toBeVisible({ timeout: 10_000 })

    await page.mouse.move(0, 0)
    await page.getByText('Needs Attention', { exact: true }).last().hover()
    await expect(page.getByText('credentials revoked').first()).toBeVisible({ timeout: 10_000 })
  })

  test('with only healthy integrations the Unhealthy chip reads zero and selecting it shows the filtered empty state', async ({ page }) => {
    test.slow()
    const prefix = uniqueName('E2E Healthy')
    await stubIntegrations(page, [
      { name: `${prefix} One`, status: 'CONNECTED' },
      { name: `${prefix} Two`, status: 'CONNECTED' },
    ])
    await openInstalledTab(page)

    const unhealthy = chip(page, 'Unhealthy', 0)
    await expect(unhealthy).toBeVisible({ timeout: 15_000 })
    await unhealthy.click()

    await expect(page.getByText('No installed integrations match your filters')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(`${prefix} One`, { exact: true })).toHaveCount(0)
  })

  test('with nothing installed the tab shows the install prompt and no health chips', async ({ page }) => {
    test.slow()
    await stubIntegrations(page, [])
    await openInstalledTab(page)

    await expect(page.getByText('No integrations installed')).toBeVisible({ timeout: 15_000 })
    await expect(healthGroup(page)).toHaveCount(0)
    await expect(page.getByRole('tab', { name: 'Installed (0)', exact: true })).toBeVisible()
  })

  test.fail('an integration with a status the console does not know is still listed and counted as Unhealthy', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Health Unknown')
    await stubIntegrations(page, [
      { name: uniqueName('E2E Health Known'), status: 'CONNECTED' },
      { name, status: 'INVALID' },
    ])
    await openInstalledTab(page)

    await expect(chip(page, 'Unhealthy', 1)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(name, { exact: true })).toBeVisible()
  })
})
