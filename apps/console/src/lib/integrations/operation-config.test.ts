import { buildInitialValues, buildSections, normalizeIntegrationFormPayloads } from './schema'
import { operationSchemaEntries } from './utils'
import { providerHasInstallationSettings, providerHasOperationConfigSchema, providerSupportsInstalledConfiguration, saveIntegrationConfiguration, startIntegrationAuthFlow } from './flow'
import { type IntegrationOperationMetadata, type IntegrationProvider, type IntegrationSchemaNode } from './types'

const operationSettingsSchema = (title: string): IntegrationSchemaNode => ({
  type: 'object',
  title,
  properties: {
    disable: { type: 'boolean', title: 'Disable', description: 'Disable this operation for the installation' },
    filterExpr: { type: 'string', title: 'Filter Expression', description: 'Optional CEL expression applied to records before ingesting' },
  },
})

const operation = (overrides: Partial<IntegrationOperationMetadata> & Pick<IntegrationOperationMetadata, 'name'>): IntegrationOperationMetadata => ({
  disabledForAll: false,
  stored: true,
  input: { name: overrides.name, schema: operationSettingsSchema(overrides.name) },
  ...overrides,
})

const buildProvider = (overrides: Partial<IntegrationProvider> = {}): IntegrationProvider => ({
  id: 'def_01K0TAILSCALE0000000000001',
  slug: 'tailscale',
  displayName: 'Tailscale',
  active: true,
  docsUrl: 'https://docs.theopenlane.io',
  hasAuth: false,
  operations: [operation({ name: 'AssetSync', description: 'Sync tailnet devices as assets' })],
  ...overrides,
})

const formKey = (operationName: string, field: string) => `operationConfig__${operationName}__${field}`

describe('operationSchemaEntries', () => {
  test('returns one entry per stored operation with a humanized title', () => {
    expect(operationSchemaEntries(buildProvider())).toEqual([{ name: 'AssetSync', title: 'Asset Sync', description: 'Sync tailnet devices as assets', schema: operationSettingsSchema('AssetSync') }])
  })

  test('skips operations that are not stored, disabled for all, or have no input properties', () => {
    const provider = buildProvider({
      operations: [
        operation({ name: 'HealthDefault', stored: false }),
        operation({ name: 'VulnerabilitySync', disabledForAll: true }),
        operation({ name: 'EmptyInput', input: { name: 'EmptyInput', schema: { type: 'object', properties: {} } } }),
        operation({ name: 'NoInput', input: undefined }),
        operation({ name: 'AssetSync' }),
      ],
    })

    expect(operationSchemaEntries(provider).map((entry) => entry.name)).toEqual(['AssetSync'])
  })

  test('uses the stored schemas of an installation instead of the provider schema', () => {
    const stored: IntegrationSchemaNode = {
      type: 'object',
      properties: {
        disable: { type: 'boolean', title: 'Disable', default: true },
        filterExpr: { type: 'string', title: 'Filter Expression', default: 'payload.os == "linux"' },
      },
    }

    expect(operationSchemaEntries(buildProvider(), { AssetSync: stored })[0]?.schema).toEqual(stored)
  })

  test('renders no operation for an installation whose stored schemas are missing, so provider defaults never overwrite them', () => {
    expect(operationSchemaEntries(buildProvider(), {})).toEqual([])
  })

  test('resolves a root $ref schema', () => {
    const provider = buildProvider({
      operations: [
        operation({
          name: 'AssetSync',
          input: { name: 'AssetSync', schema: { $ref: '#/$defs/AssetSync', $defs: { AssetSync: operationSettingsSchema('AssetSync') } } },
        }),
      ],
    })

    expect(Object.keys(operationSchemaEntries(provider)[0]?.schema.properties ?? {})).toEqual(['disable', 'filterExpr'])
  })
})

describe('provider operation config capability', () => {
  test('a provider with only stored operations still offers installation settings', () => {
    const provider = buildProvider()

    expect(providerHasOperationConfigSchema(provider)).toBe(true)
    expect(providerHasInstallationSettings(provider)).toBe(true)
    expect(providerSupportsInstalledConfiguration(provider)).toBe(true)
  })

  test('a provider without stored operations or user input offers no installation settings', () => {
    const provider = buildProvider({ operations: [operation({ name: 'HealthDefault', stored: false })] })

    expect(providerHasOperationConfigSchema(provider)).toBe(false)
    expect(providerHasInstallationSettings(provider)).toBe(false)
  })
})

describe('operation config form sections and payloads', () => {
  const credentialSchema: IntegrationSchemaNode = {
    type: 'object',
    required: ['clientId'],
    properties: { clientId: { type: 'string', title: 'Client ID' } },
  }

  test('adds one section per operation, prefixed by operation name, after credentials and user input', () => {
    const sections = buildSections(credentialSchema, undefined, operationSchemaEntries(buildProvider()))

    expect(sections.map((section) => [section.prefix, section.title, section.operation])).toEqual([
      ['credentials__', 'Credentials', undefined],
      ['operationConfig__AssetSync__', 'Asset Sync', 'AssetSync'],
    ])
  })

  test('seeds operation fields from the stored defaults', () => {
    const stored: IntegrationSchemaNode = {
      type: 'object',
      properties: {
        disable: { type: 'boolean', default: true },
        filterExpr: { type: 'string', default: 'payload.os == "linux"' },
      },
    }

    const values = buildInitialValues(buildSections(undefined, undefined, operationSchemaEntries(buildProvider(), { AssetSync: stored })))

    expect(values).toEqual({ [formKey('AssetSync', 'disable')]: true, [formKey('AssetSync', 'filterExpr')]: 'payload.os == "linux"' })
  })

  test('groups each operation document under its operation name', () => {
    const provider = buildProvider({ operations: [operation({ name: 'AssetSync' }), operation({ name: 'VulnerabilitySync' })] })

    const result = normalizeIntegrationFormPayloads(credentialSchema, undefined, operationSchemaEntries(provider), {
      credentials__clientId: 'client-1',
      [formKey('AssetSync', 'disable')]: true,
      [formKey('AssetSync', 'filterExpr')]: '',
      [formKey('VulnerabilitySync', 'disable')]: false,
      [formKey('VulnerabilitySync', 'filterExpr')]: 'severity == "HIGH"',
    })

    expect(result.operationConfigPayload).toEqual({
      AssetSync: { disable: true },
      VulnerabilitySync: { disable: false, filterExpr: 'severity == "HIGH"' },
    })
    expect(result.hasOperationConfigPayload).toBe(true)
    expect(result.credentialPayload.payload).toEqual({ clientId: 'client-1' })
    expect(result.hasUserInputPayload).toBe(false)
  })

  test('reports missing required operation fields with the operation title', () => {
    const provider = buildProvider({
      operations: [
        operation({
          name: 'FolderSync',
          input: { name: 'FolderSync', schema: { type: 'object', required: ['folderId'], properties: { folderId: { type: 'string', title: 'Folder ID' } } } },
        }),
      ],
    })

    const result = normalizeIntegrationFormPayloads(undefined, undefined, operationSchemaEntries(provider), { [formKey('FolderSync', 'folderId')]: '' })

    expect(result.missingRequired).toEqual(['Folder Sync: Folder ID'])
    expect(result.hasOperationConfigPayload).toBe(false)
  })

  test('produces no operation payload when the provider has no stored operations', () => {
    const result = normalizeIntegrationFormPayloads(credentialSchema, undefined, [], { credentials__clientId: 'client-1' })

    expect(result.operationConfigPayload).toEqual({})
    expect(result.hasOperationConfigPayload).toBe(false)
  })
})

describe('integration request bodies', () => {
  let requestBody: unknown

  beforeEach(() => {
    requestBody = undefined
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const respondWith = (response: Record<string, unknown>) =>
    jest.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      requestBody = JSON.parse(String(init?.body))
      return new Response(JSON.stringify(response), { status: 200 })
    })

  test('the configure request carries operation config and omits empty user input', async () => {
    respondWith({ integrationId: 'int-1' })

    await saveIntegrationConfiguration({
      definitionId: 'def-1',
      installationId: 'int-1',
      body: {},
      userInput: {},
      operationConfig: { AssetSync: { disable: true } },
    })

    expect(requestBody).toEqual({ definitionId: 'def-1', installationId: 'int-1', body: {}, operationConfig: { AssetSync: { disable: true } } })
  })

  test('the configure request omits operation config when there is none', async () => {
    respondWith({ integrationId: 'int-1' })

    await saveIntegrationConfiguration({ definitionId: 'def-1', installationId: 'int-1', body: { clientId: 'client-1' }, operationConfig: {} })

    expect(requestBody).toEqual({ definitionId: 'def-1', installationId: 'int-1', body: { clientId: 'client-1' } })
  })

  test('the auth start request carries operation config', async () => {
    respondWith({ authUrl: 'https://auth.example.com/authorize' })

    await startIntegrationAuthFlow(buildProvider({ hasAuth: true }), { credentialRef: 'oauth', operationConfig: { AssetSync: { disable: false, filterExpr: 'true' } } })

    expect(requestBody).toEqual({
      body: { definitionId: 'def_01K0TAILSCALE0000000000001', credentialRef: 'oauth', operationConfig: { AssetSync: { disable: false, filterExpr: 'true' } } },
    })
  })

  test('the auth start request omits empty operation config', async () => {
    respondWith({ authUrl: 'https://auth.example.com/authorize' })

    await startIntegrationAuthFlow(buildProvider({ hasAuth: true }), { credentialRef: 'oauth', operationConfig: {} })

    expect(requestBody).toEqual({ body: { definitionId: 'def_01K0TAILSCALE0000000000001', credentialRef: 'oauth' } })
  })
})
