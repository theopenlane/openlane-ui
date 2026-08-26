import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { createPlatform, getOwnerApi, gql, type ApiSession } from '../utils/api'
import { uniqueName } from '../utils/unique'

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const deletePlatform = async (sess: ApiSession, id: string): Promise<void> => {
  await gql(sess, `mutation($id: ID!){ deletePlatform(id: $id){ deletedID } }`, { id })
}

const findPlatformIdByName = async (sess: ApiSession, name: string): Promise<string | null> => {
  const res = await gql<{ platforms: { edges: Array<{ node: { id: string } }> } }>(sess, `query($name: String!){ platforms(where: { name: $name }) { edges { node { id } } } }`, { name })
  return res.data?.platforms?.edges?.[0]?.node?.id ?? null
}

const openPlatformDetail = async (page: Page, id: string, name: string) => {
  await page.goto(`/registry/platforms/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByText(name).first()).toBeVisible({ timeout: 120_000 })
}

let ownerApi: ApiSession
let filler: string

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
  filler = await createPlatform(ownerApi, uniqueName('E2E Platform filler'))
})

test.afterAll(async () => {
  if (filler) await deletePlatform(ownerApi, filler)
})

test.describe('registry — platform detail', () => {
  test('a seeded platform renders on its detail route', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Platform view')
    const id = await createPlatform(ownerApi, name)

    try {
      await openPlatformDetail(page, id, name)
      await expect(page.getByRole('button', { name: 'Action' })).toBeVisible({ timeout: 60_000 })
    } finally {
      await deletePlatform(ownerApi, id)
    }
  })

  test('the platform card links through to the detail route', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Platform card')
    const id = await createPlatform(ownerApi, name)

    try {
      await page.goto('/registry/platforms', { waitUntil: 'domcontentloaded', timeout: 180_000 })
      const card = page.locator('a', { hasText: 'View Platform' }).filter({ has: page.getByText(name) })
      const link = (await card.count()) > 0 ? card.first() : page.getByRole('link', { name: /View Platform/ }).first()
      await expect(link).toBeVisible({ timeout: 120_000 })
      await link.click()

      await expect(page).toHaveURL(/\/registry\/platforms\/[^/]+$/, { timeout: 60_000 })
    } finally {
      await deletePlatform(ownerApi, id)
    }
  })

  test('editing the platform description persists across a reload', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Platform edit')
    const description = uniqueName('E2E platform purpose')
    const id = await createPlatform(ownerApi, name)

    try {
      await openPlatformDetail(page, id, name)
      await page.getByRole('button', { name: 'Action' }).click()
      await page.getByRole('button', { name: /^Edit$/ }).click()

      const field = page.getByPlaceholder('Briefly describe this platform...')
      await expect(field).toBeEditable({ timeout: 60_000 })
      await field.fill(description)
      await page.getByRole('button', { name: /^Save Changes$/ }).click()

      await expect(page.getByText('Platform updated', { exact: true }).first()).toBeVisible({ timeout: 60_000 })

      await openPlatformDetail(page, id, name)
      await expect(page.getByText(description).first()).toBeVisible({ timeout: 60_000 })
    } finally {
      await deletePlatform(ownerApi, id)
    }
  })

  test('Cancel abandons an unsaved platform edit', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Platform cancel')
    const id = await createPlatform(ownerApi, name)

    try {
      await openPlatformDetail(page, id, name)
      await page.getByRole('button', { name: 'Action' }).click()
      await page.getByRole('button', { name: /^Edit$/ }).click()

      const field = page.getByPlaceholder('Briefly describe this platform...')
      await expect(field).toBeEditable({ timeout: 60_000 })
      await field.fill('discarded-by-e2e')
      await page.getByRole('button', { name: /^Cancel$/ }).click()

      await expect(page.getByRole('button', { name: 'Action' })).toBeVisible({ timeout: 60_000 })
      await expect(page.getByText('discarded-by-e2e')).toHaveCount(0, { timeout: 30_000 })
    } finally {
      await deletePlatform(ownerApi, id)
    }
  })

  test('deleting a platform confirms and redirects to the platform list', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Platform delete')
    let deletedInUi = false
    const id = await createPlatform(ownerApi, name)

    try {
      await openPlatformDetail(page, id, name)
      await page.getByRole('button', { name: 'Action' }).click()
      await page.getByRole('button', { name: /^Delete$/ }).click()

      const confirmation = page.getByRole('alertdialog')
      await expect(confirmation.getByRole('heading', { name: /^Delete Platform$/ })).toBeVisible({ timeout: 20_000 })
      await confirmation.getByRole('button', { name: /^Delete$/ }).click()

      await expect(page.getByText('Platform deleted', { exact: true }).first()).toBeVisible({ timeout: 60_000 })
      deletedInUi = true
      await expect(page).toHaveURL(/\/registry\/platforms$/, { timeout: 60_000 })
    } finally {
      if (!deletedInUi) await deletePlatform(ownerApi, id)
    }
  })
})

test.describe('registry — platform create wizard', () => {
  test('the wizard steps through every stage and creates the platform', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Platform wizard')
    let createdId: string | null = null

    try {
      await page.goto('/registry/platforms', { waitUntil: 'domcontentloaded', timeout: 180_000 })
      await page.getByRole('button', { name: /^Create Platform$/ }).click()

      const dialog = page.getByRole('dialog')
      await expect(dialog.getByRole('heading', { name: /^Create Platform$/ })).toBeVisible({ timeout: 60_000 })
      await dialog.getByPlaceholder('SaaS Product').fill(name)

      for (let step = 0; step < 6; step += 1) {
        await dialog.getByRole('button', { name: /^Next$/ }).click()
      }

      await dialog.getByRole('button', { name: /^Create$/ }).click()
      await expect(page.getByText(/Platform Created/i).first()).toBeVisible({ timeout: 60_000 })

      createdId = await findPlatformIdByName(ownerApi, name)
      expect(createdId).not.toBeNull()
    } finally {
      if (createdId) await deletePlatform(ownerApi, createdId)
    }
  })

  test('the wizard blocks Next until the platform has a name', async ({ page }) => {
    test.slow()
    await page.goto('/registry/platforms', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page.getByRole('button', { name: /^Create Platform$/ }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByPlaceholder('SaaS Product')).toBeVisible({ timeout: 60_000 })
    await dialog.getByRole('button', { name: /^Next$/ }).click()

    await expect(dialog.getByPlaceholder('SaaS Product')).toBeVisible()
  })
})

test.describe('registry — platform list', () => {
  test('a seeded platform is listed by name', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Platform listed')
    const id = await createPlatform(ownerApi, name)

    try {
      await page.goto('/registry/platforms', { waitUntil: 'domcontentloaded', timeout: 180_000 })
      await expect(page.getByText(new RegExp(escapeRegExp(name))).first()).toBeVisible({ timeout: 120_000 })
    } finally {
      await deletePlatform(ownerApi, id)
    }
  })
})
