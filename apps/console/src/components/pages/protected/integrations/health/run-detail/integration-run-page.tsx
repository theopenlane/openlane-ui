'use client'

import React, { use, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { PageHeading } from '@repo/ui/page-heading'
import { IntegrationRunIntegrationRunStatus, type IntegrationRunWhereInput } from '@repo/codegen/src/schema'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import CopyableText from '@/components/shared/copyable-text/copyable-text'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { useIntegrationHealthCheck } from '@/lib/query-hooks/integrations'
import { useIntegrationRun, useIntegrationRunSummaries } from '@/lib/graphql-hooks/integration-run'
import { integrationDefinitionHref, integrationHealthHref, integrationRunHref, readRunMetrics, readRunRecordFailures, runDurationMs, runOutcome, runTypeLabel } from '@/lib/integrations/run-health'
import { formatDateTime, formatDurationMs } from '@/utils/date'
import IntegrationDefinitionSkeleton from '../../integration-definition-skeleton'
import IntegrationNotFound from '../../integration-not-found'
import { integrationInstanceLabel, useProviderInstallations } from '../../use-provider-installations'
import { HealthCheckButton } from '../health-controls'
import { StatTile } from '../health-stat-tiles'
import { RunStatusBadge } from '../run-status-badge'
import RecentOperationRuns from './recent-operation-runs'
import RunErrorPanel from './run-error-panel'
import RunFailedRecords from './run-failed-records'
import RunMetricsBar from './run-metrics-bar'
import RunRecords from './run-records'

const shortRunId = (runId: string): string => (runId.length > 12 ? `${runId.slice(0, 6)}…${runId.slice(-4)}` : runId)

const IntegrationRunPage = ({ definitionId, runId }: { definitionId: string; runId: string }) => {
  const { setCrumbs } = use(BreadcrumbContext)
  const { provider, installations, canManage, isLoading, isError: installationsError } = useProviderInstallations(definitionId)
  const { run, isPending: runPending, error: runError } = useIntegrationRun(runId)
  const { mutate: runHealthCheck, isPending: isChecking } = useIntegrationHealthCheck()

  useQueryErrorNotification({ error: runError, description: 'Failed to load run' })

  const isFailed = !!run && runOutcome(run) === 'failed'
  const canFindLastSuccess = isFailed && !!run.integrationID && !!run.operationName

  const lastSuccessWhere = useMemo<IntegrationRunWhereInput>(
    () => ({ integrationID: run?.integrationID, operationName: run?.operationName, status: IntegrationRunIntegrationRunStatus.SUCCESS, startedAtLT: run?.startedAt }),
    [run?.integrationID, run?.operationName, run?.startedAt],
  )
  const { runs: lastSuccessRuns } = useIntegrationRunSummaries({ where: lastSuccessWhere, first: 1, enabled: canFindLastSuccess })

  const providerName = provider?.displayName
  const healthHref = integrationHealthHref(definitionId)

  useEffect(() => {
    if (!providerName) return

    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Automation', href: '/automation' },
      { label: 'Integrations', href: '/automation/integrations' },
      { label: providerName, href: integrationDefinitionHref(definitionId) },
      { label: 'Health', href: healthHref },
      { label: `Run ${shortRunId(runId)}`, href: integrationRunHref(definitionId, runId) },
    ])
  }, [providerName, definitionId, healthHref, runId, setCrumbs])

  if (isLoading || runPending) {
    return <IntegrationDefinitionSkeleton />
  }

  if (installationsError) {
    return <IntegrationNotFound message="Could not load this integration. Please try again later." />
  }

  if (!provider) {
    return <IntegrationNotFound message="Integration not found." />
  }

  const backToHealth = { backHref: healthHref, backLabel: `Back to ${provider.displayName} health` }

  if (runError) {
    return <IntegrationNotFound message="Could not load this run. Please try again later." {...backToHealth} />
  }

  const installation = installations.find((candidate) => candidate.id === run?.integrationID)

  if (!run || !installation) {
    return <IntegrationNotFound message="Run not found." {...backToHealth} />
  }

  const metrics = isFailed ? undefined : readRunMetrics(run.metrics)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button asChild variant="secondary" className="mb-6" icon={<ArrowLeft size={16} />} iconPosition="left">
          <Link href={healthHref}>Back to {provider.displayName} health</Link>
        </Button>
        <Card className="flex flex-col gap-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <PageHeading heading={run.operationName || 'Run'} />
                <RunStatusBadge run={run} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {[integrationInstanceLabel(installation), run.operationKind ? getEnumLabel(run.operationKind) : '', `${runTypeLabel(run.runType)} run`].filter(Boolean).join(' · ')}
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Run ID</span>
                <CopyableText value={run.id} variant="inline" aria-label="Copy run ID" className="font-mono" />
              </div>
            </div>
            {canManage ? <HealthCheckButton onClick={() => runHealthCheck(installation.id)} isChecking={isChecking} /> : null}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Queued" value={formatDateTime(run.createdAt)} valueClassName="text-base" />
            <StatTile label="Started" value={formatDateTime(run.startedAt)} valueClassName="text-base" />
            <StatTile label="Finished" value={formatDateTime(run.finishedAt)} valueClassName="text-base" />
            <StatTile label="Duration" value={formatDurationMs(runDurationMs(run))} valueClassName="text-base" />
          </div>
          {metrics ? (
            <div className="border-t pt-4">
              <RunMetricsBar metrics={metrics} />
            </div>
          ) : null}
        </Card>
      </div>

      <RunErrorPanel run={run} />

      <RunFailedRecords failures={readRunRecordFailures(run.metrics)} />

      <RunRecords run={run} providerId={provider.id} isFailed={isFailed} lastSuccess={lastSuccessRuns[0]} />

      {run.integrationID && run.operationName ? <RecentOperationRuns integrationId={run.integrationID} operationName={run.operationName} currentRunId={run.id} providerId={provider.id} /> : null}
    </div>
  )
}

export default IntegrationRunPage
