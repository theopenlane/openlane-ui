import { expect, test } from '@playwright/test'

import { seedLoggedInUser } from '../utils/seedUser'

// Each test creates its own user + org so they're parallel-safe. This
// adds ~10s of setup per test; if the suite grows, migrate to storage
// state per AUTH_STRATEGY.md.

test.describe('cross-cutting — auth redirects', () => {
  test('logged-in user visiting /login is bounced to /dashboard', async ({ page }) => {
    await seedLoggedInUser(page, 'login-bounce')

    await page.goto('/login')

    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('logged-in user visiting /signup ends up either on /signup or /dashboard (no crash)', async ({ page }) => {
    await seedLoggedInUser(page, 'signup-when-logged-in')

    await page.goto('/signup').catch(() => {})

    // Either the middleware bounces to /dashboard or the page renders
    // even for authenticated users. Both are acceptable outcomes per
    // current product behavior — assert one of them and stay green.
    await expect(page).toHaveURL(/\/(signup|dashboard)/, { timeout: 15_000 })
  })

  test('logout clears auth state — protected routes bounce to /login afterwards', async ({ page }) => {
    await seedLoggedInUser(page, 'logout')

    // Open the user menu and click Log out. signOut() triggers a
    // /api/auth/signout round-trip; wait for it to finish so the
    // session cookie is cleared before we assert on the redirect.
    await page.getByTestId('user-menu-trigger').click()
    const signOutResponse = page.waitForResponse(/\/api\/auth\/signout/)
    await page.getByRole('button', { name: /^log out$/i }).click()
    await signOutResponse

    // Hitting a protected route now must land us on /login. The middleware
    // redirect cancels the /dashboard navigation mid-flight, which
    // surfaces as "navigation interrupted" — swallow it and let the URL
    // assertion poll for the post-redirect state.
    await page.goto('/dashboard').catch(() => {})
    await expect(page).toHaveURL(/\/login(\?|$)/)
  })
})

test.describe('cross-cutting — theming', () => {
  test('selecting Dark theme persists across reload', async ({ page }) => {
    await seedLoggedInUser(page, 'theme')

    // Open user menu and pick Dark. The theme buttons are icon-only
    // <button>s with title attributes — no role text — so we target
    // them by accessible name (title surfaces as aria/title).
    await page.getByTestId('user-menu-trigger').click()
    await page.getByRole('button', { name: /^dark$/i }).click()

    // next-themes flips the html element's class. Wait for it.
    await expect(page.locator('html')).toHaveClass(/dark/)

    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('selecting Light theme drops the .dark class and persists across reload', async ({ page }) => {
    await seedLoggedInUser(page, 'theme-light')

    // Toggle to Dark first so the assertion isn't a no-op against the
    // default theme (the default in-app may already be light or system).
    // The user-menu DropdownMenu does not auto-close on theme clicks, so
    // we keep it open and switch from Dark → Light without reopening.
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
    await seedLoggedInUser(page, 'um-esc')

    await page.getByTestId('user-menu-trigger').click()
    // The user menu dropdown surfaces "User Settings" once open. Use it
    // as the visibility marker (it's a Button inside DropdownMenuContent).
    const menuItem = page.getByRole('button', { name: /^user settings$/i })
    await expect(menuItem).toBeVisible({ timeout: 10_000 })

    await page.keyboard.press('Escape')

    // Radix DropdownMenu unmounts the content on close.
    await expect(menuItem).toBeHidden({ timeout: 10_000 })
  })

  test('Escape closes the create-task dialog (non-destructive)', async ({ page }) => {
    await seedLoggedInUser(page, 'task-esc')

    await page.goto('/automation/tasks')
    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    await page.keyboard.press('Escape')

    await expect(dialog).toBeHidden({ timeout: 10_000 })
  })
})

test.describe('cross-cutting — browser navigation', () => {
  test('back/forward navigation preserves the visited URLs', async ({ page }) => {
    await seedLoggedInUser(page, 'back-nav')

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
    await seedLoggedInUser(page, 'breadcrumbs')

    await page.goto('/policies')

    // BreadcrumbNavigation renders BreadcrumbLink href="..." with label
    // text from the page-level setCrumbs call.
    const navigation = page.getByRole('navigation', { name: /breadcrumb/i }).first()
    await expect(navigation.getByText(/^Home$/)).toBeVisible({ timeout: 15_000 })
    await expect(navigation.getByText(/^Compliance$/)).toBeVisible()
    await expect(navigation.getByText(/^Policies$/)).toBeVisible()
  })
})

test.describe('cross-cutting — page title', () => {
  test('/policies sets document.title to include "Internal Policies"', async ({ page }) => {
    await seedLoggedInUser(page, 'page-title-policies')

    await page.goto('/policies')

    // The page's metadata.title is "Internal Policies". The root layout
    // may add a title-template prefix; assert the segment we own.
    await expect(page).toHaveTitle(/Internal Policies/, { timeout: 15_000 })
  })
})

test.describe('cross-cutting — filter persistence', () => {
  test('tasks search survives a hard reload (useStorageSearch)', async ({ page }) => {
    await seedLoggedInUser(page, 'filter-persist')

    await page.goto('/automation/tasks')

    const search = page.getByPlaceholder(/^Search$/)
    await search.fill('persist-me')
    await expect(search).toHaveValue('persist-me')

    await page.reload()

    // useStorageSearch reads from localStorage on mount, so the input
    // should re-hydrate with "persist-me" after the reload.
    await expect(page.getByPlaceholder(/^Search$/)).toHaveValue('persist-me', { timeout: 10_000 })
  })
})

test.describe('cross-cutting — sidebar toggle', () => {
  test('primary sidebar toggle button expands then collapses the rail', async ({ page }) => {
    await seedLoggedInUser(page, 'sidebar-toggle')

    // Default is collapsed (per dashboard.tsx useState init), so the
    // toggle currently shows the PanelLeftOpen Lucide icon. Click to
    // expand → icon flips to PanelLeftClose.
    const openIcon = page.locator('.lucide-panel-left-open').first()
    const closeIcon = page.locator('.lucide-panel-left-close').first()

    await expect(openIcon).toBeVisible({ timeout: 10_000 })
    await openIcon.click()
    await expect(closeIcon).toBeVisible({ timeout: 5_000 })

    // Collapse again — close-icon flips back to open-icon.
    await closeIcon.click()
    await expect(page.locator('.lucide-panel-left-open').first()).toBeVisible({ timeout: 5_000 })
  })

  test('primary sidebar expand state persists across reload (localStorage)', async ({ page }) => {
    await seedLoggedInUser(page, 'sidebar-persist')

    // Default is collapsed — expand the rail and reload.
    await page.locator('.lucide-panel-left-open').first().click()
    await expect(page.locator('.lucide-panel-left-close').first()).toBeVisible({ timeout: 5_000 })

    await page.reload()

    // After reload, the toggle should still display the close icon
    // (i.e. expanded state read from localStorage).
    await expect(page.locator('.lucide-panel-left-close').first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('cross-cutting — global shortcuts', () => {
  test('Cmd/Ctrl+K opens the command menu; Esc closes it', async ({ page }) => {
    await seedLoggedInUser(page, 'cmdk')

    await page.keyboard.press('ControlOrMeta+k')
    const cmdInput = page.getByPlaceholder(/type a command or search/i)
    await expect(cmdInput).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(cmdInput).toBeHidden()
  })

  test('Cmd/Ctrl+K toggles the command menu (open then close on re-press)', async ({ page }) => {
    await seedLoggedInUser(page, 'cmdk-toggle')

    await page.keyboard.press('ControlOrMeta+k')
    const cmdInput = page.getByPlaceholder(/type a command or search/i)
    await expect(cmdInput).toBeVisible({ timeout: 10_000 })

    await page.keyboard.press('ControlOrMeta+k')
    await expect(cmdInput).toBeHidden({ timeout: 5_000 })
  })

  test('Cmd/Ctrl+K → typing "policies" → Enter routes to /policies', async ({ page }) => {
    await seedLoggedInUser(page, 'cmdk-policies')

    await page.keyboard.press('ControlOrMeta+k')
    const cmdInput = page.getByPlaceholder(/type a command or search/i)
    await expect(cmdInput).toBeVisible({ timeout: 10_000 })

    // cmdk filters CommandItems as you type. The Compliance group's
    // children include Policies; once filtered, Enter selects the first
    // visible match → router.push(child.href) → /policies.
    await cmdInput.fill('Policies')
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/\/policies(\?|$)/, { timeout: 15_000 })
  })

  test('Cmd/Ctrl+/ opens the global search dialog', async ({ page }) => {
    await seedLoggedInUser(page, 'cmdslash')

    await page.keyboard.press('ControlOrMeta+/')
    // The search dialog has its own input with a different placeholder
    // ("Search...") to disambiguate from the command menu above.
    await expect(page.getByPlaceholder(/^search\.\.\.$/i)).toBeVisible()
  })

  test('Cmd/Ctrl+/ search shows "No results found" for an unmatched query', async ({ page }) => {
    await seedLoggedInUser(page, 'cmdslash-empty')

    await page.keyboard.press('ControlOrMeta+/')
    const searchInput = page.getByPlaceholder(/^search\.\.\.$/i)
    await expect(searchInput).toBeVisible({ timeout: 10_000 })

    // Type a string that's guaranteed to have no matches in a fresh
    // org (RFC 2606 .invalid + run id).
    await searchInput.fill(`zzzzz-no-match-${Date.now().toString(36)}`)

    // CommandEmpty renders "No results found" once the backend returns
    // empty result set across every entity group.
    await expect(page.getByText(/^No results found$/)).toBeVisible({ timeout: 15_000 })
  })

  test('Cmd/Ctrl+/ search dialog accepts typed input', async ({ page }) => {
    await seedLoggedInUser(page, 'cmdslash-input')

    await page.keyboard.press('ControlOrMeta+/')
    const searchInput = page.getByPlaceholder(/^search\.\.\.$/i)
    await expect(searchInput).toBeVisible({ timeout: 10_000 })

    await searchInput.fill('hello')
    await expect(searchInput).toHaveValue('hello')
  })
})
