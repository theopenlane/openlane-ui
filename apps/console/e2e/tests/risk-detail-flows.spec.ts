import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { createRisk, getOwnerApi, gql, type ApiSession } from '../utils/api'
import { uniqueName } from '../utils/unique'

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const deleteRisk = async (sess: ApiSession, id: string): Promise<void> => {
  await gql(sess, `mutation($id: ID!){ deleteRisk(id: $id){ deletedID } }`, { id })
}

const openRisk = async (page: Page, id: string, name: string) => {
  await page.goto(`/exposure/risks/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('heading', { name: new RegExp(escapeRegExp(name)) }).first()).toBeVisible({ timeout: 60_000 })
}

const scoreSlider = (page: Page) => page.getByRole('slider').first()

const setScore = async (page: Page, target: number): Promise<void> => {
  const slider = scoreSlider(page)
  await expect(slider).toBeVisible({ timeout: 30_000 })
  await slider.focus()
  for (let guard = 0; guard < 40; guard += 1) {
    const current = Number(await slider.inputValue())
    if (current === target) return
    await page.keyboard.press(current < target ? 'ArrowRight' : 'ArrowLeft')
  }
  throw new Error(`score slider never reached ${target}`)
}

const runQuickAction = async (page: Page, label: string): Promise<void> => {
  const direct = page.getByRole('button', { name: label, exact: true })
  if (await direct.isVisible().catch(() => false)) {
    await direct.click()
    return
  }
  await page.getByRole('button', { name: 'More quick actions' }).click()
  await page.getByRole('button', { name: label, exact: true }).click()
}

let ownerApi: ApiSession

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
})

test.describe('exposure — risk properties sidebar', () => {
  test('a Score set in edit mode survives a reload', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Risk score')
    const id = await createRisk(ownerApi, name, { score: 3 })

    try {
      await openRisk(page, id, name)
      await page.getByRole('button', { name: 'Edit risk', exact: true }).click()

      await setScore(page, 7)
      await page.getByRole('button', { name: /^Save Changes$/ }).click()
      await expect(page.getByText('Risk updated', { exact: true }).first()).toBeVisible({ timeout: 30_000 })

      await openRisk(page, id, name)
      await page.getByRole('button', { name: 'Edit risk', exact: true }).click()
      await expect(scoreSlider(page)).toHaveValue('7', { timeout: 30_000 })
    } finally {
      await deleteRisk(ownerApi, id)
    }
  })

  test('Cancel discards an unsaved Score change', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Risk cancel')
    const id = await createRisk(ownerApi, name, { score: 3 })

    try {
      await openRisk(page, id, name)
      await page.getByRole('button', { name: 'Edit risk', exact: true }).click()

      await setScore(page, 12)
      await page.getByRole('button', { name: /^Cancel$/ }).click()
      await expect(page.getByRole('button', { name: 'Edit risk', exact: true })).toBeVisible({ timeout: 30_000 })

      await openRisk(page, id, name)
      await page.getByRole('button', { name: 'Edit risk', exact: true }).click()
      await expect(scoreSlider(page)).toHaveValue('3', { timeout: 30_000 })
    } finally {
      await deleteRisk(ownerApi, id)
    }
  })
})

test.describe('exposure — risk quick actions', () => {
  test('Mark as Remediated moves the risk to Mitigated', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Risk remediate')
    const id = await createRisk(ownerApi, name)

    try {
      await openRisk(page, id, name)
      await runQuickAction(page, 'Mark as Remediated')

      await expect(page.getByText('Risk updated', { exact: true }).first()).toBeVisible({ timeout: 30_000 })

      await openRisk(page, id, name)
      await expect(page.getByText('Mitigated', { exact: true }).first()).toBeVisible({ timeout: 30_000 })
    } finally {
      await deleteRisk(ownerApi, id)
    }
  })
})
