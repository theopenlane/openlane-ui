'use client'

import React, { use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { PageHeading } from '@repo/ui/page-heading'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { useIntegrationHealthCheck } from '@/lib/query-hooks/integrations'
import { useIntegrationRunStats } from '@/lib/graphql-hooks/integration-run'
import { providerHasInstallationSettings } from '@/lib/integrations/flow'
import { integrationDefinitionHref, integrationHealthHref } from '@/lib/integrations/run-health'
import { MS_PER_DAY, hourStartIso } from '@/utils/date'
import { pluralizeWithCount } from '@/utils/strings'
import IntegrationCardIcons from '../integration-card-icons'
import IntegrationConfigurationDialog from '../integration-configuration-dialog'
import IntegrationDefinitionSkeleton from '../integration-definition-skeleton'
import IntegrationNotFound from '../integration-not-found'
import { ConfigureButton, HealthCheckButton } from './health-controls'
import HealthStatTiles from './health-stat-tiles'
import NeedsAttentionPanel from './needs-attention-panel'
import { InstanceHealthCard, OperationHealthGrid } from './operation-health-cards'
import RunHistoryTable from './run-history-table'
import { useIntegrationHealth } from './use-integration-health'

const RUN_STATS_WINDOW_DAYS = 30

const statsWindowStart = (): string => hourStartIso(Date.now() - RUN_STATS_WINDOW_DAYS * MS_PER_DAY) // 30 days

const IntegrationHealthPage = ({ definitionId }: { definitionId: string }) => {
  const { setCrumbs } = use(BreadcrumbContext)
  const { provider, installations, instances, overall, canEdit, isLoading, isError, isLoadingRuns, runsError } = useIntegrationHealth(definitionId)

  useQueryErrorNotification({ error: runsError, description: 'Failed to load recent runs' })
  const integrationIds = useMemo(() => installations.map((integration) => integration.id), [installations])
  const [since] = useState(statsWindowStart)
  const { total, failed, lastSuccess, isPending: statsPending, error: statsError } = useIntegrationRunStats({ integrationIds, since })
  const checkAllInFlightRef = useRef(false)
  const [isCheckingAll, setIsCheckingAll] = useState(false)

  useQueryErrorNotification({ error: statsError, description: 'Failed to load run statistics' })
  const { mutate: runHealthCheck, mutateAsync: runHealthCheckAsync, isPending: isChecking, variables: checkingVariables } = useIntegrationHealthCheck()
  const [configureIntegrationId, setConfigureIntegrationId] = useState<string | null>(null)
  const [isConfigureOpen, setIsConfigureOpen] = useState(false)

  const openConfigure = useCallback((integrationId: string) => {
    setConfigureIntegrationId(integrationId)
    setIsConfigureOpen(true)
  }, [])

  const providerName = provider?.displayName

  useEffect(() => {
    if (!providerName) return

    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Automation', href: '/automation' },
      { label: 'Integrations', href: '/automation/integrations' },
      { label: providerName, href: integrationDefinitionHref(definitionId) },
      { label: 'Health', href: integrationHealthHref(definitionId) },
    ])
  }, [providerName, definitionId, setCrumbs])

  const instanceLabels = useMemo(() => new Map(instances.map((instance) => [instance.integration.id, instance.label])), [instances])
  const operationNames = useMemo(() => (provider?.operations ?? []).map((operation) => operation.name), [provider?.operations])

  const handleCheckAll = useCallback(async () => {
    if (checkAllInFlightRef.current) return

    checkAllInFlightRef.current = true
    setIsCheckingAll(true)

    try {
      for (const integrationId of integrationIds) {
        await runHealthCheckAsync(integrationId).catch(() => undefined)
      }
    } finally {
      checkAllInFlightRef.current = false
      setIsCheckingAll(false)
    }
  }, [integrationIds, runHealthCheckAsync])

  if (isLoading) {
    return <IntegrationDefinitionSkeleton />
  }

  if (isError) {
    return <IntegrationNotFound message="Could not load this integration. Please try again later." />
  }

  if (!provider) {
    return <IntegrationNotFound message="Integration not found." />
  }

  if (!overall) {
    return (
      <IntegrationNotFound
        message={`${provider.displayName} is not installed, so there is no health to show yet.`}
        backHref={integrationDefinitionHref(definitionId)}
        backLabel={`Back to ${provider.displayName}`}
      />
    )
  }

  const isMultiInstance = instances.length > 1
  const primary = instances[0]
  const canConfigure = canEdit && providerHasInstallationSettings(provider)
  const configureIntegration = installations.find((integration) => integration.id === configureIntegrationId)
  const checkingIntegrationId = isChecking ? checkingVariables : undefined

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button asChild variant="secondary" className="mb-6" icon={<ArrowLeft size={16} />} iconPosition="left">
          <Link href={integrationDefinitionHref(definitionId)}>Back to {provider.displayName}</Link>
        </Button>
        <Card className="flex flex-col gap-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <IntegrationCardIcons providerName={provider.displayName} logoUrl={provider.logoUrl} />
                <PageHeading heading={`${provider.displayName} health`} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {isMultiInstance ? pluralizeWithCount(instances.length, 'instance') : [primary.label, primary.secondaryId].filter(Boolean).join(' · ')}
              </p>
            </div>
            {canEdit ? (
              <div className="flex flex-wrap items-center gap-2">
                {isMultiInstance ? (
                  <HealthCheckButton onClick={handleCheckAll} isChecking={isCheckingAll || isChecking} label="Check All Instances" />
                ) : (
                  <>
                    <HealthCheckButton onClick={() => runHealthCheck(primary.integration.id)} isChecking={isChecking} />
                    {canConfigure ? <ConfigureButton onClick={() => openConfigure(primary.integration.id)} /> : null}
                  </>
                )}
              </div>
            ) : null}
          </div>
          <HealthStatTiles
            instances={instances}
            overall={overall}
            windowDays={RUN_STATS_WINDOW_DAYS}
            totalRuns={total}
            failedRuns={failed}
            lastSuccess={lastSuccess}
            isLoadingStats={statsPending}
            isLoadingRuns={isLoadingRuns}
          />
        </Card>
      </div>

      {isLoadingRuns ? null : <NeedsAttentionPanel instances={instances} providerId={provider.id} canConfigure={canConfigure} onConfigure={openConfigure} />}

      {isMultiInstance ? (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-base uppercase tracking-widest">Installed Instances</h3>
            <Badge variant="outline" className="text-[10px]">
              {instances.length}
            </Badge>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {instances.map((instance) => (
              <InstanceHealthCard
                key={instance.integration.id}
                instance={instance}
                providerId={provider.id}
                isLoading={isLoadingRuns}
                canEdit={canEdit}
                canConfigure={canConfigure}
                checkingIntegrationId={checkingIntegrationId}
                isCheckDisabled={isCheckingAll || isChecking}
                onHealthCheck={runHealthCheck}
                onConfigure={openConfigure}
              />
            ))}
          </div>
        </section>
      ) : (
        <section>
          <h3 className="mb-3 text-base uppercase tracking-widest">Operations</h3>
          <OperationHealthGrid operations={primary.operations} providerId={provider.id} isLoading={isLoadingRuns} />
        </section>
      )}

      <RunHistoryTable providerId={provider.id} integrationIds={integrationIds} instanceLabels={instanceLabels} operationNames={operationNames} canEdit={canEdit} onHealthCheck={runHealthCheck} />

      {canConfigure && configureIntegration ? (
        <IntegrationConfigurationDialog
          open={isConfigureOpen}
          onOpenChange={setIsConfigureOpen}
          provider={provider}
          installationId={configureIntegration.id}
          credentialRef={configureIntegration.metadata?.credentialRef || undefined}
          config={configureIntegration.config ?? undefined}
          storedOperationSchemas={configureIntegration.operationConfig ?? undefined}
          credentials={configureIntegration.credentials ?? undefined}
        />
      ) : null}
    </div>
  )
}

export default IntegrationHealthPage
