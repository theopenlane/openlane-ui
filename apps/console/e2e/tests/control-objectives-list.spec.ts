import type { Page } from '@playwright/test'

import { test, expect, readManifest } from '../fixtures/auth'
import { createControl, createControlObjective, deleteControl, deleteControlObjective, getOwnerApi, type ApiSession } from '../utils/api'
import { uniqueName, uniqueRef } from '../utils/unique'

let ownerApi: ApiSession
let sharedControlId: string

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
  sharedControlId = readManifest().sharedControlId
})

const openObjectives = async (page: Page, controlId: string) => {
  await page.goto(`/controls/${controlId}/control-objectives`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('heading', { name: 'Control Objectives' })).toBeVisible({ timeout: 60_000 })
}

test.describe('controls — control objectives list', () => {
  test('an archived objective is hidden until Show archived is ticked', async ({ page }) => {
    test.slow()
    const controlRef = uniqueRef('E2E-OBJARCH')
    const controlId = await createControl(ownerApi, controlRef)
    const archivedName = uniqueName('E2E Archived Objective')
    const objectiveId = await createControlObjective(ownerApi, archivedName, [controlId], 'ARCHIVED')

    try {
      await openObjectives(page, controlId)

      await expect(page.getByText('No Objective found for this Control.')).toBeVisible({ timeout: 60_000 })

      await page.getByRole('checkbox', { name: 'Show archived' }).check()

      await expect(page.getByRole('button', { name: 'Objective actions' }).first()).toBeVisible({ timeout: 60_000 })
      await expect(page.getByText('No Objective found for this Control.')).toHaveCount(0)
    } finally {
      await deleteControlObjective(ownerApi, objectiveId)
      await deleteControl(ownerApi, controlId)
    }
  })

  test('an archived objective offers Unarchive instead of Edit', async ({ page }) => {
    test.slow()
    const controlRef = uniqueRef('E2E-OBJUNARCH')
    const controlId = await createControl(ownerApi, controlRef)
    const objectiveId = await createControlObjective(ownerApi, uniqueName('E2E Archived Objective'), [controlId], 'ARCHIVED')

    try {
      await openObjectives(page, controlId)
      await page.getByRole('checkbox', { name: 'Show archived' }).check()

      await page.getByRole('button', { name: 'Objective actions' }).first().click()
      await expect(page.getByRole('button', { name: /^Unarchive$/ })).toBeVisible({ timeout: 30_000 })
      await expect(page.getByRole('button', { name: /^Edit$/ })).toHaveCount(0)
    } finally {
      await deleteControlObjective(ownerApi, objectiveId)
      await deleteControl(ownerApi, controlId)
    }
  })

  test('an objective linked to one control offers Delete', async ({ page }) => {
    test.slow()
    const controlId = await createControl(ownerApi, uniqueRef('E2E-OBJDEL'))
    const objectiveId = await createControlObjective(ownerApi, uniqueName('E2E Single-link Objective'), [controlId])

    try {
      await openObjectives(page, controlId)
      await page.getByRole('button', { name: 'Objective actions' }).first().click()

      await expect(page.getByRole('button', { name: /^Delete$/ })).toBeVisible({ timeout: 30_000 })
      await expect(page.getByRole('button', { name: /^Unlink$/ })).toHaveCount(0)
    } finally {
      await deleteControlObjective(ownerApi, objectiveId)
      await deleteControl(ownerApi, controlId)
    }
  })

  test('an objective linked to two controls offers Unlink instead of Delete', async ({ page }) => {
    test.slow()
    const firstControlId = await createControl(ownerApi, uniqueRef('E2E-OBJLINKA'))
    const secondControlId = await createControl(ownerApi, uniqueRef('E2E-OBJLINKB'))
    const objectiveId = await createControlObjective(ownerApi, uniqueName('E2E Multi-link Objective'), [firstControlId, secondControlId])

    try {
      await openObjectives(page, firstControlId)
      await page.getByRole('button', { name: 'Objective actions' }).first().click()

      await expect(page.getByRole('button', { name: /^Unlink$/ })).toBeVisible({ timeout: 30_000 })
      await expect(page.getByRole('button', { name: /^Delete$/ })).toHaveCount(0)
    } finally {
      await deleteControlObjective(ownerApi, objectiveId)
      await deleteControl(ownerApi, firstControlId)
      await deleteControl(ownerApi, secondControlId)
    }
  })

  test('the objective card offers the Set associations modal', async ({ page }) => {
    test.slow()
    const objectiveId = await createControlObjective(ownerApi, uniqueName('E2E Assoc Objective'), [sharedControlId])

    try {
      await openObjectives(page, sharedControlId)

      const associations = page.getByRole('button', { name: 'Set associations' }).first()
      await expect(associations).toBeVisible({ timeout: 60_000 })
      await associations.click()

      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 30_000 })
    } finally {
      await deleteControlObjective(ownerApi, objectiveId)
    }
  })
})
