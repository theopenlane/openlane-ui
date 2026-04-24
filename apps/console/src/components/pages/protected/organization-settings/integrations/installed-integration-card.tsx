'use client'

import React, { useState } from 'react'
import { Activity, Settings, UserIcon } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { Card } from '@repo/ui/cardpanel'
import { Separator } from '@repo/ui/separator'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { type IntegrationConfigValue, type IntegrationMetadata, type IntegrationNode, type IntegrationProvider } from '@/lib/integrations/types'
import { getInstalledIntegrationConfig, installedIntegrationDisplayName, providerSupportsHealth, resolveCredentialEntry } from '@/lib/integrations/utils'
import { providerHasUserInputSchema } from '@/lib/integrations/flow'
import { useDisconnectIntegration, useIntegrationHealth } from '@/lib/query-hooks/integrations'
import { useGetOrgUserList } from '@/lib/graphql-hooks/member'
import { Avatar } from '@/components/shared/avatar/avatar'
import { formatDate, formatTimeSince } from '@/utils/date'
import IntegrationCardIcons from './integration-card-icons'
import IntegrationConfigurationDialog from './integration-configuration-dialog'

type InstalledIntegrationCardProps = {
  integration: IntegrationNode
  providers: IntegrationProvider[]
}

const InstalledIntegrationCard = ({ integration, providers }: InstalledIntegrationCardProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)

  const displayName = installedIntegrationDisplayName(integration, providers)
  const integrationConfig = getInstalledIntegrationConfig(integration, providers)
  const provider = integrationConfig?.provider
  const supportsHealth = providerSupportsHealth(provider)
  const hasUserInput = providerHasUserInputSchema(provider)

  // The GraphQL query requests `metadata` but codegen maps it to `providerMetadataSnapshot`.
  // At runtime the response key is `metadata`. A single cast bridges the mismatch until
  // codegen is regenerated.
  const meta = ((integration as Record<string, unknown>).metadata ?? undefined) as IntegrationMetadata | undefined
  const existingConfig = (integration as Record<string, unknown>).config as IntegrationConfigValue | undefined
  const externalName = meta?.externalName ?? ''
  const externalId = meta?.externalId ?? ''
  const credentialRefName = meta?.credentialRef ?? ''
  const lastHealthCheck = meta?.lastSuccessfulHealthCheck ?? ''
  const credentialEntry = resolveCredentialEntry(provider, credentialRefName)

  const disconnectMutation = useDisconnectIntegration()
  const healthQuery = useIntegrationHealth(integration.id, supportsHealth)
  const healthStatus = resolveHealthStatus(healthQuery.isPending, healthQuery.isError, healthQuery.data)

  const userIds = integration.createdBy ? [integration.createdBy] : []
  const { users } = useGetOrgUserList({ where: { hasUserWith: [{ idIn: userIds }] } })
  const createdByUser = users?.find((u) => u.id === integration.createdBy)

  const handleDisconnect = () => {
    setConfirmOpen(false)
    disconnectMutation.mutate(integration.id)
  }

  return (
    <>
      <Card className="p-6 gap-4 flex flex-col">
        {/* Header row: icon + name + health badge */}
        <div className="flex justify-between items-center">
          <div className="font-medium flex items-center gap-3">
            <IntegrationCardIcons providerName={provider?.slug ?? integration.definitionSlug ?? integration.kind ?? integration.name} logoUrl={provider?.logoUrl} />
            {displayName}
          </div>
          <div className="flex items-center gap-2">
            {integration.primaryDirectory ? <Badge variant="blue">Primary Directory</Badge> : null}
            <Badge variant={healthStatus.variant} title={healthStatus.summary}>
              {healthStatus.label}
            </Badge>
          </div>
        </div>

        {/* Installed to + last health check */}
        <div className="flex flex-col gap-1">
          {externalName || externalId ? (
            <p className="text-sm text-muted-foreground">
              Installed to: {externalName}
              {externalId ? ` (${externalId})` : ''}
            </p>
          ) : null}
          {lastHealthCheck ? <p className="text-xs text-muted-foreground">Last health check: {formatTimeSince(lastHealthCheck)}</p> : null}
        </div>

        {/* Metrics row */}
        <div className="flex items-center">
          <div className="flex flex-col text-sm">
            <span className="text-muted-foreground text-xs">CREDENTIAL</span>
            <span>{credentialEntry?.name ?? '—'}</span>
          </div>
          <Separator vertical className="mx-4 w-fit" separatorClass="h-10" />
          <div className="flex flex-col text-sm">
            <span className="text-muted-foreground text-xs">INSTALLED BY</span>
            <div className="flex gap-2 items-center">
              {createdByUser ? (
                <>
                  <Avatar entity={createdByUser} variant="small" />
                  <span>{createdByUser.displayName ?? 'Unknown'}</span>
                </>
              ) : integration.createdBy ? (
                <>
                  <UserIcon className="size-4 text-muted-foreground" />
                  <span>Unknown</span>
                </>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>
          <Separator vertical className="mx-4 w-fit" separatorClass="h-10" />
          <div className="flex flex-col text-sm">
            <span className="text-muted-foreground text-xs">INSTALLED ON</span>
            <span>{integration.createdAt ? formatDate(integration.createdAt) : '—'}</span>
          </div>
        </div>

        {/* Stacked action buttons */}
        <div className="flex flex-col gap-2">
          <Button variant="secondary" icon={<Activity className="size-4" />} iconPosition="left" onClick={() => healthQuery.refetch()} disabled={healthQuery.isFetching}>
            {healthQuery.isFetching ? 'Checking...' : 'Health Check'}
          </Button>
          {hasUserInput ? (
            <Button variant="secondary" icon={<Settings className="size-4" />} iconPosition="left" onClick={() => setConfigOpen(true)}>
              Configure
            </Button>
          ) : null}
          <Button variant="secondary" onClick={() => setConfirmOpen(true)} disabled={disconnectMutation.isPending}>
            {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
          </Button>
        </div>
      </Card>

      <IntegrationConfigurationDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        provider={provider}
        installationId={integration.id}
        credentialRef={credentialRefName || undefined}
        existingUserInput={existingConfig?.clientConfig}
      />

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

function resolveHealthStatus(
  isLoading: boolean,
  isError: boolean,
  data?: { status?: string; summary?: string },
): {
  label: string
  summary?: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'green'
} {
  if (isLoading) {
    return { label: 'Checking', variant: 'secondary' }
  }

  if (isError) {
    return { label: 'Needs Attention', summary: 'Health check failed.', variant: 'destructive' }
  }

  switch ((data?.status ?? '').toLowerCase()) {
    case 'ok':
      return { label: 'Healthy', summary: data?.summary, variant: 'green' }
    default:
      return { label: 'Unknown', variant: 'outline' }
  }
}
