'use client'

import React, { useState } from 'react'
import { MoreHorizontal, ArrowLeftRight, SquareArrowOutUpRight } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@repo/ui/cardpanel'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Logo } from '@repo/ui/logo'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { getInstalledIntegrationConfig, installedIntegrationDisplayName, IntegrationNode, IntegrationProvider, providerSupportsHealth } from './config'
import { useDisconnectIntegration } from '@/lib/graphql-hooks/integration'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import ProviderIcon from './provider-icon'
import { useQuery } from '@tanstack/react-query'
import IntegrationTagPill from './integration-tag-pill'
import { formatDate } from '@/utils/date'

type HealthResponse = {
  status?: string
  summary?: string
}

type InstalledIntegrationCardProps = {
  integration: IntegrationNode
  providers: IntegrationProvider[]
}

const InstalledIntegrationCard = ({ integration, providers }: InstalledIntegrationCardProps) => {
  const disconnectMutation = useDisconnectIntegration()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleDisconnect = () => {
    disconnectMutation.mutate({ id: integration.id })
    setConfirmOpen(false)
  }

  const integrationConfig = getInstalledIntegrationConfig(integration, providers)
  const provider = integrationConfig?.provider
  const displayName = installedIntegrationDisplayName(integration, providers)
  const supportsHealth = providerSupportsHealth(provider)
  const tags = provider?.tags?.length ? provider.tags : integration.tags
  const description = provider?.description || integration.description || 'Connect to keep your workflows connected and risks actionable.'
  const visibleTags = tags?.slice(0, 3) ?? []
  const hiddenTagCount = Math.max((tags?.length ?? 0) - visibleTags.length, 0)

  const healthQuery = useQuery<HealthResponse>({
    queryKey: ['integrationHealth', provider?.name],
    queryFn: async () => {
      if (!provider) {
        return {}
      }

      const res = await fetch(`/api/integrations/health?provider=${encodeURIComponent(provider.name)}`)
      if (!res.ok) {
        throw new Error(await parseErrorMessage(res))
      }
      return (await res.json()) as HealthResponse
    },
    enabled: Boolean(provider?.name && supportsHealth),
    staleTime: 2 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const healthStatus = getHealthStatus(supportsHealth, healthQuery.isPending, healthQuery.isError, healthQuery.data)

  return (
    <>
      <Card className="relative flex h-full min-h-[300px] flex-col overflow-visible transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:-translate-y-1">
        <CardHeader className="relative flex-row items-start gap-3 space-y-0 pb-3">
          {integrationConfig?.docsUrl ? (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={integrationConfig.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${displayName} documentation`}
                    className="absolute right-0 top-0"
                  >
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
          ) : null}

          <div className="w-full">
            <div className="flex gap-4">
              <div className="flex items-center gap-1 self-start">
                <div className="w-[34px] h-[34px] border rounded-full flex items-center justify-center">
                  <Logo asIcon width={16} />
                </div>
                <ArrowLeftRight size={8} />
                <div className="w-[42px] h-[42px] border rounded-full flex items-center justify-center">
                  <ProviderIcon providerName={provider?.name ?? integration.kind ?? integration.name} className="h-6 w-6 object-contain" />
                </div>
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-center self-center">
                <span className="truncate">{displayName}</span>
              </div>
            </div>

            <div className="mt-2 flex min-h-[22px]">
              <Badge variant={healthStatus.variant} title={healthStatus.summary}>
                {healthStatus.label}
              </Badge>
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
          <div className="w-full">
            <p className="line-clamp-3 text-sm text-muted-foreground">{description}</p>
            {(integration.createdBy || integration.createdAt) && (
              <p className="mt-2 text-xs text-muted-foreground line-clamp-1">
                Configured
                {integration.createdBy ? ` by ${integration.createdBy}` : ''}
                {integration.createdAt ? ` on ${formatDate(integration.createdAt)}` : ''}
              </p>
            )}
            {healthStatus.summary ? <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{healthStatus.summary}</p> : null}
          </div>
        </CardContent>

        <CardFooter className="mt-auto gap-2 pt-0">
          <Button className="w-full" disabled>
            Installed
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="-mr-2" variant="secondary">
                <MoreHorizontal className="h-4 w-4 text-brand" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setConfirmOpen(true)}>Disconnect</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDisconnect}
        title={`Disconnect ${displayName}?`}
        description={`This will disconnect ${displayName}. You can reconnect it later if needed.`}
        confirmationText="Disconnect"
        confirmationTextVariant="destructive"
      />
    </>
  )
}

export default InstalledIntegrationCard

function getHealthStatus(
  supportsHealth: boolean,
  isLoading: boolean,
  isError: boolean,
  data?: HealthResponse,
): {
  label: string
  summary?: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
} {
  if (!supportsHealth) {
    return { label: 'No Health Check', variant: 'outline' }
  }

  if (isLoading) {
    return { label: 'Checking Health', variant: 'secondary' }
  }

  if (isError) {
    return { label: 'Needs Attention', summary: 'Health check failed.', variant: 'destructive' }
  }

  const status = (data?.status ?? '').toLowerCase()
  if (status === 'ok') {
    return { label: 'Healthy', summary: data?.summary, variant: 'default' }
  }

  return { label: 'Needs Attention', summary: data?.summary || 'Health check did not report a successful state.', variant: 'destructive' }
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string; details?: string; message?: string }
    return payload.error || payload.details || payload.message || `Request failed (${response.status})`
  } catch {
    const text = await response.text().catch(() => '')
    return text || `Request failed (${response.status})`
  }
}
