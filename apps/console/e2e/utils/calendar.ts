import { expect, type Page } from '@playwright/test'

const MONTH = new Intl.DateTimeFormat('en-US', { month: 'long' })

export const calendarDayLabel = (date: Date): RegExp => new RegExp(`${MONTH.format(date)} ${date.getDate()}(st|nd|rd|th), ${date.getFullYear()}$`)

export const pickCalendarDay = async (page: Page, date: Date): Promise<void> => {
  const day = page
    .getByRole('button', { name: calendarDayLabel(date) })
    .and(page.locator(':not([disabled])'))
    .first()
  const next = page.getByRole('button', { name: 'Go to the Next Month' })

  for (let hop = 0; hop < 13; hop += 1) {
    if (await day.isVisible().catch(() => false)) break
    await next.click()
  }

  await expect(day).toBeVisible({ timeout: 20_000 })
  await day.click()
}
