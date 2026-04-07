import { PLATFORM_DOCS_URL } from '@/constants/docs'
import {
  type AvailableIntegrationNode,
  type IntegrationCredentialEntry,
  type IntegrationNode,
  type IntegrationProvider,
  type IntegrationProviderMatchFields,
  type IntegrationSchemaNode,
  type RawDefinition,
} from './types'

const FINALIZED_INTEGRATION_STATUSES = new Set(['CONNECTED', 'DISABLED', 'ERRORED'])

const PROVIDER_ICON_MAP: Record<string, string> = {
  aws: '/icons/brand/integrations/aws.svg',
  azure: '/icons/brand/integrations/azure.png',
  buildkite: '/icons/brand/integrations/buildkite.png',
  cloudflare: '/icons/brand/integrations/cloudflare.png',
  gcp: '/icons/brand/integrations/google.png',
  github: '/icons/brand/integrations/github.png',
  google: '/icons/brand/integrations/google.png',
  microsoft: '/icons/brand/integrations/microsoft_teams.png',
  okta: '/icons/brand/integrations/okta.png',
  scim: '/icons/brand/integrations/scim.png',
  slack: '/icons/brand/integrations/slack.png',
  vercel: '/icons/brand/integrations/vercel.png',
}

type FinalizedIntegrationFields = Pick<IntegrationNode, 'definitionID' | 'definitionSlug' | 'family' | 'kind' | 'name' | 'status'>

export const HEALTH_CHECK_OPERATION_NAME = 'HealthCheck'

export const HEALTH_CHECK_STALE_TIME_MS = 2 * 60 * 1000

export function normalizeDefinition(raw: RawDefinition): IntegrationProvider {
  const spec = raw.spec
  const hasAuth = (raw.connections ?? []).some((connection) => connection.auth != null)

  return {
    id: spec.id,
    slug: spec.family ?? spec.id,
    family: spec.family,
    displayName: spec.displayName,
    category: spec.category,
    description: spec.description,
    visible: spec.visible,
    tags: spec.tags,
    active: spec.active,
    logoUrl: spec.logoUrl,
    docsUrl: spec.docsUrl ?? '',
    hasAuth,
    credentialSchemas: raw.credentialRegistrations,
    operatorConfig: raw.operatorConfig?.schema,
    userInputSchema: raw.userInput?.schema,
    operations: raw.operations,
    connections: raw.connections,
    webhooks: raw.webhooks,
  }
}

export function normalizeIntegrationToken(value?: string | null): string {
  if (typeof value !== 'string') {
    return ''
  }

  return value.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

export function getProviderIcon(name: string): string | undefined {
  return PROVIDER_ICON_MAP[normalizeIntegrationToken(name)]
}

export function toAvailableIntegration(provider: IntegrationProvider): AvailableIntegrationNode {
  return {
    id: provider.id,
    name: provider.displayName,
    tags: provider.tags ?? [],
    description: provider.description ?? '',
    docsUrl: provider.docsUrl || `${PLATFORM_DOCS_URL}/integrations/${provider.slug}`,
    installedCount: 0,
    provider,
  }
}

export function isFinalizedIntegration(integration: Pick<IntegrationNode, 'status'>): boolean {
  return FINALIZED_INTEGRATION_STATUSES.has(normalizeIntegrationStatus(integration.status))
}

export function filterFinalizedIntegrationsForProvider<T extends FinalizedIntegrationFields>(integrations: T[], provider: IntegrationProvider): T[] {
  return integrations.filter((integration) => isFinalizedIntegration(integration) && matchIntegrationProvider(integration, [provider])?.id === provider.id)
}

export function collectRequiredSchemaFields(schema?: IntegrationSchemaNode): Set<string> {
  const required = new Set<string>()
  if (!schema) {
    return required
  }

  const registry = schema.$defs ?? schema.definitions ?? {}

  const visit = (node?: IntegrationSchemaNode) => {
    const resolved = resolveSchemaNode(node, registry)
    if (!resolved) {
      return
    }

    if (Array.isArray(resolved.required)) {
      for (const key of resolved.required) {
        if (typeof key === 'string' && key.trim() !== '') {
          required.add(key)
        }
      }
    }

    for (const child of resolved.allOf ?? []) {
      visit(child)
    }
    for (const child of resolved.anyOf ?? []) {
      visit(child)
    }
    for (const child of resolved.oneOf ?? []) {
      visit(child)
    }

    visit(resolved.if)
    visit(resolved.then)
    visit(resolved.else)
  }

  visit(schema)

  return required
}

export function schemaHasProperties(schema?: IntegrationSchemaNode): boolean {
  return Object.keys(resolveSchemaRoot(schema)?.properties ?? {}).length > 0
}

export function integrationDefinitionID(integration: IntegrationProviderMatchFields, providers: IntegrationProvider[]): string | undefined {
  const definitionID = integration.definitionID?.trim()
  if (definitionID) {
    return definitionID
  }

  return matchIntegrationProvider(integration, providers)?.id
}

export function countFinalizedIntegrationsForProvider(integrations: FinalizedIntegrationFields[], provider: IntegrationProvider): number {
  return filterFinalizedIntegrationsForProvider(integrations, provider).length
}

export function latestFinalizedIntegrationForProvider<T extends FinalizedIntegrationFields & Pick<IntegrationNode, 'id' | 'createdAt'>>(
  integrations: T[],
  provider: IntegrationProvider,
): T | undefined {
  return filterFinalizedIntegrationsForProvider(integrations, provider).sort((left, right) => Date.parse(right.createdAt ?? '') - Date.parse(left.createdAt ?? ''))[0]
}

export function getInstalledIntegrationConfig(integration: IntegrationProviderMatchFields, providers: IntegrationProvider[]): { provider: IntegrationProvider; docsUrl: string } | undefined {
  const provider = matchIntegrationProvider(integration, providers)
  if (!provider) {
    return undefined
  }

  return {
    provider,
    docsUrl: provider.docsUrl || `${PLATFORM_DOCS_URL}/integrations/${provider.slug}`,
  }
}

export function installedIntegrationDisplayName(integration: IntegrationProviderMatchFields, providers: IntegrationProvider[]): string {
  const providerName = getInstalledIntegrationConfig(integration, providers)?.provider.displayName

  if (!providerName) {
    return integration.name
  }

  if (normalizeIntegrationToken(integration.name) !== normalizeIntegrationToken(providerName)) {
    return integration.name
  }

  return providerName
}

export function matchIntegrationProvider(integration: IntegrationProviderMatchFields, providers: IntegrationProvider[]): IntegrationProvider | undefined {
  const definitionID = integration.definitionID?.trim()
  if (definitionID) {
    const exactMatch = providers.find((provider) => provider.id === definitionID)
    if (exactMatch) {
      return exactMatch
    }
  }

  return matchProviderByTokens([integration.definitionSlug, integration.family, integration.kind, integration.name], providers)
}

export function resolveSchemaRoot(schema?: IntegrationSchemaNode): IntegrationSchemaNode | undefined {
  if (!schema) {
    return undefined
  }

  const registry = schema.$defs ?? schema.definitions ?? {}

  return resolveSchemaNode(schema, registry)
}

export function resolveSchemaNode(node: IntegrationSchemaNode | undefined, registry: Record<string, IntegrationSchemaNode> = {}): IntegrationSchemaNode | undefined {
  if (!node) {
    return undefined
  }

  if (!node.$ref) {
    return node
  }

  const key = schemaRefKey(node.$ref)
  if (!key) {
    return node
  }

  const resolved = registry[key]
  if (!resolved) {
    return node
  }

  return resolveSchemaNode({ ...resolved, ...node, $ref: undefined }, registry)
}

export function primaryCredentialEntry(provider?: IntegrationProvider): IntegrationCredentialEntry | undefined {
  return provider?.credentialSchemas?.[0]
}

export function resolveCredentialEntry(provider?: IntegrationProvider, credentialRef?: string): IntegrationCredentialEntry | undefined {
  if (!credentialRef) {
    return undefined
  }

  return (provider?.credentialSchemas ?? []).find((entry) => entry.ref === credentialRef)
}

export function primaryCredentialSchema(provider?: IntegrationProvider): IntegrationSchemaNode | undefined {
  return primaryCredentialEntry(provider)?.schema
}

export function primaryCredentialRef(provider?: IntegrationProvider): string | undefined {
  return primaryCredentialEntry(provider)?.ref
}

export function resolveConnectionEntry(provider?: IntegrationProvider, credentialRef?: string) {
  if (!provider) {
    return undefined
  }

  const activeCredentialRef = credentialRef ?? primaryCredentialRef(provider)

  return provider.connections?.find((connection) => connection.credentialRef === activeCredentialRef)
}

export function providerSupportsHealth(provider?: IntegrationProvider): boolean {
  return Boolean(provider?.operations?.some((operation) => operation.name === HEALTH_CHECK_OPERATION_NAME))
}

export async function parseIntegrationErrorMessage(response: Response): Promise<string> {
  const raw = await response.text().catch(() => '')

  try {
    const payload = JSON.parse(raw) as { error?: string; details?: string; message?: string }
    return payload.error || payload.details || payload.message || `Request failed (${response.status})`
  } catch {
    return raw || `Request failed (${response.status})`
  }
}

function matchProviderByTokens(candidates: Array<string | null | undefined>, providers: IntegrationProvider[]): IntegrationProvider | undefined {
  const tokens = candidates.map((candidate) => normalizeIntegrationToken(candidate)).filter(Boolean)

  if (tokens.length === 0) {
    return undefined
  }

  return providers.find((provider) => {
    const providerTokens = new Set([provider.id, provider.slug, provider.family, provider.displayName].map((value) => normalizeIntegrationToken(value)).filter(Boolean))

    return tokens.some((token) => providerTokens.has(token))
  })
}

function schemaRefKey(ref: string): string | undefined {
  if (ref.startsWith('#/$defs/')) {
    return ref.slice('#/$defs/'.length)
  }

  if (ref.startsWith('#/definitions/')) {
    return ref.slice('#/definitions/'.length)
  }

  return undefined
}

function normalizeIntegrationStatus(status?: string | null): string {
  if (typeof status !== 'string') {
    return ''
  }

  return status.trim().toUpperCase()
}
