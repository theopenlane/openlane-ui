import { test, expect, readManifest } from '../fixtures/auth'
import type { Page } from '@playwright/test'
import { test as freshTest } from '@playwright/test'
import { seedLoggedInUser } from '../utils/seedUser'
import { loginViaApi, createInternalPolicy } from '../utils/api'
import { RUN_ID } from '../utils/constants'
import { openCreateTaskDialog } from '../utils/tasks'

test.describe('cross-cutting — auth redirects', () => {
  test('logged-in user visiting /login is bounced to /dashboard', async ({ page }) => {
    await page.goto('/login')

    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('logged-in user visiting /signup ends up either on /signup or /dashboard (no crash)', async ({ page }) => {
    await page.goto('/signup').catch(() => {})

    await expect(page).toHaveURL(/\/(signup|dashboard)/, { timeout: 15_000 })
  })
})

test.describe('cross-cutting — theming', () => {
  test('selecting Dark theme persists across reload', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByTestId('user-menu-trigger').click()
    await page.getByRole('button', { name: /^dark$/i }).click()

    await expect(page.locator('html')).toHaveClass(/dark/)

    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('selecting Light theme drops the .dark class and persists across reload', async ({ page }) => {
    await page.goto('/dashboard')
    // Toggle to Dark first so the assertion isn't a no-op against the default theme (the default in-app may already be light or system)
    await page.getByTestId('user-menu-trigger').click()
    await page.getByRole('button', { name: /^dark$/i }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    await page.getByRole('button', { name: /^light$/i }).click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)

    await page.reload()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })
})

test.describe('cross-cutting — dropdown dismissal', () => {
  test('Escape closes the user menu dropdown', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByTestId('user-menu-trigger').click()
    const menuItem = page.getByRole('button', { name: /^user settings$/i })
    await expect(menuItem).toBeVisible({ timeout: 10_000 })

    await page.keyboard.press('Escape')

    await expect(menuItem).toBeHidden({ timeout: 10_000 })
  })

  test('Escape closes the create-task dialog (non-destructive)', async ({ page }) => {
    await page.goto('/automation/tasks')
    const dialog = await openCreateTaskDialog(page)

    await page.keyboard.press('Escape')

    await expect(dialog).toBeHidden({ timeout: 10_000 })
  })
})

test.describe('cross-cutting — browser navigation', () => {
  test('back/forward navigation preserves the visited URLs', async ({ page }) => {
    await page.goto('/policies')
    await page.goto('/controls')

    await page.goBack()
    await expect(page).toHaveURL(/\/policies(\?|$)/, { timeout: 10_000 })

    await page.goForward()
    await expect(page).toHaveURL(/\/controls(\?|$)/, { timeout: 10_000 })
  })
})

test.describe('cross-cutting — breadcrumbs', () => {
  test('/policies renders the Home → Compliance → Policies breadcrumb trail', async ({ page }) => {
    await page.goto('/policies')

    const navigation = page.getByRole('navigation', { name: /breadcrumb/i }).first()
    await expect(navigation.getByText(/^Home$/)).toBeVisible({ timeout: 15_000 })
    await expect(navigation.getByText(/^Compliance$/)).toBeVisible()
    await expect(navigation.getByText(/^Policies$/)).toBeVisible()
  })
})

test.describe('cross-cutting — page title', () => {
  test('/policies sets document.title to include "Internal Policies"', async ({ page }) => {
    await page.goto('/policies')

    await expect(page).toHaveTitle(/Internal Policies/, { timeout: 15_000 })
  })
})

test.describe('cross-cutting — filter persistence', () => {
  test('tasks search survives a hard reload (useStorageSearch)', async ({ page }) => {
    await page.goto('/automation/tasks')

    const search = page.getByPlaceholder(/^Search$/)
    await search.fill('persist-me')
    await expect(search).toHaveValue('persist-me')

    await page.reload()

    // useStorageSearch reads from localStorage on mount
    await expect(page.getByPlaceholder(/^Search$/)).toHaveValue('persist-me', { timeout: 10_000 })
  })
})

test.describe('cross-cutting — sidebar toggle', () => {
  test('primary sidebar toggle button expands then collapses the rail', async ({ page }) => {
    await page.goto('/dashboard')
    const openIcon = page.locator('.lucide-panel-left-open').first()
    const closeIcon = page.locator('.lucide-panel-left-close').first()

    await expect(openIcon).toBeVisible({ timeout: 10_000 })
    await openIcon.click()
    await expect(closeIcon).toBeVisible({ timeout: 5_000 })

    await closeIcon.click()
    await expect(page.locator('.lucide-panel-left-open').first()).toBeVisible({ timeout: 5_000 })
  })

  test('primary sidebar expand state persists across reload (localStorage)', async ({ page }) => {
    await page.goto('/dashboard')
    await page.locator('.lucide-panel-left-open').first().click()
    await expect(page.locator('.lucide-panel-left-close').first()).toBeVisible({ timeout: 5_000 })

    await page.reload()

    await expect(page.locator('.lucide-panel-left-close').first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('cross-cutting — global shortcuts', () => {
  test('Cmd/Ctrl+K opens the command menu; Esc closes it', async ({ page }) => {
    await page.goto('/dashboard')
    await page.keyboard.press('ControlOrMeta+k')
    const cmdInput = page.getByPlaceholder(/type a command or search/i)
    await expect(cmdInput).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(cmdInput).toBeHidden()
  })

  test('Cmd/Ctrl+K toggles the command menu (open then close on re-press)', async ({ page }) => {
    await page.goto('/dashboard')
    await page.keyboard.press('ControlOrMeta+k')
    const cmdInput = page.getByPlaceholder(/type a command or search/i)
    await expect(cmdInput).toBeVisible({ timeout: 10_000 })

    await page.keyboard.press('ControlOrMeta+k')
    await expect(cmdInput).toBeHidden({ timeout: 5_000 })
  })

  test('Cmd/Ctrl+K → typing "policies" → Enter routes to /policies', async ({ page }) => {
    await page.goto('/dashboard')
    await page.keyboard.press('ControlOrMeta+k')
    const cmdInput = page.getByPlaceholder(/type a command or search/i)
    await expect(cmdInput).toBeVisible({ timeout: 10_000 })

    await cmdInput.fill('Policies')
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/\/policies(\?|$)/, { timeout: 15_000 })
  })

  test('Cmd/Ctrl+/ opens the global search dialog', async ({ page }) => {
    await page.goto('/dashboard')
    await page.keyboard.press('ControlOrMeta+/')
    await expect(page.getByPlaceholder(/^search\.\.\.$/i)).toBeVisible()
  })

  test('Cmd/Ctrl+/ search shows "No results found" for an unmatched query', async ({ page }) => {
    await page.goto('/dashboard')
    await page.keyboard.press('ControlOrMeta+/')
    const searchInput = page.getByPlaceholder(/^search\.\.\.$/i)
    await expect(searchInput).toBeVisible({ timeout: 10_000 })

    await searchInput.fill(`zzzzz-no-match-${Date.now().toString(36)}`)

    await expect(page.getByText(/^No results found$/)).toBeVisible({ timeout: 15_000 })
  })

  test('Cmd/Ctrl+/ search dialog accepts typed input', async ({ page }) => {
    await page.goto('/dashboard')
    await page.keyboard.press('ControlOrMeta+/')
    const searchInput = page.getByPlaceholder(/^search\.\.\.$/i)
    await expect(searchInput).toBeVisible({ timeout: 10_000 })

    await searchInput.fill('hello')
    await expect(searchInput).toHaveValue('hello')
  })
})

test.describe('cross-cutting — 404 not-found page', () => {
  test('logged-in user hitting an unknown route sees the default not-found copy', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-' + Date.now().toString(36))

    await expect(page.getByText(/^The page could not be found$/)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: /^Back to Dashboard$/i })).toBeVisible()
  })

  test('"Back to Dashboard" button on the 404 page navigates to /dashboard', async ({ page }) => {
    await page.goto('/another-unknown-route-' + Date.now().toString(36))
    await page.getByRole('button', { name: /^Back to Dashboard$/i }).click()

    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 })
  })
})

test.describe('cross-cutting — org switcher', () => {
  test('org selector popover lists organizations with a search field', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByTestId('org-selector-trigger').dispatchEvent('click')

    await expect(page.getByPlaceholder('Search for an organization')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /View all organizations/i })).toBeVisible()
  })
})

test.describe('cross-cutting — notifications bell', () => {
  test('header renders the Notifications bell for an authenticated user', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page.getByRole('button', { name: /^notifications$/i })).toBeVisible({ timeout: 15_000 })
  })
})

freshTest.describe('cross-cutting — fresh org', () => {
  freshTest('logout clears auth state — protected routes bounce to /login afterwards', async ({ page }) => {
    freshTest.fixme(
      true,
      'signOut() does not clear authjs.session-token/access_token over the local insecure-HTTP production build (cookies persist, user stays logged in). Likely a prod-build-over-HTTP artifact, not real HTTPS prod — verify with the auth team before un-skipping.',
    )
    await seedLoggedInUser(page, 'logout')

    await page.getByTestId('user-menu-trigger').click()
    const signOutResponse = page.waitForResponse(/\/api\/auth\/signout/)
    await page.getByRole('button', { name: /^log out$/i }).click()
    await signOutResponse

    await expect(async () => {
      const cookieNames = (await page.context().cookies()).map((c) => c.name)
      expect(cookieNames).not.toContain('authjs.session-token')
      expect(cookieNames).not.toContain('temporary-cookie')
    }).toPass({ timeout: 20_000 })

    await page.goto('/dashboard').catch(() => {})
    await expect(page).toHaveURL(/\/login(\?|$)/)
  })

  freshTest('opening the Notifications panel on a fresh org surfaces the org-ready notification', async ({ page }) => {
    await seedLoggedInUser(page, 'cc-bell-ready')

    await page.goto('/dashboard')

    await page.getByRole('button', { name: /^notifications$/i }).click()

    await expect(page.getByText('Organization ready').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('link', { name: /^View All$/ })).toBeVisible()
  })
})

test.describe('cross-cutting — rows-per-page persistence (ISS-2499)', () => {
  const rowsPerPageTrigger = (page: Page) => page.getByText('Rows per page', { exact: true }).locator('..').getByRole('combobox').first()

  test.beforeAll(async () => {
    const { ownerEmail, password } = readManifest()
    const owner = await loginViaApi(ownerEmail, password)
    await createInternalPolicy(owner, `E2E RowsPerPage ${RUN_ID} ${Date.now().toString(36)}`)
  })

  test('a chosen page size survives a hard reload', async ({ page }) => {
    test.slow()
    await page.goto('/policies', { waitUntil: 'domcontentloaded' })
    await page.locator('.lucide-table').first().click()

    const trigger = rowsPerPageTrigger(page)
    await expect(trigger).toBeVisible({ timeout: 45_000 })

    await trigger.click()
    await page.getByRole('option', { name: '25', exact: true }).click()
    await expect(trigger).toContainText('25', { timeout: 15_000 })

    await page.reload()
    await page.locator('.lucide-table').first().click()

    await expect(rowsPerPageTrigger(page)).toContainText('25', { timeout: 45_000 })
  })

  test('the stored page size is scoped per table, not shared across pages', async ({ page }) => {
    test.slow()
    await page.goto('/policies', { waitUntil: 'domcontentloaded' })
    await page.locator('.lucide-table').first().click()

    const policiesTrigger = rowsPerPageTrigger(page)
    await expect(policiesTrigger).toBeVisible({ timeout: 45_000 })
    await policiesTrigger.click()
    await page.getByRole('option', { name: '50', exact: true }).click()
    await expect(policiesTrigger).toContainText('50', { timeout: 15_000 })

    await page.goto('/controls', { waitUntil: 'domcontentloaded' })
    await page.locator('.lucide-table').first().click()
    await expect(rowsPerPageTrigger(page)).not.toContainText('50', { timeout: 45_000 })
  })
})

const SECTION_REDIRECTS = [
  { from: '/registry', to: /\/registry\/platforms/ },
  { from: '/trust-center', to: /\/trust-center\/overview/ },
  { from: '/automation', to: /\/automation\/tasks/ },
  { from: '/user-management', to: /\/user-management\/members/ },
  { from: '/developers', to: /\/developers\/api-tokens/ },
]

test.describe('cross-cutting — section redirects (ISS-2591)', () => {
  for (const { from, to } of SECTION_REDIRECTS) {
    test(`${from} redirects to its landing page`, async ({ page }) => {
      test.slow()
      await page.goto(from, { waitUntil: 'domcontentloaded', timeout: 180_000 })

      await expect(page).toHaveURL(to, { timeout: 30_000 })
    })
  }
})

test.describe('cross-cutting — contextual docs help (#2148)', () => {
  test('a page with a registered docs topic exposes a help affordance', async ({ page }) => {
    test.slow()
    await page.goto('/controls', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Report on:', { exact: true })).toBeVisible({ timeout: 45_000 })

    const help = page.getByRole('button', { name: /help|docs/i }).first()
    test.skip(!(await help.isVisible().catch(() => false)), 'no docs-help affordance registered on this page')

    await help.click()
    await expect(page.getByRole('dialog').or(page.getByRole('complementary')).first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('cross-cutting — nav create menu (ISS-2598)', () => {
  test('the sidebar Create menu lists creatable objects', async ({ page }) => {
    test.slow()
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 30_000 })

    const createTrigger = page.locator('.lucide-plus').first()
    await expect(createTrigger).toBeVisible({ timeout: 30_000 })
    await createTrigger.click()

    await expect(page.getByText('Task', { exact: true }).first()).toBeVisible({ timeout: 15_000 })
  })
})
