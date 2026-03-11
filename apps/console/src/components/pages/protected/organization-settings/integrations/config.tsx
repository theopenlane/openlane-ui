import { PLATFORM_DOCS_URL } from '@/constants/docs'
import { type GetIntegrationsQuery } from '@repo/codegen/src/schema'

export type IntegrationTab = 'All' | 'Coming Soon' | 'Installed'

type IntegrationEdges = NonNullable<NonNullable<GetIntegrationsQuery['integrations']>['edges']>

type IntegrationEdge = NonNullable<IntegrationEdges[number]>

export type IntegrationNode = NonNullable<IntegrationEdge['node']>

export type IntegrationSchemaProperty = {
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object'
  title?: string
  description?: string
  enum?: Array<string | number>
  format?: string
  default?: unknown
  example?: string
  examples?: string[]
  minLength?: number
  maxLength?: number
  pattern?: string
  minimum?: number
  maximum?: number
  secret?: boolean
  readOnly?: boolean
  readonly?: boolean
  items?: {
    type?: string
  }
}

export type IntegrationSchemaNode = {
  type?: string
  required?: string[]
  properties?: Record<string, IntegrationSchemaProperty>
  additionalProperties?: boolean
  allOf?: IntegrationSchemaNode[]
  anyOf?: IntegrationSchemaNode[]
  oneOf?: IntegrationSchemaNode[]
  if?: IntegrationSchemaNode
  then?: IntegrationSchemaNode
  else?: IntegrationSchemaNode
}

export type IntegrationCredentialsSchema = IntegrationSchemaNode

export type IntegrationOperationMetadata = {
  name: string
  kind?: string
  description?: string
  client?: string
  configSchema?: Record<string, unknown>
}

export type IntegrationGitHubAppMetadata = {
  baseUrl?: string
  tokenTtl?: string
  appSlug?: string
}

export type IntegrationOAuthMetadata = {
  clientId?: string
  authUrl?: string
  tokenUrl?: string
  redirectUri?: string
  scopes?: string[]
  usePkce?: boolean
  authParams?: Record<string, string>
  tokenParams?: Record<string, string>
  [key: string]: unknown
}

export type AvailableIntegrationNode = {
  id: string
  name: string
  tags: string[]
  description: string
  docsUrl: string
  provider: IntegrationProvider
}

export type IntegrationProvider = {
  name: string
  displayName: string
  category: string
  description?: string
  visible?: boolean
  tags?: string[]
  authType: string
  authStartPath?: string
  authCallbackPath?: string
  active: boolean
  logoUrl?: string
  docsUrl: string
  oauth?: IntegrationOAuthMetadata
  labels?: Record<string, string>
  credentialsSchema?: IntegrationCredentialsSchema
  operations?: IntegrationOperationMetadata[]
  githubApp?: IntegrationGitHubAppMetadata
}

export type IntegrationProvidersResponse = {
  providers: IntegrationProvider[]
}

const PROVIDER_ICON_MAP: Record<string, string> = {
  aws: '/icons/brand/integrations/aws.svg',
  awsauditmanager: '/icons/brand/integrations/aws.svg',
  awssecurityhub: '/icons/brand/integrations/aws.svg',
  azureentraid: '/icons/brand/integrations/azure.png',
  azuresecuritycenter: '/icons/brand/integrations/azure.png',
  buildkite: '/icons/brand/integrations/buildkite.png',
  cloudflare: '/icons/brand/integrations/cloudflare.png',
  gcpscc: '/icons/brand/integrations/google.png',
  github: '/icons/brand/integrations/github.png',
  githubapp: '/icons/brand/integrations/github.png',
  googleworkspace: '/icons/brand/integrations/google.png',
  microsoftteams: '/icons/brand/integrations/microsoft_teams.png',
  okta: '/icons/brand/integrations/okta.png',
  slack: '/icons/brand/integrations/slack.png',
  vercel: '/icons/brand/integrations/vercel.png',
}

export function getProviderIcon(name: string): string | undefined {
  return PROVIDER_ICON_MAP[name.toLowerCase()]
}

export function toAvailableIntegration(provider: IntegrationProvider): AvailableIntegrationNode {
  const id = provider.name.toLowerCase()
  const tags = provider.tags ?? []
  return {
    id,
    name: provider.displayName,
    tags,
    description: provider.description ?? '',
    docsUrl: provider.docsUrl || `${PLATFORM_DOCS_URL}/integrations/${id}`,
    provider,
  }
}

export function getInstalledIntegrationConfig(integration: Pick<IntegrationNode, 'name' | 'kind'>, providers: IntegrationProvider[]): { provider: IntegrationProvider; docsUrl: string } | undefined {
  const kind = integration.kind?.toLowerCase()
  const name = integration.name.toLowerCase()

  const provider = providers.find((p) => {
    const providerName = p.name.toLowerCase()
    return providerName === kind || providerName === name || name.includes(providerName)
  })
  if (!provider) return undefined
  const id = provider.name.toLowerCase()
  return {
    provider,
    docsUrl: provider.docsUrl || `${PLATFORM_DOCS_URL}/integrations/${id}`,
  }
}

export function installedIntegrationDisplayName(integration: Pick<IntegrationNode, 'name' | 'kind'>, providers: IntegrationProvider[]): string {
  return getInstalledIntegrationConfig(integration, providers)?.provider.displayName ?? integration.name
}

export function providerSupportsHealth(provider?: IntegrationProvider): boolean {
  return Boolean(provider?.operations?.some((op) => op.name === 'health.default'))
}

export const HEALTH_CHECK_STALE_TIME_MS = 2 * 60 * 1000

export async function parseIntegrationErrorMessage(response: Response): Promise<string> {
  const raw = await response.text().catch(() => '')
  try {
    const payload = JSON.parse(raw) as { error?: string; details?: string; message?: string }
    return payload.error || payload.details || payload.message || `Request failed (${response.status})`
  } catch {
    return raw || `Request failed (${response.status})`
  }
}
