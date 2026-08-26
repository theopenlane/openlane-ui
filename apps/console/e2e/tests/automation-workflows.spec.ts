import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { createWorkflowDefinition, deleteWorkflowDefinition, findWorkflowDefinitionId, getAutomationApi } from '../utils/api-automation'
import type { ApiSession } from '../utils/api'
import { confirmDestructiveDialog, openRowAction } from '../utils/menu'
import { uniqueName } from '../utils/unique'

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const rowFor = (page: Page, name: string) => page.getByRole('row', { name: new RegExp(escapeRegExp(name)) })

const openWorkflows = async (page: Page): Promise<void> => {
  await page.goto('/automation/workflows', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByPlaceholder('Search')).toBeVisible({ timeout: 30_000 })
}

const expectAbsentAfterReload = async (page: Page, term: string, names: string[]): Promise<void> => {
  await page.reload({ waitUntil: 'domcontentloaded' })
  const search = page.getByPlaceholder('Search')
  const emptyState = page.getByRole('heading', { name: 'Create your first workflow' })
  await expect(search.or(emptyState)).toBeVisible({ timeout: 30_000 })
  if (!(await search.isVisible().catch(() => false))) return

  await search.fill(term)
  for (const name of names) await expect(rowFor(page, name)).toHaveCount(0, { timeout: 45_000 })
}

const TRIGGER_DESCRIPTION = {
  Create: 'Runs when a new record is created.',
  Update: 'Runs when tracked fields or edges change.',
  Delete: 'Runs when a record is removed.',
} as const

const triggerButton = (page: Page, operation: 'Create' | 'Update' | 'Delete') => page.getByRole('button').filter({ hasText: TRIGGER_DESCRIPTION[operation] })

const ACTION_SUMMARY_LABEL: Record<string, string> = {
  'Request approval': 'Approval',
  'Request review': 'Review',
  'Send notification': 'Notification',
  'Send webhook': 'Webhook',
  'Update a field': 'Field update',
}

const resetWorkflowFilters = async (page: Page): Promise<void> => {
  await page.getByRole('button', { name: /^Filter(?: \d+)?$/ }).click()
  await page.getByRole('button', { name: 'Reset filters' }).click()
}

const selectWizardFlow = async (page: Page, operation: 'Create' | 'Update' | 'Delete', action: string): Promise<void> => {
  await expect(page.getByRole('button', { name: /^Control$/ })).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: /^Control$/ }).click()
  await triggerButton(page, operation).click()
  await page.getByRole('button', { name: new RegExp(`^${escapeRegExp(action)}\\b`) }).click()
}

let ownerApi: ApiSession

test.beforeAll(async () => {
  ownerApi = await getAutomationApi()
})

test('the workflows table renders seeded metadata in its data columns', async ({ page }) => {
  const name = uniqueName('E2E Workflow table')
  const description = uniqueName('Workflow table description')
  const id = await createWorkflowDefinition(ownerApi, name, { description, workflowKind: 'NOTIFICATION', active: true, draft: false })

  try {
    await openWorkflows(page)
    await page.getByPlaceholder('Search').fill(name)

    const row = rowFor(page, name)
    await expect(row).toBeVisible({ timeout: 20_000 })
    await expect(row).toContainText(description)
    await expect(row).toContainText('Control')
    await expect(row).toContainText('Notification')
    await expect(row).toContainText('Active')

    for (const header of ['Name', 'Description', 'Schema', 'Kind', 'Status', 'Updated At']) {
      await expect(page.getByRole('columnheader', { name: new RegExp(`^${header}\\b`) })).toBeVisible({ timeout: 30_000 })
    }
  } finally {
    await deleteWorkflowDefinition(ownerApi, id)
  }
})

test('workflow search matches both name and description and excludes a nonmatch', async ({ page }) => {
  const wantedName = uniqueName('E2E Workflow wanted')
  const descriptionOnly = uniqueName('E2E Workflow description needle')
  const otherName = uniqueName('E2E Workflow other')
  const ids = [
    await createWorkflowDefinition(ownerApi, wantedName),
    await createWorkflowDefinition(ownerApi, uniqueName('E2E Workflow described'), { description: descriptionOnly }),
    await createWorkflowDefinition(ownerApi, otherName),
  ]

  try {
    await openWorkflows(page)
    const search = page.getByPlaceholder('Search')
    await search.fill(wantedName)
    await expect(rowFor(page, wantedName)).toBeVisible({ timeout: 20_000 })
    await expect(rowFor(page, otherName)).toHaveCount(0)

    await search.fill(descriptionOnly)
    await expect(page.getByRole('row').filter({ hasText: descriptionOnly })).toBeVisible({ timeout: 20_000 })
    await expect(rowFor(page, wantedName)).toHaveCount(0)
  } finally {
    for (const id of ids) await deleteWorkflowDefinition(ownerApi, id)
  }
})

test('workflow filters restrict a searched fixture set by status, kind, and default state', async ({ page }) => {
  const prefix = uniqueName('E2E Workflow filters')
  const activeName = `${prefix} Active`
  const inactiveName = `${prefix} Inactive`
  const defaultName = `${prefix} Default`
  const ids = [
    await createWorkflowDefinition(ownerApi, activeName, { active: true, draft: false, workflowKind: 'APPROVAL' }),
    await createWorkflowDefinition(ownerApi, inactiveName, { active: false, draft: false, workflowKind: 'NOTIFICATION' }),
    await createWorkflowDefinition(ownerApi, defaultName, { active: true, draft: false, isDefault: true, workflowKind: 'LIFECYCLE' }),
  ]

  try {
    await openWorkflows(page)
    await page.getByPlaceholder('Search').fill(prefix)
    await expect(rowFor(page, activeName)).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Filter$/ }).click()
    const statusSection = page
      .getByRole('menu')
      .getByRole('button', { name: 'Active', exact: true })
      .filter({ has: page.locator('svg') })
    await statusSection.click()
    await page.getByRole('menu').getByText('Inactive', { exact: true }).click()
    await page.getByRole('button', { name: 'View Results' }).click()
    await expect(rowFor(page, inactiveName)).toBeVisible({ timeout: 20_000 })
    await expect(rowFor(page, activeName)).toHaveCount(0)

    await resetWorkflowFilters(page)
    await page.getByRole('button', { name: /^Filter$/ }).click()
    await page.getByRole('menu').getByRole('button', { name: 'Kind', exact: true }).click()
    await page.getByRole('menu').getByText('Notification', { exact: true }).click()
    await page.getByRole('button', { name: 'View Results' }).click()
    await expect(rowFor(page, inactiveName)).toBeVisible({ timeout: 20_000 })
    await expect(rowFor(page, defaultName)).toHaveCount(0)

    await resetWorkflowFilters(page)
    await page.getByRole('button', { name: /^Filter$/ }).click()
    await page.getByRole('menu').getByRole('button', { name: 'Default', exact: true }).click()
    await page.getByRole('menu').getByText('Not Default', { exact: true }).click()
    await page.getByRole('button', { name: 'View Results' }).click()
    await expect(rowFor(page, activeName)).toBeVisible({ timeout: 20_000 })
    await expect(rowFor(page, defaultName)).toHaveCount(0)
  } finally {
    for (const id of ids) await deleteWorkflowDefinition(ownerApi, id)
  }
})

test('selecting two workflows and confirming bulk delete removes both after reload', async ({ page }) => {
  const prefix = uniqueName('E2E Workflow bulk delete')
  const names = [`${prefix} Alpha`, `${prefix} Bravo`]
  const ids = [await createWorkflowDefinition(ownerApi, names[0]), await createWorkflowDefinition(ownerApi, names[1])]

  try {
    await openWorkflows(page)
    await page.getByPlaceholder('Search').fill(prefix)
    const bulkDelete = page.getByRole('button', { name: 'Bulk Delete (2)' })
    await expect(async () => {
      for (const name of names) {
        const row = rowFor(page, name)
        await expect(row).toBeVisible({ timeout: 10_000 })
        const checkbox = row.getByRole('checkbox', { name: 'Select row' })
        if (!(await checkbox.isChecked())) await checkbox.check()
      }
      await expect(bulkDelete).toBeVisible({ timeout: 5_000 })
    }).toPass({ timeout: 60_000 })

    await bulkDelete.click()
    await confirmDestructiveDialog(page)

    await expectAbsentAfterReload(page, prefix, names)
  } finally {
    for (const id of ids) await deleteWorkflowDefinition(ownerApi, id)
  }
})

test('a workflow row action deletes one definition and the deletion persists', async ({ page }) => {
  const name = uniqueName('E2E Workflow single delete')
  const id = await createWorkflowDefinition(ownerApi, name)

  try {
    await openWorkflows(page)
    await page.getByPlaceholder('Search').fill(name)
    const row = rowFor(page, name)
    await expect(row).toBeVisible({ timeout: 20_000 })
    await openRowAction(page, row.getByRole('button', { name: 'Row actions' }), page.getByRole('menuitem', { name: 'Delete', exact: true }))
    await confirmDestructiveDialog(page)

    await expectAbsentAfterReload(page, name, [name])
  } finally {
    await deleteWorkflowDefinition(ownerApi, id)
  }
})

test('the workflow table Edit action opens the editor and persists the updated description', async ({ page }) => {
  const name = uniqueName('E2E Workflow table edit')
  const originalDescription = uniqueName('E2E Workflow original description')
  const updatedDescription = uniqueName('E2E Workflow updated description')
  const id = await createWorkflowDefinition(ownerApi, name, { description: originalDescription })

  try {
    await openWorkflows(page)
    await page.getByPlaceholder('Search').fill(name)
    const row = rowFor(page, name)
    await expect(row).toContainText(originalDescription, { timeout: 20_000 })
    await row.getByRole('button', { name: 'Row actions' }).click()
    await page.getByRole('menuitem', { name: 'Edit' }).click({ timeout: 30_000 })

    await page.waitForURL(new RegExp(`/automation/workflows/editor\\?id=${id}$`), { timeout: 20_000 })
    await expect(page.getByLabel('Name')).toHaveValue(name, { timeout: 30_000 })
    await expect(page.getByLabel('Description')).toHaveValue(originalDescription)
    await page.getByLabel('Description').fill(updatedDescription)
    await page.getByRole('button', { name: 'Save changes' }).click()
    await page.waitForURL(/\/automation\/workflows(?:\?|$)/, { timeout: 30_000 })

    await page.getByPlaceholder('Search').fill(name)
    await expect(rowFor(page, name)).toContainText(updatedDescription, { timeout: 20_000 })
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder('Search').fill(name)
    await expect(rowFor(page, name)).toContainText(updatedDescription, { timeout: 20_000 })
  } finally {
    await deleteWorkflowDefinition(ownerApi, id)
  }
})

test('a workflow definition detail page renders metadata and its stored JSON', async ({ page }) => {
  const name = uniqueName('E2E Workflow detail')
  const description = uniqueName('E2E Workflow detail description')
  const id = await createWorkflowDefinition(ownerApi, name, {
    description,
    definitionJSON: {
      ...{
        version: '1.0',
        name,
        schemaType: 'Control',
        workflowKind: 'APPROVAL',
        approvalTiming: 'POST_COMMIT',
        targets: {},
        triggers: [{ operation: 'UPDATE', objectType: 'Control', fields: ['status'], edges: [] }],
        conditions: [],
        actions: [{ key: 'approval', type: 'REQUEST_APPROVAL', params: { fields: ['status'], targets: [{ type: 'ROLE', id: 'owner' }], required: true } }],
        metadata: {},
      },
    },
  })

  try {
    await page.goto(`/automation/workflows/definitions/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(description, { exact: true })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Control', { exact: true }).first()).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Approval', { exact: true }).first()).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Post-commit', { exact: true })).toBeVisible({ timeout: 30_000 })

    await page.getByRole('tab', { name: 'JSON' }).click()
    await expect(page.getByRole('textbox')).toHaveValue(new RegExp(escapeRegExp(name)))
  } finally {
    await deleteWorkflowDefinition(ownerApi, id)
  }
})

test('the workflow editor refuses to create a definition with an empty builder', async ({ page }) => {
  const name = uniqueName('E2E Workflow empty builder')

  await page.goto('/automation/workflows/editor', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByText('Workflow Details', { exact: true })).toBeVisible({ timeout: 30_000 })
  await page.getByLabel('Name').fill(name)

  await page.getByRole('button', { name: 'Create workflow' }).click()

  await expect(page.getByText('Unable to save workflow', { exact: true }).first()).toBeVisible({ timeout: 30_000 })
  await expect(page).toHaveURL(/\/automation\/workflows\/editor/)
  expect(await findWorkflowDefinitionId(ownerApi, name)).toBeFalsy()
})

test('the workflow editor saves details and settings that persist through reload', async ({ page }) => {
  const name = uniqueName('E2E Workflow editor')
  const description = uniqueName('E2E Workflow editor description')
  const id = await createWorkflowDefinition(ownerApi, name)

  try {
    await page.goto(`/automation/workflows/editor?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByLabel('Name')).toHaveValue(name, { timeout: 30_000 })

    await page.getByLabel('Description').fill(description)
    await page.getByLabel('Cooldown (seconds)').fill('45')
    await page.getByRole('switch', { name: 'Active' }).click()
    await page.getByRole('switch', { name: 'Default for schema' }).click()

    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByText('Workflow updated', { exact: true }).first()).toBeVisible({ timeout: 30_000 })
    await page.waitForURL(/\/automation\/workflows(?:\?|$)/, { timeout: 30_000 })

    await page.getByPlaceholder('Search').fill(name)
    const savedRow = rowFor(page, name)
    await expect(savedRow).toContainText(description, { timeout: 20_000 })
    await expect(savedRow).toContainText('Inactive')
    await expect(savedRow).toContainText('Default')

    await page.goto(`/automation/workflows/editor?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByLabel('Name')).toHaveValue(name, { timeout: 30_000 })
    await expect(page.getByLabel('Description')).toHaveValue(description)
    await expect(page.getByLabel('Cooldown (seconds)')).toHaveValue('45')
  } finally {
    await deleteWorkflowDefinition(ownerApi, id)
  }
})

test('the workflow wizard accepts each trigger operation and preserves it in Refine', async ({ page }) => {
  await page.goto('/automation/workflows/wizard', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('button', { name: /^Control$/ })).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: /^Control$/ }).click()

  for (const [index, operation] of (['Create', 'Update', 'Delete'] as const).entries()) {
    await triggerButton(page, operation).click()
    if (index === 0) await page.getByRole('button', { name: /^Send webhook\b/ }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('Refine the trigger', { exact: true })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(operation, { exact: true }).first()).toBeVisible({ timeout: 30_000 })
    await page.getByRole('button', { name: 'Back' }).click()
  }
})

test('the workflow wizard accepts all five action goals', async ({ page }) => {
  await page.goto('/automation/workflows/wizard', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('button', { name: /^Control$/ })).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: /^Control$/ }).click()
  await triggerButton(page, 'Create').click()

  for (const action of ['Request approval', 'Request review', 'Send notification', 'Send webhook', 'Update a field']) {
    await page.getByRole('button', { name: new RegExp(`^${escapeRegExp(action)}\\b`) }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('Refine the trigger', { exact: true })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(ACTION_SUMMARY_LABEL[action], { exact: true }).first()).toBeVisible({ timeout: 30_000 })
    await page.getByRole('button', { name: 'Back' }).click()
  }
})

test('the workflow wizard navigates Flow through Review and retains prior selections on Back', async ({ page }) => {
  await page.goto('/automation/workflows/wizard', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await selectWizardFlow(page, 'Create', 'Send webhook')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('Refine the trigger', { exact: true })).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('Configure webhook', { exact: true })).toBeVisible({ timeout: 30_000 })
  await page.getByPlaceholder('https://').fill('https://example.invalid/workflow')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('Review & create', { exact: true })).toBeVisible({ timeout: 30_000 })

  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByPlaceholder('https://')).toHaveValue('https://example.invalid/workflow')
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByText('Refine the trigger', { exact: true })).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled()
})

test('the workflow wizard creates a definition and redirects to its detail page', async ({ page }) => {
  const name = uniqueName('E2E Workflow wizard')
  let id: string | undefined

  try {
    await page.goto('/automation/workflows/wizard', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await selectWizardFlow(page, 'Create', 'Send webhook')
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByPlaceholder('https://').fill('https://example.invalid/persisted-workflow')
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByText('Name', { exact: true }).locator('..').getByRole('textbox').fill(name)
    await page.getByRole('button', { name: 'Create workflow' }).click()

    await page.waitForURL(/\/automation\/workflows\/definitions\//, { timeout: 30_000 })
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Webhook', { exact: true })).toBeVisible({ timeout: 30_000 })
    id = await findWorkflowDefinitionId(ownerApi, name)
    expect(id).toBeTruthy()
  } finally {
    if (!id) id = await findWorkflowDefinitionId(ownerApi, name)
    if (id) await deleteWorkflowDefinition(ownerApi, id)
  }
})

test('workflow wizard validation prevents progression until required choices and configuration are valid', async ({ page }) => {
  await page.goto('/automation/workflows/wizard', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  const continueButton = page.getByRole('button', { name: 'Continue' })
  await expect(continueButton).toBeDisabled({ timeout: 30_000 })

  await page.getByRole('button', { name: /^Control$/ }).click()
  await expect(continueButton).toBeDisabled()
  await triggerButton(page, 'Create').click()
  await expect(continueButton).toBeDisabled()
  await page.getByRole('button', { name: /^Send webhook\b/ }).click()
  await expect(continueButton).toBeEnabled()

  await continueButton.click()
  await continueButton.click()
  await expect(page.getByText('Configure webhook', { exact: true })).toBeVisible({ timeout: 30_000 })
  await expect(continueButton).toBeDisabled()
  await page.getByPlaceholder('https://').fill('invalid-url')
  await expect(continueButton).toBeDisabled()
  await page.getByPlaceholder('https://').fill('https://example.invalid/valid')
  await expect(continueButton).toBeEnabled()
})
