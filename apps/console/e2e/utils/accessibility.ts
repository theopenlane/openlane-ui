import AxeBuilder from '@axe-core/playwright'
import { expect, type Locator, type Page, type TestInfo } from '@playwright/test'

export const A11Y_TAG = '@a11y'

const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

export const COLOR_SCHEMES = ['light', 'dark'] as const

type AxeResults = Awaited<ReturnType<AxeBuilder['analyze']>>

type AxeViolation = AxeResults['violations'][number]

export type ReadyLocator = (page: Page) => Locator

export type ScannedRoute = { path: string; ready?: ReadyLocator }

const MAX_TARGETS_PER_RULE = 5

const describeViolation = (violation: AxeViolation): string => {
  const targets = violation.nodes.slice(0, MAX_TARGETS_PER_RULE).map((node) => node.target.join(' '))
  const more = violation.nodes.length > MAX_TARGETS_PER_RULE ? ` (+${violation.nodes.length - MAX_TARGETS_PER_RULE} more)` : ''
  return `[${violation.impact ?? 'unknown'}] ${violation.id}: ${violation.help} — ${violation.nodes.length} node(s): ${targets.join(', ')}${more}`
}

export const heading =
  (name: RegExp): ReadyLocator =>
  (page) =>
    page.getByRole('heading', { name }).first()

const firstHeading: ReadyLocator = (page) => page.getByRole('heading').first()

export const waitForPageToSettle = async (page: Page, ready: ReadyLocator = firstHeading): Promise<void> => {
  await expect(ready(page)).toBeVisible({ timeout: 60_000 }) // 1min
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.animate-custom-pulse')).toHaveCount(0, { timeout: 30_000 }) // 30s
}

export const expectNoA11yViolations = async (page: Page, testInfo: TestInfo, include?: string): Promise<void> => {
  const builder = new AxeBuilder({ page }).withTags(WCAG_AA_TAGS).setLegacyMode()
  const { violations } = await (include ? builder.include(include) : builder).analyze()

  if (violations.length > 0) {
    await testInfo.attach('axe-violations.json', { body: JSON.stringify(violations, null, 2), contentType: 'application/json' })
  }

  expect(violations.map(describeViolation), `axe found WCAG 2.2 AA violations on ${page.url()}`).toEqual([])
}
