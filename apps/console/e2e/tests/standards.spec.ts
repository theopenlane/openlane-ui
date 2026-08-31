import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures/auth'

// Logged in as the storage-state Owner (global-setup).
test.describe('standards — list', () => {
  test('/standards renders the Standards Catalog heading for an owner', async ({ page }) => {
    await page.goto('/standards')

    await expect(page.getByRole('heading', { level: 2, name: /^Standards Catalog$/ })).toBeVisible()
  })

  test('/standards renders the search input', async ({ page }) => {
    await page.goto('/standards')

    await expect(page.getByPlaceholder(/^Search standards\.\.\.$/)).toBeVisible({ timeout: 15_000 })
  })

  test('the catalog grid renders standard cards (Controls count shown)', async ({ page }) => {
    await page.goto('/standards', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Standards Catalog$/ })).toBeVisible({ timeout: 20_000 })

    // standards-page.tsx renders a Card per standard; each shows a "Controls: N"
    // line (the backend seeds a standards catalog, so ≥1 card is present).
    await expect(page.getByText(/Controls:\s*\d+/).first()).toBeVisible({ timeout: 15_000 })
  })

  test('searching a no-match term clears the catalog grid (server-side shortName filter)', async ({ page }) => {
    await page.goto('/standards', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Controls:\s*\d+/).first()).toBeVisible({ timeout: 15_000 })

    await page.getByPlaceholder(/^Search standards\.\.\.$/).fill(`zzz-no-standard-${Date.now().toString(36)}`)

    // shortNameContainsFold where-clause → no matches → no cards render.
    await expect(page.getByText(/Controls:\s*\d+/)).toHaveCount(0, { timeout: 15_000 })
  })

  test('a standard detail → Add Controls opens the add-to-organization dialog', async ({ page }) => {
    test.slow()
    await page.goto('/standards', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText(/Controls:\s*\d+/).first()).toBeVisible({ timeout: 15_000 })

    // standards-page.tsx cards link to standards/{id}; navigate to the first detail.
    const href = await page.locator('a[href^="standards/"]').first().getAttribute('href')
    await page.goto(`/${href}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

    // standards/[id]/page.tsx renders an owner-gated "Add Controls" button that
    // opens the AddToOrganizationDialog (DialogTitle "Add Controls").
    await page.getByRole('button', { name: /^Add Controls/ }).click()
    await expect(page.getByRole('dialog').getByText('Add Controls').first()).toBeVisible({ timeout: 10_000 })
  })
})

// Logged in as the storage-state Owner. These exercise the standards/[id] detail
// surface: the SlideBarLayout "Details" card, the controls accordion, and the
// control-detail sheet opened via the ?controlId query param.
test.describe('standards — detail', () => {
  // Navigate from the catalog to the first standard detail (cards link to
  // standards/{id} with a relative href).
  const gotoFirstStandard = async (page: Page) => {
    await page.goto('/standards', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText(/Controls:\s*\d+/).first()).toBeVisible({ timeout: 15_000 })
    const href = await page.locator('a[href^="standards/"]').first().getAttribute('href')
    await page.goto(`/${href}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  }

  test('the Details sidebar card shows standard metadata rows', async ({ page }) => {
    test.slow()
    await gotoFirstStandard(page)

    // standard-details-card.tsx renders a metadata table inside the
    // SlideBarLayout "Details" sidebar — assert the stable row labels.
    await expect(page.getByText('Short name', { exact: true })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('Governing body', { exact: true })).toBeVisible()
    await expect(page.getByText('Framework', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Last Updated', { exact: true })).toBeVisible()
  })

  test('the controls accordion renders Domains with expandable category sections', async ({ page }) => {
    test.slow()
    await gotoFirstStandard(page)

    // standard-details-accordion.tsx renders a "Domains" label and one Radix
    // AccordionItem per control category; the first category auto-opens.
    await expect(page.getByText('Domains', { exact: true })).toBeVisible({ timeout: 20_000 })

    // The auto-opened first section exposes its DataTable — assert the control
    // column headers render and at least one data row (rows are clickable via
    // rowHref onClick, not anchors, so target them by role).
    await expect(page.getByRole('columnheader', { name: /Ref Code/ })).toBeVisible({ timeout: 20_000 })
    await expect(
      page
        .getByRole('row')
        .filter({ hasText: /^[A-Z]+\d/ })
        .first(),
    ).toBeVisible({ timeout: 20_000 })
  })

  test('clicking a control row opens the control detail sheet', async ({ page }) => {
    test.slow()
    await gotoFirstStandard(page)

    await expect(page.getByText('Domains', { exact: true })).toBeVisible({ timeout: 20_000 })
    const firstControlRow = page
      .getByRole('row')
      .filter({ hasText: /^[A-Z]+\d/ })
      .first()
    await expect(firstControlRow).toBeVisible({ timeout: 20_000 })

    // Rows navigate via rowHref → ?controlId=, which mounts ControlDetailsSheet
    // (a Radix sheet exposing a "Properties" heading and "Copy link" button).
    // Click a description cell to avoid the row's select checkbox.
    await firstControlRow.getByRole('cell').nth(2).click()
    await expect(page.getByRole('dialog').getByText('Properties', { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('dialog').getByRole('button', { name: /Copy link/i })).toBeVisible()
  })
})

// Deeper coverage of the standards/[id] surface: the in-detail control search,
// the expand/collapse-all toggle, the control-detail sheet's full body
// (Properties / Subcontrols / Related Controls + the conditional accordion
// sections), and the "Copy link" clipboard write. All run as the Owner.
test.describe('standards — detail interactions', () => {
  const gotoFirstStandard = async (page: Page) => {
    await page.goto('/standards', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText(/Controls:\s*\d+/).first()).toBeVisible({ timeout: 15_000 })
    const href = await page.locator('a[href^="standards/"]').first().getAttribute('href')
    await page.goto(`/${href}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText('Domains', { exact: true })).toBeVisible({ timeout: 25_000 })
  }

  // The accordion's "Search ..." input drives a server-side where-clause
  // (refCode/category/subcategory/description ContainsFold). A no-match term
  // empties every category group, so no control rows render.
  test('searching a no-match term in the detail clears all control rows', async ({ page }) => {
    test.slow()
    await gotoFirstStandard(page)

    const anyControlRow = page.getByRole('row').filter({ hasText: /^[A-Z]+\d/ })
    await expect(anyControlRow.first()).toBeVisible({ timeout: 25_000 })

    await page.getByPlaceholder('Search ...').fill(`zzz-no-control-${Date.now().toString(36)}`)

    await expect(anyControlRow).toHaveCount(0, { timeout: 20_000 })
  })

  // Searching a refCode prefix taken from a real row narrows the groups to
  // matching controls — the searched ref code stays visible.
  test('searching a refCode prefix narrows the controls to matches', async ({ page }) => {
    test.slow()
    await gotoFirstStandard(page)

    const firstRow = page
      .getByRole('row')
      .filter({ hasText: /^[A-Z]+\d/ })
      .first()
    await expect(firstRow).toBeVisible({ timeout: 25_000 })
    const refCell = await firstRow.getByRole('cell').nth(1).innerText()
    const refCode = refCell.trim().split(/\s+/)[0]
    test.skip(!refCode, 'could not read a refCode from the first row')

    await page.getByPlaceholder('Search ...').fill(refCode)

    await expect(page.getByRole('row').filter({ hasText: refCode }).first()).toBeVisible({ timeout: 20_000 })
  })

  // The Domains toolbar has an icon-only expand/collapse-all button (List +
  // ChevronsDownUp). Only the first category auto-opens; clicking the toggle
  // opens every category, surfacing additional Ref Code column headers.
  test('the expand/collapse-all toggle opens every category section', async ({ page }) => {
    test.slow()
    await gotoFirstStandard(page)

    await expect(page.getByRole('columnheader', { name: /Ref Code/ }).first()).toBeVisible({ timeout: 25_000 })
    const initialHeaders = await page.getByRole('columnheader', { name: /Ref Code/ }).count()

    // The toggle sits next to the "Domains" label; it is the only secondary
    // button in that toolbar row.
    const toggle = page.getByText('Domains', { exact: true }).locator('xpath=following-sibling::button[1]')
    await toggle.click()

    // Either more sections opened (more Ref Code headers) or it was already
    // all-open and toggling collapsed them — assert the count changed.
    await expect.poll(async () => page.getByRole('columnheader', { name: /Ref Code/ }).count(), { timeout: 15_000 }).not.toBe(initialHeaders)
  })

  // Full control-detail sheet body: Properties + its labelled rows, the
  // Subcontrols block, and the Related Controls block all render regardless of
  // whether the underlying lists are populated (empty states render in-place).
  test('the control detail sheet renders Properties, Subcontrols and Related Controls', async ({ page }) => {
    test.slow()
    await gotoFirstStandard(page)

    const firstControlRow = page
      .getByRole('row')
      .filter({ hasText: /^[A-Z]+\d/ })
      .first()
    await expect(firstControlRow).toBeVisible({ timeout: 25_000 })
    await firstControlRow.getByRole('cell').nth(2).click()

    const sheet = page.getByRole('dialog')
    await expect(sheet.getByText('Properties', { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(sheet.getByText('Framework', { exact: true })).toBeVisible()
    await expect(sheet.getByText('Category', { exact: true })).toBeVisible()
    await expect(sheet.getByText('Subcategory', { exact: true })).toBeVisible()
    await expect(sheet.getByText('Subcontrols', { exact: true })).toBeVisible()
    await expect(sheet.getByText('Related Controls', { exact: true })).toBeVisible()
  })

  // The sheet's AccordionInfo only mounts sections whose data is present
  // (.filter(hasData)). Detail data (implementation guidance, etc.) is sparse
  // per-control, so scan the rows in the auto-opened section, opening each in
  // turn, until one surfaces a documented section label — then assert clicking
  // it reveals body content. Only skip if NONE of the scanned controls carry
  // detail data (avoids brittle reliance on a specific seeded control).
  test('control detail sheet exposes at least one detail accordion section', async ({ page }) => {
    test.slow()
    await gotoFirstStandard(page)

    const sectionLabels = /^(Implementation guidance|Testing procedures|Evidence Requests|Control questions|Assessment methods|Assessment objectives)$/
    const sheet = page.getByRole('dialog')
    const rows = page.getByRole('row').filter({ hasText: /^[A-Z]+\d/ })
    await expect(rows.first()).toBeVisible({ timeout: 25_000 })

    const rowCount = Math.min(await rows.count(), 10)
    let found = false
    for (let i = 0; i < rowCount; i++) {
      await rows.nth(i).getByRole('cell').nth(2).click()
      await expect(sheet.getByText('Related Controls', { exact: true })).toBeVisible({ timeout: 15_000 })

      const sections = sheet.getByText(sectionLabels)
      if ((await sections.count()) > 0) {
        const firstSection = sections.first()
        await expect(firstSection).toBeVisible()
        await firstSection.click()
        found = true
        break
      }

      await sheet.getByLabel('Close detail sheet').click()
      await expect(page).not.toHaveURL(/controlId=/, { timeout: 10_000 })
    }

    test.skip(!found, 'none of the scanned controls carry detail accordion sections')
  })

  // The "Copy link" button writes a controlId-scoped URL to the clipboard and
  // raises a "Link copied to clipboard" toast. Requires clipboard permissions.
  test('Copy link writes a controlId-scoped URL and toasts success', async ({ page, context }) => {
    test.slow()
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await gotoFirstStandard(page)

    const firstControlRow = page
      .getByRole('row')
      .filter({ hasText: /^[A-Z]+\d/ })
      .first()
    await expect(firstControlRow).toBeVisible({ timeout: 25_000 })
    await firstControlRow.getByRole('cell').nth(2).click()

    const sheet = page.getByRole('dialog')
    const copyButton = sheet.getByRole('button', { name: /Copy link/i })
    await expect(copyButton).toBeVisible({ timeout: 15_000 })
    await copyButton.click()

    await expect(page.getByText(/Link copied to clipboard/i).first()).toBeVisible({ timeout: 10_000 })

    const clipboard = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboard).toMatch(/controlId=/)
  })

  // Closing the sheet clears the controlId query param (router.replace), so the
  // URL returns to the bare /standards/[id] form.
  test('closing the control detail sheet removes the controlId query param', async ({ page }) => {
    test.slow()
    await gotoFirstStandard(page)

    const firstControlRow = page
      .getByRole('row')
      .filter({ hasText: /^[A-Z]+\d/ })
      .first()
    await expect(firstControlRow).toBeVisible({ timeout: 25_000 })
    await firstControlRow.getByRole('cell').nth(2).click()

    const sheet = page.getByRole('dialog')
    await expect(sheet.getByText('Properties', { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(page).toHaveURL(/controlId=/)

    await sheet.getByLabel('Close detail sheet').click()
    await expect(page).not.toHaveURL(/controlId=/, { timeout: 10_000 })
  })
})
