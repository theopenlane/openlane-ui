import { type GetIntegrationsQuery } from '@repo/codegen/src/schema'
import {
  countFinalizedIntegrationsForProvider,
  operationSchemaEntries,
  parseIntegrationErrorMessage,
  primaryCredentialRef,
  primaryCredentialSchema,
  readIntegrationUserInput,
  resolveSchemaRoot,
  schemaHasProperties,
} from './utils'
import { isRecord } from '@/utils/type-guards'
import { resolveResourcePicker } from './resource-pickers'
import {
  type IntegrationConfigurationResult,
  type IntegrationNode,
  type IntegrationOperationConfigPayload,
  type IntegrationProvider,
  type IntegrationSelectedResource,
  type RunIntegrationOperationResponse,
  type StartIntegrationResponse,
} from './types'

export const PRIMARY_DIRECTORY_FIELD = 'primaryDirectory'
export const PRIMARY_DOCUMENT_FIELD = 'primary'
export const CHANNELS_LIST_OPERATION = 'ChannelsListOperation'
export const TEST_MESSAGE_SEND_OPERATION = 'TestMessageSendOperation'
export const PICKER_SESSION_OPERATION = 'PickerSession'
export const RESOURCE_SELECTION_OPERATION = 'ResourceSelection'
export const SELECTED_DOCUMENTS_FIELD = 'selectedDocuments'

type StartIntegrationOptions = {
  credentialRef?: string
  installationId?: string
  userInput?: Record<string, unknown>
  operationConfig?: IntegrationOperationConfigPayload
}

type SaveIntegrationConfigurationOptions = {
  definitionId: string
  installationId?: string
  credentialRef?: string
  body?: Record<string, unknown>
  userInput?: Record<string, unknown>
  operationConfig?: IntegrationOperationConfigPayload
}

const hasEntries = (value?: Record<string, unknown>): value is Record<string, unknown> => value != null && Object.keys(value).length > 0

export function providerHasCredentialSchema(provider?: IntegrationProvider): boolean {
  return schemaHasProperties(primaryCredentialSchema(provider))
}

export function providerHasUserInputSchema(provider?: IntegrationProvider): boolean {
  return schemaHasProperties(provider?.userInputSchema)
}

export const providerHasOperationConfigSchema = (provider?: IntegrationProvider): boolean => operationSchemaEntries(provider).length > 0

export const providerHasInstallationSettings = (provider?: IntegrationProvider): boolean => providerHasUserInputSchema(provider) || providerHasOperationConfigSchema(provider)

export function providerSupportsAuth(provider?: IntegrationProvider): boolean {
  return Boolean(provider?.hasAuth)
}

export function providerSupportsPrimaryDirectory(provider?: IntegrationProvider): boolean {
  const schema = resolveSchemaRoot(provider?.userInputSchema)
  return Boolean(schema?.properties && PRIMARY_DIRECTORY_FIELD in schema.properties)
}

export function providerSupportsDocumentSync(provider?: IntegrationProvider): boolean {
  const properties = resolveSchemaRoot(provider?.userInputSchema)?.properties
  return Boolean(properties && PRIMARY_DOCUMENT_FIELD in properties)
}

const providerHasRunnableOperation = (provider: IntegrationProvider | undefined, name: string): boolean =>
  Boolean(provider?.operations?.some((operation) => operation.name === name && !operation.disabledForAll))

export const providerSupportsTestMessage = (provider?: IntegrationProvider): boolean =>
  providerHasRunnableOperation(provider, CHANNELS_LIST_OPERATION) && providerHasRunnableOperation(provider, TEST_MESSAGE_SEND_OPERATION)

export const providerSupportsResourcePicker = (provider?: IntegrationProvider): boolean =>
  !!resolveResourcePicker(provider) &&
  SELECTED_DOCUMENTS_FIELD in (resolveSchemaRoot(provider?.userInputSchema)?.properties ?? {}) &&
  providerHasRunnableOperation(provider, PICKER_SESSION_OPERATION) &&
  providerHasRunnableOperation(provider, RESOURCE_SELECTION_OPERATION)

const isOptionalString = (value: unknown): value is string | undefined => value === undefined || typeof value === 'string'

const isSelectedResource = (value: unknown): value is IntegrationSelectedResource =>
  isRecord(value) && typeof value.id === 'string' && value.id !== '' && isOptionalString(value.name) && isOptionalString(value.parentId)

export const readSelectedResources = (integration: Pick<IntegrationNode, 'config'>): IntegrationSelectedResource[] => {
  const stored = readIntegrationUserInput(integration)[SELECTED_DOCUMENTS_FIELD]

  return Array.isArray(stored) ? stored.filter(isSelectedResource) : []
}

export const mergeSelectedResources = (current: IntegrationSelectedResource[], added: IntegrationSelectedResource[]): IntegrationSelectedResource[] => {
  const byId = new Map(current.map((resource) => [resource.id, resource]))
  added.forEach((resource) => byId.set(resource.id, resource))

  return [...byId.values()]
}

export function providerSupportsInstalledConfiguration(provider?: IntegrationProvider): boolean {
  if (!provider) {
    return false
  }

  return providerHasCredentialSchema(provider) || providerHasInstallationSettings(provider)
}

export function queryFinalizedIntegrationCountForProvider(data: GetIntegrationsQuery | undefined, provider: IntegrationProvider, providers: IntegrationProvider[]): number {
  const integrations = (data?.integrations.edges ?? []).flatMap((edge) => (edge?.node ? [edge.node] : []))

  return countFinalizedIntegrationsForProvider(integrations, provider, providers)
}

export function resolveIntegrationRedirectURL(response: StartIntegrationResponse): string | undefined {
  return response.authUrl ?? response.installUrl ?? response.url
}

export function openIntegrationRedirect(url: string) {
  window.location.assign(url)
}

export type ConnectViaAuthOptions = StartIntegrationOptions & {
  onRedirect?: () => void
}

export async function connectViaAuth(provider: IntegrationProvider, options?: ConnectViaAuthOptions): Promise<string> {
  const response = await startIntegrationAuthFlow(provider, options)
  const redirectURL = resolveIntegrationRedirectURL(response)

  if (!redirectURL) {
    throw new Error(`Missing auth redirect URL for ${provider.displayName}`)
  }

  openIntegrationRedirect(redirectURL)
  options?.onRedirect?.()

  return redirectURL
}

export async function startIntegrationAuthFlow(provider: IntegrationProvider, options?: StartIntegrationOptions): Promise<StartIntegrationResponse> {
  if (!provider.hasAuth) {
    throw new Error(`${provider.displayName} does not support auth flows`)
  }

  const response = await fetch('/api/integrations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      body: buildStartRequestBody(provider, options),
    }),
  })

  if (!response.ok) {
    throw new Error(await parseIntegrationErrorMessage(response))
  }

  return (await response.json()) as StartIntegrationResponse
}

export async function saveIntegrationConfiguration(options: SaveIntegrationConfigurationOptions): Promise<IntegrationConfigurationResult> {
  const response = await fetch('/api/integrations/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      definitionId: options.definitionId,
      installationId: options.installationId,
      credentialRef: options.credentialRef,
      body: options.body ?? {},
      userInput: hasEntries(options.userInput) ? options.userInput : undefined,
      operationConfig: hasEntries(options.operationConfig) ? options.operationConfig : undefined,
    }),
  })

  if (!response.ok) {
    throw new Error(await parseIntegrationErrorMessage(response))
  }

  return (await response.json()) as IntegrationConfigurationResult
}

type RunIntegrationOperationOptions = {
  integrationId: string
  operation: string
  config?: Record<string, unknown>
  signal?: AbortSignal
}

export const runIntegrationOperation = async <TDetails>({ integrationId, operation, config, signal }: RunIntegrationOperationOptions): Promise<RunIntegrationOperationResponse<TDetails>> => {
  const response = await fetch('/api/integrations/operations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ integrationId, operation, config }),
    signal,
  })

  if (!response.ok) {
    throw new Error(await parseIntegrationErrorMessage(response))
  }

  return (await response.json()) as RunIntegrationOperationResponse<TDetails>
}

function buildStartRequestBody(provider: IntegrationProvider, options?: StartIntegrationOptions): Record<string, unknown> {
  const body: Record<string, unknown> = {
    definitionId: provider.id,
  }

  const credentialRef = options?.credentialRef ?? primaryCredentialRef(provider)
  if (credentialRef) {
    body.credentialRef = credentialRef
  }

  if (options?.installationId) {
    body.integrationId = options.installationId
  }

  const userInput = options?.userInput
  if (hasEntries(userInput)) {
    body.userInput = userInput
  }

  const operationConfig = options?.operationConfig
  if (hasEntries(operationConfig)) {
    body.operationConfig = operationConfig
  }

  return body
}
