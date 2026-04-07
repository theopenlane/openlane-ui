import { type GetIntegrationsQuery } from '@repo/codegen/src/schema'
import { countFinalizedIntegrationsForProvider, parseIntegrationErrorMessage, primaryCredentialRef, primaryCredentialSchema, schemaHasProperties } from './utils'
import { type IntegrationConfigurationResult, type IntegrationProvider, type StartIntegrationResponse } from './types'

const INTEGRATION_AUTH_START_PATH = '/v1/integrations/auth/start'

type StartIntegrationOptions = {
  credentialRef?: string
  installationId?: string
  userInput?: Record<string, unknown>
}

type SaveIntegrationConfigurationOptions = {
  definitionId: string
  installationId?: string
  credentialRef?: string
  body?: Record<string, unknown>
  userInput?: Record<string, unknown>
}

export function providerHasCredentialSchema(provider?: IntegrationProvider): boolean {
  return schemaHasProperties(primaryCredentialSchema(provider))
}

export function providerHasUserInputSchema(provider?: IntegrationProvider): boolean {
  return schemaHasProperties(provider?.userInputSchema)
}

export function providerSupportsAuth(provider?: IntegrationProvider): boolean {
  return Boolean(provider?.hasAuth)
}

export function providerSupportsInstalledConfiguration(provider?: IntegrationProvider): boolean {
  if (!provider) {
    return false
  }

  return providerHasCredentialSchema(provider) || providerHasUserInputSchema(provider)
}

export function queryFinalizedIntegrationCountForProvider(data: GetIntegrationsQuery | undefined, provider: IntegrationProvider): number {
  const integrations = (data?.integrations.edges ?? []).flatMap((edge) => (edge?.node ? [edge.node] : []))

  return countFinalizedIntegrationsForProvider(integrations, provider)
}

export function resolveIntegrationRedirectURL(response: StartIntegrationResponse): string | undefined {
  return response.authUrl ?? response.installUrl ?? response.url
}

export function openIntegrationRedirect(url: string) {
  const popup = window.open(url, '_blank', 'noopener,noreferrer')
  if (!popup) {
    window.location.assign(url)
  }
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
      startPath: INTEGRATION_AUTH_START_PATH,
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
      userInput: options.userInput ?? {},
    }),
  })

  if (!response.ok) {
    throw new Error(await parseIntegrationErrorMessage(response))
  }

  return (await response.json()) as IntegrationConfigurationResult
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
    body.installationId = options.installationId
  }

  if (options?.userInput && Object.keys(options.userInput).length > 0) {
    body.userInput = options.userInput
  }

  return body
}
