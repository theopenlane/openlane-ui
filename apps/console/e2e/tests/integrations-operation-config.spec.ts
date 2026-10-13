import type { Locator, Page, Request } from '@playwright/test'

import { test, expect } from '../fixtures/auth'

const CREDENTIALED_DEFINITION_ID = 'def_E2EOPCONFIG00000000000001'
const CREDENTIAL_FREE_DEFINITION_ID = 'def_E2EOPCONFIG00000000000002'
const INSTALLATION_ID = 'e2e-operation-config-installation'
const CREDENTIAL_REF = 'E2EApiKey'

const operationSettings = (defaults: { disable?: boolean; filterExpr?: string } = {}) => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    disable: { type: 'boolean', title: 'Disable', description: 'Disable this operation for the installation', ...(defaults.disable !== undefined ? { default: defaults.disable } : {}) },
    filterExpr: {
      type: 'string',
      title: 'Filter Expression',
      description: 'Optional CEL expression applied to records before ingesting',
      ...(defaults.filterExpr !== undefined ? { default: defaults.filterExpr } : {}),
    },
  },
})

const operations = [
  { name: 'AssetSync', description: 'Sync assets from the provider', disabledForAll: false, stored: true, input: { name: 'AssetSync', schema: operationSettings() } },
  { name: 'FindingSync', description: 'Sync findings from the provider', disabledForAll: false, stored: true, input: { name: 'FindingSync', schema: operationSettings() } },
  { name: 'CheckSync', description: 'Coming soon', disabledForAll: true, stored: true, input: { name: 'CheckSync', schema: operationSettings() } },
  { name: 'HealthDefault', description: 'Health check', disabledForAll: false, stored: false, input: { name: 'HealthDefault', schema: { type: 'object', properties: {} } } },
]

const definition = (id: string, displayName: string, credentialSchema: Record<string, unknown>) => ({
  spec: { id, family: displayName, displayName, description: `${displayName} e2e fixture`, category: 'testing', tags: [], active: true, visible: true, docsUrl: 'https://docs.theopenlane.io' },
  credentialRegistrations: [{ ref: CREDENTIAL_REF, name: `${displayName} API key`, description: 'Fixture credential', schema: credentialSchema }],
  connections: [{ credentialRef: CREDENTIAL_REF, name: `${displayName} API key`, description: 'Fixture connection', credentialRefs: [CREDENTIAL_REF] }],
  operations,
})

const CREDENTIALED_DEFINITION = definition(CREDENTIALED_DEFINITION_ID, 'E2E Operation Config', {
  type: 'object',
  required: ['apiKey'],
  properties: { apiKey: { type: 'string', title: 'API Key', description: 'Fixture API key' } },
})

const CREDENTIAL_FREE_DEFINITION = definition(CREDENTIAL_FREE_DEFINITION_ID, 'E2E Operation Config Keyless', { type: 'object', properties: {} })

const installationNode = () => ({
  id: INSTALLATION_ID,
  name: 'E2E Operation Config',
  kind: null,
  integrationType: null,
  definitionID: CREDENTIALED_DEFINITION_ID,
  definitionSlug: null,
  family: 'E2E Operation Config',
  status: 'CONNECTED',
  tags: [],
  description: null,
  metadata: { credentialRef: CREDENTIAL_REF },
  health: null,
  primaryDirectory: false,
  createdAt: new Date().toISOString(),
  createdBy: null,
  environmentName: null,
  scopeName: null,
  credentials: null,
  config: null,
  operationConfig: {
    AssetSync: operationSettings({ disable: true }),
    FindingSync: operationSettings({ disable: false, filterExpr: 'severity == "HIGH"' }),
  },
})

const stubProviders = async (page: Page): Promise<void> => {
  await page.route('**/api/integrations/providers', async (route) => {
    const response = await route.fetch()
    const json = await response.json()
    json.providers = [...(json.providers ?? []), CREDENTIALED_DEFINITION, CREDENTIAL_FREE_DEFINITION]
    await route.fulfill({ response, json })
  })
}

const stubInstallation = async (page: Page): Promise<void> => {
  await page.route('**/query', async (route) => {
    const body = route.request().postData() ?? ''
    if (route.request().method() !== 'POST' || !body.includes('query GetIntegrations')) {
      await route.fallback()
      return
    }
    const response = await route.fetch()
    const json = await response.json()
    json.data = { integrations: { edges: [{ node: installationNode() }] } }
    await route.fulfill({ response, json })
  })
}

const stubConfigure = async (page: Page): Promise<void> => {
  await page.route('**/api/integrations/config', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: { success: true, provider: CREDENTIALED_DEFINITION_ID, integrationId: INSTALLATION_ID, healthStatus: 'ok', healthSummary: 'Validation passed during configuration' },
    }),
  )
}

const configureRequest = (page: Page): Promise<Request> =>
  page.waitForRequest((request) => request.method() === 'POST' && new URL(request.url()).pathname === '/api/integrations/config', { timeout: 20_000 })

const openDefinition = async (page: Page, definitionId: string): Promise<void> => {
  await page.goto(`/automation/integrations/${definitionId}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('heading', { level: 3, name: /^Connect$/ })).toBeVisible({ timeout: 30_000 })
}

const operationSwitch = (scope: Page | Locator, operation: string, field: string) => scope.locator(`#integration-config-operationConfig__${operation}__${field}`)
const operationInput = (scope: Page | Locator, operation: string, field: string) => scope.locator(`input[name="operationConfig__${operation}__${field}"]`)

test.describe('automation — integration operation configuration', () => {
  test('the connect form renders one section per configurable operation and hides the rest', async ({ page }) => {
    test.slow()
    await stubProviders(page)
    await openDefinition(page, CREDENTIALED_DEFINITION_ID)

    await expect(page.getByRole('heading', { level: 4, name: /^CONFIGURATION$/ })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('heading', { level: 5, name: /^Asset Sync$/i })).toBeVisible()
    await expect(page.getByRole('heading', { level: 5, name: /^Finding Sync$/i })).toBeVisible()
    await expect(page.getByRole('heading', { level: 5, name: /^(Check Sync|Health Default)$/i })).toHaveCount(0)
    await expect(operationSwitch(page, 'CheckSync', 'disable')).toHaveCount(0)
    await expect(operationInput(page, 'AssetSync', 'filterExpr')).toBeEditable()
  })

  test('connecting sends each operation document under its name alongside the credentials', async ({ page }) => {
    test.slow()
    await stubProviders(page)
    await stubConfigure(page)
    await openDefinition(page, CREDENTIALED_DEFINITION_ID)

    await page.getByRole('textbox', { name: /API Key/ }).fill('e2e-api-key')
    await operationSwitch(page, 'AssetSync', 'disable').click()
    await operationInput(page, 'FindingSync', 'filterExpr').fill('severity == "CRITICAL"')

    const request = configureRequest(page)
    await page.getByRole('button', { name: /^Save & Connect$/ }).click()

    expect((await request).postDataJSON()).toEqual({
      definitionId: CREDENTIALED_DEFINITION_ID,
      credentialRef: CREDENTIAL_REF,
      body: { apiKey: 'e2e-api-key' },
      operationConfig: {
        AssetSync: { disable: true },
        FindingSync: { disable: false, filterExpr: 'severity == "CRITICAL"' },
      },
    })
  })

  test('a connection with no credential fields still saves its operation settings', async ({ page }) => {
    test.slow()
    await stubProviders(page)
    await stubConfigure(page)
    await openDefinition(page, CREDENTIAL_FREE_DEFINITION_ID)

    await expect(page.getByText('No credential fields required')).toBeVisible({ timeout: 20_000 })
    await operationInput(page, 'AssetSync', 'filterExpr').fill('payload.os == "linux"')

    const request = configureRequest(page)
    await page.getByRole('button', { name: /^Save & Connect$/ }).click()

    expect((await request).postDataJSON()).toMatchObject({
      definitionId: CREDENTIAL_FREE_DEFINITION_ID,
      operationConfig: { AssetSync: { disable: false, filterExpr: 'payload.os == "linux"' }, FindingSync: { disable: false } },
    })
    await expect(page.getByText('No configuration provided')).toHaveCount(0)
  })

  test('the settings tab of an installation loads the stored operation values and saves only operation settings', async ({ page }) => {
    test.slow()
    await stubProviders(page)
    await stubInstallation(page)
    await stubConfigure(page)
    await page.goto(`/automation/integrations/${CREDENTIALED_DEFINITION_ID}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await page.getByRole('button', { name: /^Configure$/ }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('tab', { name: /^Settings$/ }).click()

    await expect(operationSwitch(dialog, 'AssetSync', 'disable')).toHaveAttribute('aria-checked', 'true', { timeout: 15_000 })
    await expect(operationInput(dialog, 'FindingSync', 'filterExpr')).toHaveValue('severity == "HIGH"')

    await operationSwitch(dialog, 'AssetSync', 'disable').click()
    await operationInput(dialog, 'FindingSync', 'filterExpr').fill('severity == "LOW"')

    const request = configureRequest(page)
    await dialog.getByRole('button', { name: /^Save Settings$/ }).click()

    expect((await request).postDataJSON()).toEqual({
      definitionId: CREDENTIALED_DEFINITION_ID,
      installationId: INSTALLATION_ID,
      credentialRef: CREDENTIAL_REF,
      body: {},
      operationConfig: {
        AssetSync: { disable: false },
        FindingSync: { disable: false, filterExpr: 'severity == "LOW"' },
      },
    })
    await expect(dialog).toBeHidden({ timeout: 15_000 })
  })
})
