import { expect, type Locator, type Page } from '@playwright/test'

import { test } from '../fixtures/auth'
import { A11Y_TAG, COLOR_SCHEMES, expectNoA11yViolations, heading, waitForPageToSettle, type ReadyLocator } from '../utils/accessibility'
import { createTask, getOwnerApi } from '../utils/api'
import { openSubmitEvidenceSheet } from '../utils/evidence'
import { openCreateTaskDialog } from '../utils/tasks'
import { uniqueName } from '../utils/unique'

type Overlay = {
  name: string
  path: string
  ready?: ReadyLocator
  scope: string
  open: (page: Page) => Promise<Locator>
}

const openTaskSheet = async (page: Page): Promise<Locator> => {
  const title = uniqueName('E2E A11y Task')
  await createTask(await getOwnerApi(), title)

  await page.getByPlaceholder(/^Search$/).fill(title)
  await page
    .getByRole('row', { name: new RegExp(title) })
    .getByRole('cell')
    .filter({ hasText: title })
    .first()
    .click()
  return page.getByRole('dialog')
}

const OVERLAYS: Overlay[] = [
  {
    name: 'command palette',
    path: '/dashboard',
    ready: (page) => page.getByText(/^Welcome,/),
    scope: '[role="dialog"]',
    open: async (page) => {
      await page.keyboard.press('ControlOrMeta+k')
      return page.getByRole('dialog')
    },
  },
  {
    name: 'user menu',
    path: '/dashboard',
    ready: (page) => page.getByText(/^Welcome,/),
    scope: '[role="menu"]',
    open: async (page) => {
      await page.getByTestId('user-menu-trigger').click()
      return page.getByRole('menu')
    },
  },
  { name: 'create task dialog', path: '/automation/tasks', ready: heading(/^Tasks$/), scope: '[role="dialog"]', open: openCreateTaskDialog },
  { name: 'task detail sheet', path: '/automation/tasks', ready: heading(/^Tasks$/), scope: '[role="dialog"]', open: openTaskSheet },
  { name: 'submit evidence sheet', path: '/evidence', ready: heading(/^Evidence Center/), scope: '[role="dialog"]', open: openSubmitEvidenceSheet },
]

test.describe.configure({ retries: 0 })

for (const colorScheme of COLOR_SCHEMES) {
  test.describe(`accessibility — overlays (${colorScheme})`, { tag: A11Y_TAG }, () => {
    test.use({ colorScheme })

    for (const { name, path, ready, scope, open } of OVERLAYS) {
      test(`${name} has no WCAG 2.2 AA violations`, async ({ page }, testInfo) => {
        test.slow()
        await page.goto(path, { waitUntil: 'domcontentloaded' })
        await waitForPageToSettle(page, ready)

        await expect(await open(page)).toBeVisible({ timeout: 20_000 }) // 20s
        await expect(page.locator('.animate-custom-pulse')).toHaveCount(0, { timeout: 30_000 }) // 30s

        await expectNoA11yViolations(page, testInfo, scope)
      })
    }
  })
}
