'use client'

import React, { useState } from 'react'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@repo/ui/cardpanel'
import { type AvailableIntegrationNode, type IntegrationOAuthMetadata, type IntegrationProvider, parseIntegrationErrorMessage } from './config'
import { useNotification } from '@/hooks/useNotification'
import IntegrationConfigurationDialog from './integration-configuration-dialog'
import IntegrationTagList from './integration-tag-list'
import IntegrationCardIcons from './integration-card-icons'
import DocsLinkTooltip from './docs-link-tooltip'

type AvailableIntegrationCardProps = {
  integration: AvailableIntegrationNode
}

type StartIntegrationResponse = {
  authUrl?: string
  installUrl?: string
  url?: string
  state?: string
}

const AvailableIntegrationCard = ({ integration }: AvailableIntegrationCardProps) => {
  const { errorNotification } = useNotification()
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  const provider = integration.provider
  const isComingSoon = !provider.active

  const connectMode = resolveProviderConnectMode(provider)
  const connectLabel = isComingSoon ? 'Coming Soon' : connectMode === 'config' ? 'Configure' : 'Connect'

  const handleConnect = async (target: AvailableIntegrationNode) => {
    if (isComingSoon) {
      return
    }

    const targetProvider = target.provider
    const mode = resolveProviderConnectMode(targetProvider)

    if (mode === 'config') {
      setIsConfigDialogOpen(true)
      return
    }

    setIsConnecting(true)
    try {
      if (mode === 'auth') {
        if (!targetProvider.authStartPath) {
          throw new Error(`Missing auth start path for ${targetProvider.displayName}`)
        }

        const res = await fetch('/api/integrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: targetProvider.name,
            authType: targetProvider.authType,
            scopes: targetProvider.oauth?.scopes ?? [],
            startPath: targetProvider.authStartPath,
            callbackPath: targetProvider.authCallbackPath,
            appSlug: targetProvider.githubApp?.appSlug,
          }),
        })

        if (!res.ok) {
          throw new Error(await parseIntegrationErrorMessage(res))
        }

        const json = (await res.json()) as StartIntegrationResponse
        const redirectTo = resolveIntegrationRedirectURL(targetProvider, json)

        if (!redirectTo) {
          throw new Error(`Missing auth redirect URL for ${targetProvider.displayName}`)
        }

        window.location.assign(redirectTo)
        return
      }

      errorNotification({
        title: `Failed to connect ${target.name}`,
        description: 'Provider authentication flow is not configured.',
      })
    } catch (error) {
      errorNotification({
        title: `Failed to connect ${target.name}`,
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <>
      <Card className="relative flex h-full min-h-[300px] flex-col overflow-visible transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:-translate-y-1">
        <CardHeader className="relative flex-row items-start gap-3 space-y-0 pb-3">
          {isComingSoon ? (
            <Badge variant="outline" className="absolute left-0 top-0 h-6 px-2 text-[10px] uppercase tracking-[0.05em] text-muted-foreground">
              Coming Soon
            </Badge>
          ) : null}
          <DocsLinkTooltip href={integration.docsUrl} label={integration.name} />

          <div className="w-full">
            <div className="flex gap-4">
              <IntegrationCardIcons providerName={provider.name} />

              <div className="flex min-w-0 flex-1 flex-col justify-center self-center">
                <span className="truncate">{integration.name}</span>
              </div>
            </div>

            <div className="mt-3 border-t pt-3 mb-1">
              <IntegrationTagList tags={integration.tags} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex min-h-[112px] flex-1 items-center pt-4 pb-2">
          <p className="line-clamp-3 text-sm text-muted-foreground">{integration.description || 'Connect to keep your workflows connected and risks actionable.'}</p>
        </CardContent>

        <CardFooter className="mt-auto pt-0">
          <Button className="w-full text-brand" variant="secondary" onClick={() => handleConnect(integration)} disabled={isConnecting || isComingSoon}>
            {isConnecting ? 'Initializing...' : connectLabel}
          </Button>
        </CardFooter>
      </Card>

      <IntegrationConfigurationDialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen} provider={provider} />
    </>
  )
}

export default AvailableIntegrationCard

type ConnectMode = 'auth' | 'config' | 'unsupported'

function resolveProviderConnectMode(provider: IntegrationProvider): ConnectMode {
  if (provider.authStartPath) return 'auth'
  if (provider.credentialsSchema) return 'config'
  return 'unsupported'
}

function resolveIntegrationRedirectURL(provider: IntegrationProvider, response: StartIntegrationResponse): string | undefined {
  if (provider.authType !== 'oauth2' && provider.authType !== 'oidc') {
    return response.authUrl ?? response.installUrl ?? response.url
  }

  const state = resolveOAuthState(response)
  if (!state) {
    return undefined
  }

  const authorizeURL = buildProviderAuthorizeURL(provider.oauth, state)

  return authorizeURL
}

function resolveOAuthState(response: StartIntegrationResponse): string | undefined {
  if (response.state && response.state.length > 0) {
    return response.state
  }

  return undefined
}

function buildProviderAuthorizeURL(oauth: IntegrationOAuthMetadata | undefined, state: string | undefined): string | undefined {
  const authURL = nonEmptyString(oauth?.authUrl)
  const clientID = nonEmptyString(oauth?.clientId)
  const redirectURI = nonEmptyString(oauth?.redirectUri)

  if (!authURL || !clientID || !redirectURI) {
    return undefined
  }

  const authParams = toStringRecord(oauth?.authParams)
  const params = new URLSearchParams({
    client_id: clientID,
    response_type: 'code',
    redirect_uri: redirectURI,
  })

  if (state && state.length > 0) {
    params.set('state', state)
  }

  const scopes = toStringArray(oauth?.scopes)
  if (scopes.length > 0 && !authParams.scope) {
    params.set('scope', scopes.join(resolveScopeSeparator(authURL)))
  }

  for (const [key, value] of Object.entries(authParams)) {
    params.set(key, value)
  }

  return `${authURL}?${params.toString()}`
}

function resolveScopeSeparator(authURL: string): string {
  if (authURL.includes('slack.com/oauth/v2/authorize')) {
    return ','
  }

  return ' '
}

function nonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  return value.length > 0 ? value : undefined
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string' && item.length > 0)
}

function toStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') {
    return {}
  }

  const record: Record<string, string> = {}

  for (const [key, entry] of Object.entries(value)) {
    if (typeof key !== 'string' || key.length === 0) {
      continue
    }

    if (typeof entry !== 'string' || entry.length === 0) {
      continue
    }

    record[key] = entry
  }

  return record
}
