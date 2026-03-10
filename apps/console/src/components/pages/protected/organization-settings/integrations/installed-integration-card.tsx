'use client'

import React, { useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@repo/ui/cardpanel'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import {
  getInstalledIntegrationConfig,
  HEALTH_CHECK_STALE_TIME_MS,
  installedIntegrationDisplayName,
  type IntegrationNode,
  type IntegrationProvider,
  parseIntegrationErrorMessage,
  providerSupportsHealth,
} from './config'
import { useDisconnectIntegration } from '@/lib/graphql-hooks/integration'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useQuery } from '@tanstack/react-query'
import { formatDate } from '@/utils/date'
import IntegrationTagList from './integration-tag-list'
import IntegrationCardIcons from './integration-card-icons'
import DocsLinkTooltip from './docs-link-tooltip'

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

  const healthQuery = useQuery<HealthResponse>({
    queryKey: ['integrationHealth', provider?.name],
    queryFn: async () => {
      if (!provider) {
        return {}
      }

      const res = await fetch(`/api/integrations/health?provider=${encodeURIComponent(provider.name)}`)
      if (!res.ok) {
        throw new Error(await parseIntegrationErrorMessage(res))
      }
      return (await res.json()) as HealthResponse
    },
    enabled: Boolean(provider?.name && supportsHealth),
    staleTime: HEALTH_CHECK_STALE_TIME_MS,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const healthStatus = getHealthStatus(supportsHealth, healthQuery.isPending, healthQuery.isError, healthQuery.data)

  return (
    <>
      <Card className="relative flex h-full min-h-[300px] flex-col overflow-visible transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:-translate-y-1">
        <CardHeader className="relative flex-row items-start gap-3 space-y-0 pb-3">
          {integrationConfig?.docsUrl ? <DocsLinkTooltip href={integrationConfig.docsUrl} label={displayName} /> : null}

          <div className="w-full">
            <div className="flex gap-4">
              <IntegrationCardIcons providerName={provider?.name ?? integration.kind ?? integration.name} />

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
              <IntegrationTagList tags={tags ?? []} />
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
