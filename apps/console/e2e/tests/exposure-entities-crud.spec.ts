import type { Locator, Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { createFinding, createRemediation, createScan, createVulnerability, deleteFinding, deleteRemediation, deleteScan, deleteVulnerability, getOwnerApi, gql, type ApiSession } from '../utils/api'
import { uniqueName, uniqueRef } from '../utils/unique'

type EntityConfig = {
  slug: string
  objectName: string
  heading: RegExp
  makeName: () => string
  seed: (sess: ApiSession, name: string) => Promise<string>
  remove: (sess: ApiSession, id: string) => Promise<void>
  findId: (sess: ApiSession, name: string) => Promise<string | undefined>
  fillCreateForm: (sheet: Locator, name: string) => Promise<void>
  mutateVia: 'sheet' | 'bulk'
  statusOf?: (sess: ApiSession, id: string) => Promise<string | undefined>
  fillCreateFormMissingRequired?: (sheet: Locator, name: string) => Promise<void>
}

const idFromQuery = async (sess: ApiSession, field: string, plural: string, name: string): Promise<string | undefined> => {
  const res = await gql<Record<string, { edges: Array<{ node: { id: string } }> }>>(sess, `query($n: String!){ ${plural}(where: { ${field}: $n }, first: 1){ edges { node { id } } } }`, { n: name })
  return res.data?.[plural]?.edges?.[0]?.node?.id
}

const ENTITIES: EntityConfig[] = [
  {
    slug: 'findings',
    objectName: 'Finding',
    heading: /^Findings$/,
    makeName: () => uniqueName('E2E Finding'),
    seed: (sess, name) => createFinding(sess, name, { open: true }),
    remove: deleteFinding,
    findId: (sess, name) => idFromQuery(sess, 'displayNameContainsFold', 'findings', name),
    fillCreateForm: async (sheet, name) => {
      await sheet.getByRole('textbox').first().fill(name)
    },
    mutateVia: 'sheet',
  },
  {
    slug: 'scans',
    objectName: 'Scan',
    heading: /^Scans$/,
    makeName: () => `${uniqueRef('e2e-scan').toLowerCase()}.invalid`,
    seed: (sess, target) => createScan(sess, target),
    remove: deleteScan,
    findId: (sess, name) => idFromQuery(sess, 'targetContainsFold', 'scans', name),
    fillCreateForm: async (sheet, name) => {
      await sheet.getByRole('textbox').first().fill(name)
    },
    mutateVia: 'bulk',
    statusOf: async (sess, id) => {
      const res = await gql<{ scan: { status: string } }>(sess, `query($id: ID!){ scan(id: $id){ status } }`, { id })
      return res.data?.scan?.status
    },
    fillCreateFormMissingRequired: async () => {},
  },
  {
    slug: 'remediations',
    objectName: 'Remediation',
    heading: /^Remediations$/,
    makeName: () => uniqueName('E2E Remediation'),
    seed: (sess, title) => createRemediation(sess, title),
    remove: deleteRemediation,
    findId: (sess, name) => idFromQuery(sess, 'titleContainsFold', 'remediations', name),
    fillCreateForm: async (sheet, name) => {
      await sheet.getByRole('textbox').first().fill(name)
    },
    mutateVia: 'sheet',
  },
  {
    slug: 'vulnerabilities',
    objectName: 'Vulnerability',
    heading: /^Vulnerabilities$/,
    makeName: () => uniqueName('E2E Vulnerability'),
    seed: (sess, name) => createVulnerability(sess, name, uniqueRef('CVE-E2E'), { open: true }),
    remove: deleteVulnerability,
    findId: (sess, name) => idFromQuery(sess, 'displayNameContainsFold', 'vulnerabilities', name),
    fillCreateForm: async (sheet, name) => {
      await sheet.getByRole('textbox').first().fill(name)
      await sheet.getByLabel(/^External ID$/).fill(uniqueRef('E2E-EXT'))
    },
    mutateVia: 'sheet',
    fillCreateFormMissingRequired: async (sheet, name) => {
      await sheet.getByRole('textbox').first().fill(name)
    },
  },
]

let ownerApi: ApiSession

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
})

const openList = async (page: Page, entity: EntityConfig) => {
  await page.goto(`/exposure/${entity.slug}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('heading', { level: 2, name: entity.heading })).toBeVisible({ timeout: 60_000 })
}

const openDetailSheet = async (page: Page, entity: EntityConfig, id: string): Promise<Locator> => {
  await page.goto(`/exposure/${entity.slug}?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  const sheet = page.getByRole('dialog')
  await expect(sheet).toBeVisible({ timeout: 60_000 })
  return sheet
}

const searchRow = async (page: Page, name: string): Promise<Locator> => {
  await page.getByPlaceholder(/^Search/).fill(name)
  const row = page.getByRole('row').filter({ hasText: name }).first()
  await expect(row).toBeVisible({ timeout: 30_000 })
  return row
}

for (const entity of ENTITIES) {
  test.describe(`exposure — ${entity.slug} CRUD`, () => {
    test(`a ${entity.slug} created through the form is persisted`, async ({ page }) => {
      test.slow()
      const name = entity.makeName()
      let id: string | undefined

      try {
        await openList(page, entity)
        await page.getByRole('button', { name: /^Create$/ }).click()

        const sheet = page.getByRole('dialog')
        await expect(sheet).toBeVisible({ timeout: 30_000 })
        await expect(sheet.getByText(`Create ${entity.objectName}`, { exact: true }).first()).toBeVisible({ timeout: 20_000 })

        await entity.fillCreateForm(sheet, name)
        await sheet.getByRole('button', { name: /^Create$/ }).click()

        await expect.poll(async () => Boolean(await entity.findId(ownerApi, name)), { timeout: 60_000 }).toBe(true)
        id = await entity.findId(ownerApi, name)
      } finally {
        if (!id) id = await entity.findId(ownerApi, name)
        if (id) await entity.remove(ownerApi, id)
      }
    })

    if (entity.mutateVia === 'sheet') {
      test(`editing a ${entity.slug} record from its detail sheet persists`, async ({ page }) => {
        test.slow()
        const name = entity.makeName()
        const renamed = `${name} revised`
        const id = await entity.seed(ownerApi, name)

        try {
          const sheet = await openDetailSheet(page, entity, id)
          const editButton = sheet
            .locator('button')
            .filter({ hasText: /^Edit$/ })
            .first()
          const primary = sheet.getByRole('textbox').first()

          await expect(async () => {
            if (!(await primary.isEditable().catch(() => false))) {
              await editButton.click()
            }
            await expect(primary).toBeEditable({ timeout: 10_000 })
          }).toPass({ timeout: 60_000 })

          await primary.fill(renamed)
          await sheet.getByRole('button', { name: /^Save( Changes)?$/ }).click()

          await expect.poll(async () => Boolean(await entity.findId(ownerApi, renamed)), { timeout: 60_000 }).toBe(true)
        } finally {
          await entity.remove(ownerApi, id)
        }
      })

      test(`deleting a ${entity.slug} record from its detail sheet removes it`, async ({ page }) => {
        test.slow()
        const name = entity.makeName()
        const id = await entity.seed(ownerApi, name)
        let deleted = false

        try {
          const sheet = await openDetailSheet(page, entity, id)
          await sheet
            .locator('button')
            .filter({ hasText: /^Delete$/ })
            .first()
            .click()

          const confirmation = page.getByRole('alertdialog')
          await expect(confirmation).toBeVisible({ timeout: 20_000 })
          await confirmation
            .getByRole('button')
            .filter({ hasText: /^Delete$/ })
            .first()
            .dispatchEvent('click')

          await expect.poll(async () => entity.findId(ownerApi, name), { timeout: 60_000 }).toBeFalsy()
          deleted = true
        } finally {
          if (!deleted) await entity.remove(ownerApi, id)
        }
      })
    } else {
      test(`bulk editing a ${entity.slug} record persists the new status`, async ({ page }) => {
        test.slow()
        const name = entity.makeName()
        const id = await entity.seed(ownerApi, name)

        try {
          await openList(page, entity)
          const row = await searchRow(page, name)
          await row.getByRole('checkbox').first().check()

          await page.getByRole('button', { name: /^Bulk Edit/ }).click()
          const dialog = page.getByRole('dialog')
          await expect(dialog).toBeVisible({ timeout: 20_000 })

          await dialog.getByRole('combobox').first().click()
          await page.getByRole('option', { name: 'Status', exact: true }).click()

          await dialog
            .getByRole('combobox')
            .filter({ hasText: /^Select status\.\.\.$/ })
            .click()
          const statusOption = page.getByRole('option').first()
          await expect(statusOption).toBeVisible({ timeout: 15_000 })
          const chosenStatus = (await statusOption.innerText()).trim()
          await statusOption.click()

          const save = dialog.getByRole('button', { name: /^Save Changes$/ })
          await expect(save).toBeEnabled({ timeout: 15_000 })
          await save.click()

          await expect.poll(async () => entity.statusOf?.(ownerApi, id), { timeout: 60_000 }).toBe(chosenStatus.toUpperCase().replace(/ /g, '_'))
        } finally {
          await entity.remove(ownerApi, id)
        }
      })

      test(`bulk deleting a ${entity.slug} record removes it`, async ({ page }) => {
        test.slow()
        const name = entity.makeName()
        const id = await entity.seed(ownerApi, name)
        let deleted = false

        try {
          await openList(page, entity)
          const row = await searchRow(page, name)
          await row.getByRole('checkbox').first().check()

          await page.getByRole('button', { name: /^Bulk Delete/ }).click()
          await page
            .getByRole('alertdialog')
            .getByRole('button')
            .filter({ hasText: /^Delete$/ })
            .first()
            .dispatchEvent('click')

          await expect.poll(async () => entity.findId(ownerApi, name), { timeout: 60_000 }).toBeFalsy()
          deleted = true
        } finally {
          if (!deleted) await entity.remove(ownerApi, id)
        }
      })
    }

    if (entity.fillCreateFormMissingRequired) {
      test(`a ${entity.slug} record is not created when a required field is missing`, async ({ page }) => {
        test.slow()
        const name = entity.makeName()

        await openList(page, entity)
        await page.getByRole('button', { name: /^Create$/ }).click()

        const sheet = page.getByRole('dialog')
        await expect(sheet).toBeVisible({ timeout: 30_000 })
        await entity.fillCreateFormMissingRequired?.(sheet, name)
        await sheet.getByRole('button', { name: /^Create$/ }).click()

        await expect(sheet).toBeVisible({ timeout: 10_000 })
        expect(await entity.findId(ownerApi, name)).toBeFalsy()
      })
    }
  })
}
