import { expect, type Locator, type Page } from '@playwright/test'

import { expectMutationOk } from './mutations'

const SEARCH_PLACEHOLDER = 'Search users, groups, personnel, or type a name/email...'

const escapeForRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const responsibilityValue = (scope: Locator, label: string): Locator =>
  scope
    .locator('label')
    .filter({ hasText: new RegExp(`^${escapeForRegExp(label)}$`) })
    .first()
    .locator('xpath=../following-sibling::*[1]')

const openResponsibilityPicker = async (page: Page, scope: Locator, label: string): Promise<Locator> => {
  await responsibilityValue(scope, label).click()

  const search = page.getByPlaceholder(SEARCH_PLACEHOLDER)
  await expect(search).toBeVisible({ timeout: 15_000 })
  return search
}

export const setResponsibilityOption = async (page: Page, scope: Locator, label: string, search: string, optionName: string | RegExp, operationName: string): Promise<void> => {
  const input = await openResponsibilityPicker(page, scope, label)
  await input.fill(search)

  const option = page.getByRole('option').filter({ hasText: optionName }).first()
  await expect(option).toBeVisible({ timeout: 30_000 })

  await expectMutationOk(page, operationName, async () => {
    await option.click()
  })
}

export const setResponsibilityEmail = async (page: Page, scope: Locator, label: string, email: string, operationName: string): Promise<void> => {
  const input = await openResponsibilityPicker(page, scope, label)
  await input.fill(email)

  const option = page
    .getByRole('option')
    .filter({ hasText: `Use "${email}" as custom email` })
    .first()
  await expect(option).toBeVisible({ timeout: 30_000 })

  await expectMutationOk(page, operationName, async () => {
    await option.click()
  })
}
