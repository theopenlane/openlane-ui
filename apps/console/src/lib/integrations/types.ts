import { type GetIntegrationsQuery } from '@repo/codegen/src/schema'

export type IntegrationTab = 'All' | 'Coming Soon' | 'Installed'

export type IntegrationMetadata = {
  externalName?: string
  externalId?: string
  credentialRef?: string
  lastSuccessfulHealthCheck?: string
}

type IntegrationEdges = NonNullable<NonNullable<GetIntegrationsQuery['integrations']>['edges']>

type IntegrationEdge = NonNullable<IntegrationEdges[number]>

export type IntegrationNode = NonNullable<IntegrationEdge['node']>

export type IntegrationProviderMatchFields = Pick<IntegrationNode, 'definitionID' | 'definitionSlug' | 'family' | 'kind' | 'name'>

export type IntegrationSchemaNode = {
  $ref?: string
  $defs?: Record<string, IntegrationSchemaNode>
  definitions?: Record<string, IntegrationSchemaNode>
  type?: string | string[]
  title?: string
  description?: string
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

export type IntegrationSchemaProperty = IntegrationSchemaNode & {
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
  items?: IntegrationSchemaNode
  const?: unknown
}

export type IntegrationOperationMetadata = {
  name: string
  description?: string
  configSchema?: IntegrationSchemaNode
}

export type IntegrationCredentialEntry = {
  ref: string
  name?: string
  description?: string
  schema?: IntegrationSchemaNode
}

export type IntegrationConnectionEntry = {
  credentialRef: string
  name?: string
  description?: string
  credentialRefs?: string[]
  validationOperation?: string
  auth?: unknown
  disconnect?: {
    credentialRef?: string
    description?: string
  }
}

export type IntegrationProvider = {
  id: string
  slug: string
  family?: string
  displayName: string
  category?: string
  description?: string
  visible?: boolean
  tags?: string[]
  active: boolean
  logoUrl?: string
  docsUrl: string
  hasAuth: boolean
  credentialSchemas?: IntegrationCredentialEntry[]
  operatorConfig?: IntegrationSchemaNode
  userInputSchema?: IntegrationSchemaNode
  operations?: IntegrationOperationMetadata[]
  connections?: IntegrationConnectionEntry[]
  webhooks?: { name: string; events?: { name: string }[] }[]
}

export type AvailableIntegrationNode = {
  id: string
  name: string
  tags: string[]
  description: string
  docsUrl: string
  installedCount: number
  provider: IntegrationProvider
}

export type RawDefinitionSpec = {
  id: string
  family?: string
  displayName: string
  category?: string
  description?: string
  visible?: boolean
  tags?: string[]
  active: boolean
  logoUrl?: string
  docsUrl?: string
}

export type RawDefinition = {
  spec: RawDefinitionSpec
  credentialRegistrations?: IntegrationCredentialEntry[]
  connections?: IntegrationConnectionEntry[]
  operatorConfig?: { schema?: IntegrationSchemaNode }
  userInput?: { schema?: IntegrationSchemaNode }
  operations?: IntegrationOperationMetadata[]
  webhooks?: { name: string; events?: { name: string }[] }[]
}

export type RawProvidersResponse = {
  success?: boolean
  providers: RawDefinition[]
}

export type IntegrationProvidersResponse = {
  success?: boolean
  providers: IntegrationProvider[]
}

export type StartIntegrationResponse = {
  authUrl?: string
  installUrl?: string
  url?: string
  state?: string
  message?: string
}

export type IntegrationConfigurationResult = {
  installationId?: string
  healthStatus?: string
  healthSummary?: string
  installationMetadata?: Record<string, unknown>
  webhookEndpointUrl?: string
  webhookSecret?: string
}
