'use client'

import React, { useState } from 'react'
import { ArrowLeftRight, SquareArrowOutUpRight } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@repo/ui/cardpanel'
import { Logo } from '@repo/ui/logo'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { AvailableIntegrationNode, IntegrationProvider, parseIntegrationErrorMessage } from './config'
import { useNotification } from '@/hooks/useNotification'
import ProviderIcon from './provider-icon'
import IntegrationConfigurationDialog from './integration-configuration-dialog'
import IntegrationTagPill from './integration-tag-pill'

type AvailableIntegrationCardProps = {
  integration: AvailableIntegrationNode
}

const AvailableIntegrationCard = ({ integration }: AvailableIntegrationCardProps) => {
  const { errorNotification } = useNotification()
  const [isConfigDialogOpen, setConfigDialogOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  const provider = integration.provider
  const isComingSoon = !provider.active
  const visibleTags = integration.tags.slice(0, 3)
  const hiddenTagCount = Math.max(integration.tags.length - visibleTags.length, 0)

  const connectMode = resolveProviderConnectMode(provider)
  const connectLabel = isComingSoon ? 'Coming Soon' : connectMode === 'config' ? 'Configure' : 'Connect'

  const handleConnect = async (target: AvailableIntegrationNode) => {
    if (isComingSoon) {
      return
    }

    const targetProvider = target.provider
    const mode = resolveProviderConnectMode(targetProvider)

    if (mode === 'config') {
      setConfigDialogOpen(true)
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
          }),
        })

        if (!res.ok) {
          throw new Error(await parseIntegrationErrorMessage(res))
        }

        const json = (await res.json()) as { authUrl?: string; installUrl?: string; url?: string }
        const redirectTo = json.authUrl ?? json.installUrl ?? json.url
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
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <a href={integration.docsUrl} target="_blank" rel="noreferrer" aria-label={`Open ${integration.name} documentation`} className="absolute right-0 top-0">
                  <span className="inline-flex h-6 w-6 items-center justify-center text-muted-foreground transition-colors hover:text-foreground">
                    <SquareArrowOutUpRight size={12} />
                  </span>
                </a>
              </TooltipTrigger>
              <TooltipContent side="top" align="end" sideOffset={8}>
                Open documentation
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="w-full">
            <div className="flex gap-4">
              <div className="flex items-center gap-1 self-start">
                <div className="w-[34px] h-[34px] border rounded-full flex items-center justify-center">
                  <Logo asIcon width={16} />
                </div>
                <ArrowLeftRight size={8} />
                <div className="w-[42px] h-[42px] border rounded-full flex items-center justify-center">
                  <ProviderIcon providerName={provider.name} className="h-6 w-6 object-contain" />
                </div>
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-center self-center">
                <span className="truncate">{integration.name}</span>
              </div>
            </div>

            <div className="mt-3 border-t pt-3 mb-1">
              <div className="flex items-center gap-1 overflow-hidden">
                {visibleTags.map((tag, index) => (
                  <IntegrationTagPill key={`${tag}-${index}`} tag={tag} />
                ))}
                {hiddenTagCount > 0 ? (
                  <Badge variant="outline" className="h-5 rounded-sm border-transparent bg-muted/35 px-2 text-[10px] font-medium text-muted-foreground">
                    +{hiddenTagCount} more
                  </Badge>
                ) : null}
              </div>
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

      <IntegrationConfigurationDialog open={isConfigDialogOpen} onOpenChange={setConfigDialogOpen} provider={provider} />
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
