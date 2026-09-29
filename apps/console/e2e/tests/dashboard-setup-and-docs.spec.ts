import type { Locator, Page } from '@playwright/test'
import { test as freshTest } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { gql, loginViaApi, type ApiSession } from '../utils/api'
import { PASSWORD } from '../utils/constants'
import { loginViaForm } from '../utils/login'
import { seedLoggedInUser } from '../utils/seedUser'

interface OnboardingTask {
  id: string
  title: string
  status: string
}

const TERMINAL = new Set(['COMPLETED', 'WONT_DO'])

const readOnboardingTasks = async (api: ApiSession): Promise<OnboardingTask[]> => {
  const res = await gql<{ tasks: { edges: Array<{ node: OnboardingTask }> } }>(api, `query($where: TaskWhereInput){ tasks(where: $where, first: 100){ edges { node { id title status } } } }`, {
    where: { isSuggested: true, source: 'openlane_onboarding' },
  })
  return (res.data?.tasks?.edges ?? []).map((edge) => edge.node)
}

const readTaskStatus = async (api: ApiSession, id: string): Promise<string | undefined> => (await readOnboardingTasks(api)).find((task) => task.id === id)?.status

const signIn = async (page: Page, email: string): Promise<void> => {
  await loginViaForm(page, email, PASSWORD)
  await page.waitForURL(/\/dashboard/, { timeout: 60_000 })
}

const openChecklist = async (page: Page): Promise<Locator> => {
  const main = page.getByRole('main')
  await expect(async () => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(main.getByText('Finish Setup', { exact: true })).toBeVisible({ timeout: 10_000 })
  }).toPass({ timeout: 120_000 })
  return main
}

const cardOrder = (page: Page, titles: string[]): Promise<string[]> =>
  page.evaluate(
    (known) =>
      Array.from(document.querySelectorAll('main [role="button"][aria-label]'))
        .map((el) => el.getAttribute('aria-label') ?? '')
        .filter((label) => known.includes(label)),
    titles,
  )

freshTest.describe('dashboard — setup checklist mark complete (ISS-3059)', () => {
  freshTest.describe.configure({ mode: 'serial' })

  let email = ''
  let api: ApiSession
  let tasks: OnboardingTask[] = []

  freshTest.beforeAll(async ({ browser }) => {
    freshTest.setTimeout(300_000)
    const page = await browser.newPage()
    try {
      ;({ email } = await seedLoggedInUser(page, 'dash-mark-complete', { viaWizard: true }))
    } finally {
      await page.close()
    }
    api = await loginViaApi(email)
    await expect(async () => {
      tasks = await readOnboardingTasks(api)
      expect(tasks.filter((task) => !TERMINAL.has(task.status)).length).toBeGreaterThanOrEqual(3)
    }).toPass({ timeout: 120_000 })
  })

  freshTest('clicking the marker completes the item in place, without opening it or reordering the list', async ({ page }) => {
    freshTest.slow()
    await signIn(page, email)
    const main = await openChecklist(page)

    const titles = tasks.map((task) => task.title)
    const target = tasks.find((task) => task.status === 'OPEN')
    expect(target, 'the fresh org has a not-started onboarding task').toBeTruthy()
    if (!target) return

    const card = main.getByRole('button', { name: target.title, exact: true })
    await expect(card).toBeVisible({ timeout: 15_000 })
    await expect(card.getByText('Start', { exact: true })).toBeVisible()

    const before = tasks.filter((task) => TERMINAL.has(task.status)).length
    await expect(main.getByText(`${before} of ${tasks.length} completed`, { exact: true })).toBeVisible()
    const orderBefore = await cardOrder(page, titles)

    await card.getByRole('button', { name: 'Mark complete' }).click()

    await expect(card.getByText('Done', { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(card.getByRole('button', { name: 'Mark complete' })).toHaveCount(0)
    await expect(main.getByText(`${before + 1} of ${tasks.length} completed`, { exact: true })).toBeVisible()
    await expect(page).toHaveURL(/\/dashboard$/)
    expect(await cardOrder(page, titles)).toEqual(orderBefore)

    await expect.poll(() => readTaskStatus(api, target.id), { timeout: 15_000 }).toBe('COMPLETED')
    target.status = 'COMPLETED'
  })

  freshTest('the marker is keyboard-operable and Enter on it does not open the item', async ({ page }) => {
    freshTest.slow()
    await signIn(page, email)
    const main = await openChecklist(page)

    const target = tasks.find((task) => task.status === 'OPEN')
    expect(target, 'a second not-started onboarding task remains').toBeTruthy()
    if (!target) return

    const card = main.getByRole('button', { name: target.title, exact: true })
    const marker = card.getByRole('button', { name: 'Mark complete' })
    await marker.focus()
    await page.keyboard.press('Enter')

    await expect(card.getByText('Done', { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect.poll(() => readTaskStatus(api, target.id), { timeout: 15_000 }).toBe('COMPLETED')
    target.status = 'COMPLETED'
  })

  freshTest('clicking the card body instead starts the item and follows its link', async ({ page }) => {
    freshTest.slow()
    await signIn(page, email)
    const main = await openChecklist(page)

    const target = tasks.find((task) => task.status === 'OPEN')
    expect(target, 'a third not-started onboarding task remains').toBeTruthy()
    if (!target) return

    await main.getByRole('button', { name: target.title, exact: true }).getByText(target.title, { exact: true }).click()

    await expect(page).not.toHaveURL(/\/dashboard$/, { timeout: 30_000 })
    await expect.poll(() => readTaskStatus(api, target.id), { timeout: 15_000 }).toBe('IN_PROGRESS')
  })
})

const DOCS_HELP_BUILD = process.env.E2E_DOCS_HELP === '1'

const mainScroller = (page: Page): Locator => page.locator('main[data-scroll-container="main"]')

const scrollerMetrics = (page: Page): Promise<{ clientWidth: number; scrollWidth: number; width: number }> =>
  mainScroller(page).evaluate((el) => ({ clientWidth: el.clientWidth, scrollWidth: el.scrollWidth, width: el.getBoundingClientRect().width }))

const pinnedWidthVar = (page: Page): Promise<string> => page.evaluate(() => document.documentElement.style.getPropertyValue('--pinned-panel-width'))

const openDocsPanel = async (page: Page): Promise<Locator> => {
  await page.getByRole('button', { name: /^Open docs help for / }).click()
  const panel = page.getByRole('dialog').filter({ has: page.getByRole('button', { name: /^(Keep panel open while you navigate|Unpin panel)$/ }) })
  await expect(panel).toBeVisible({ timeout: 15_000 })
  return panel
}

test.describe('docs help — pinned panel overlays the app (ISS-3044)', () => {
  test.skip(
    !DOCS_HELP_BUILD,
    'the docs panel only renders in a build with NEXT_PUBLIC_AI_SUGGESTIONS_ENABLED=true and NEXT_PUBLIC_DOCS_HELP_ENABLED=true — run with E2E_DOCS_HELP=1 against such a build',
  )

  test('pinning keeps the main column at full width and adds a scroll gutter that reaches content under the panel', async ({ page }) => {
    test.slow()
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('main').getByText(/^Welcome,/)).toBeVisible({ timeout: 30_000 })

    const unpinned = await scrollerMetrics(page)
    expect(unpinned.scrollWidth - unpinned.clientWidth).toBeLessThanOrEqual(1)

    const panel = await openDocsPanel(page)
    await panel.getByRole('button', { name: 'Keep panel open while you navigate' }).click()
    await expect(panel.getByRole('button', { name: 'Unpin panel' })).toBeVisible()

    const panelBox = await panel.boundingBox()
    expect(panelBox).not.toBeNull()
    if (!panelBox) return
    await expect.poll(() => pinnedWidthVar(page)).not.toBe('')

    const pinned = await scrollerMetrics(page)
    expect(Math.abs(pinned.width - unpinned.width)).toBeLessThanOrEqual(1)
    expect(Math.abs(pinned.clientWidth - unpinned.clientWidth)).toBeLessThanOrEqual(1)
    expect(pinned.scrollWidth - pinned.clientWidth).toBeGreaterThanOrEqual(panelBox.width - 2)

    const contentRight = await mainScroller(page).evaluate((el) => {
      el.scrollLeft = el.scrollWidth
      const first = el.firstElementChild
      return first ? first.getBoundingClientRect().right : Number.POSITIVE_INFINITY
    })
    expect(contentRight).toBeLessThanOrEqual(panelBox.x + 2)
  })

  test('a pinned panel survives an outside click, Escape, client navigation and a reload', async ({ page }) => {
    test.slow()
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('main').getByText(/^Welcome,/)).toBeVisible({ timeout: 30_000 })

    const panel = await openDocsPanel(page)
    await panel.getByRole('button', { name: 'Keep panel open while you navigate' }).click()
    const unpin = page.getByRole('button', { name: 'Unpin panel' })
    await expect(unpin).toBeVisible()

    const mainBox = await page.getByRole('main').boundingBox()
    expect(mainBox).not.toBeNull()
    if (!mainBox) return
    await page.mouse.click(mainBox.x + 8, mainBox.y + mainBox.height / 2)
    await expect(unpin).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(unpin).toBeVisible()

    await page.getByRole('main').getByRole('button', { name: 'View my tasks' }).click()
    await expect(page).toHaveURL(/\/automation\/tasks/, { timeout: 30_000 })
    await expect(unpin).toBeVisible()

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(unpin).toBeVisible({ timeout: 30_000 })
  })

  test('unpinning removes the scroll gutter and lets Escape close the panel again', async ({ page }) => {
    test.slow()
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('main').getByText(/^Welcome,/)).toBeVisible({ timeout: 30_000 })

    const panel = await openDocsPanel(page)
    await panel.getByRole('button', { name: 'Keep panel open while you navigate' }).click()
    await expect.poll(() => pinnedWidthVar(page)).not.toBe('')

    await panel.getByRole('button', { name: 'Unpin panel' }).click()
    await expect(panel.getByRole('button', { name: 'Keep panel open while you navigate' })).toBeVisible()
    await expect.poll(() => pinnedWidthVar(page)).toBe('')

    const metrics = await scrollerMetrics(page)
    expect(metrics.scrollWidth - metrics.clientWidth).toBeLessThanOrEqual(1)

    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden({ timeout: 10_000 })

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: /^Open docs help for / })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('button', { name: 'Unpin panel' })).toHaveCount(0)
  })
})
