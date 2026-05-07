'use client'

import React, { use, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { Card } from '@repo/ui/cardpanel'
import { PageHeading } from '@repo/ui/page-heading'
import { useGetIntegrations } from '@/lib/graphql-hooks/integration'
import { useUpdateEntity } from '@/lib/graphql-hooks/entity'
import { useIntegrationProviders } from '@/lib/query-hooks/integrations'
import { useNotification } from '@/hooks/useNotification'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { Loading } from '@/components/shared/loading/loading'
import { Button } from '@repo/ui/button'
import { filterFinalizedIntegrationsForProvider, HEALTH_CHECK_OPERATION_NAME, resolveSchemaRoot } from '@/lib/integrations/utils'
import { writePendingVendorIntegrationLink, clearPendingVendorIntegrationLink } from '@/lib/integrations/pending-vendor-link'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { CREDENTIALS_PREFIX, USER_INPUT_PREFIX, useIntegrationSchemaForm } from './schema-form'
import InstalledIntegrationCard from './installed-integration-card'
import IntegrationCardIcons from './integration-card-icons'
import IntegrationTagList from './integration-tag-list'
import OperationsTable from './operations-table'
import WebhookDetailsSection from './webhook-details-section'
import CredentialConnectionSection from './credential-connection-section'
import { useInstallationPolling } from './use-installation-polling'
import { useIntegrationConnect } from './use-integration-connect'

type IntegrationDefinitionPageProps = {
  definitionId: string
}

const IntegrationDefinitionPage = ({ definitionId }: IntegrationDefinitionPageProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const vendorId = searchParams.get('vendorId') ?? undefined
  const { data, isLoading: integrationsLoading } = useGetIntegrations({ where: {} })
  const { data: providersData, isLoading: providersLoading } = useIntegrationProviders()
  const { setCrumbs } = use(BreadcrumbContext)
  const { mutateAsync: updateEntity } = useUpdateEntity()
  const { successNotification, errorNotification } = useNotification()

  const { startPolling } = useInstallationPolling()

  const providers = useMemo(() => providersData?.providers ?? [], [providersData?.providers])

  const provider = useMemo(() => providers.find((p) => p.id === definitionId), [providers, definitionId])

  const installedInstances = useMemo(() => {
    if (!provider) {
      return []
    }

    const integrations = (data?.integrations?.edges ?? []).flatMap((edge) => (edge?.node ? [edge.node] : []))

    return filterFinalizedIntegrationsForProvider(integrations, provider)
  }, [data?.integrations?.edges, provider])

  const visibleOperations = useMemo(() => (provider?.operations ?? []).filter((op) => op.name !== HEALTH_CHECK_OPERATION_NAME), [provider?.operations])

  const credentialEntries = useMemo(() => provider?.credentialSchemas ?? [], [provider?.credentialSchemas])
  const [selectedCredentialIndex, setSelectedCredentialIndex] = useState(-1)
  // Tracks which schema to use — only updates when a credential is actively selected, not when the accordion closes
  const [schemaCredentialIndex, setSchemaCredentialIndex] = useState(-1)

  useEffect(() => {
    if (credentialEntries.length === 1 && installedInstances.length === 0) {
      setSelectedCredentialIndex(0)
      setSchemaCredentialIndex(0)
    }
  }, [credentialEntries.length, installedInstances.length])

  const handleSelectCredential = (index: number) => {
    setSelectedCredentialIndex(index)
    if (index >= 0) {
      setSchemaCredentialIndex(index)
    }
  }

  const selectedCredential = credentialEntries[schemaCredentialIndex]
  const credentialSchema = useMemo(() => resolveSchemaRoot(selectedCredential?.schema), [selectedCredential?.schema])
  const userInputSchema = useMemo(() => resolveSchemaRoot(provider?.userInputSchema), [provider?.userInputSchema])
  const { formMethods, initialValues, sections } = useIntegrationSchemaForm({
    credentialSchema,
    userInputSchema,
  })

  const credentialSections = useMemo(() => sections.filter((s) => s.prefix === CREDENTIALS_PREFIX), [sections])
  const userInputSections = useMemo(() => sections.filter((s) => s.prefix === USER_INPUT_PREFIX), [sections])

  const {
    reset,
    formState: { isSubmitting },
  } = formMethods

  const handleConnectSuccess = useCallback(
    async ({ integrationId }: { integrationId?: string }) => {
      setSelectedCredentialIndex(-1)
      if (!vendorId || !integrationId) {
        return
      }
      try {
        await updateEntity({
          updateEntityId: vendorId,
          input: { addIntegrationIDs: [integrationId] },
        })
        clearPendingVendorIntegrationLink()
        successNotification({
          title: 'Integration linked to vendor',
          description: 'The new integration has been attached to the vendor record.',
        })
        router.push(`/registry/vendors/${vendorId}`)
      } catch (error) {
        errorNotification({
          title: 'Integration created but failed to link to vendor',
          description: parseErrorMessage(error),
        })
      }
    },
    [vendorId, updateEntity, successNotification, errorNotification, router],
  )

  const handleConnectRedirect = useCallback(() => {
    if (!provider) {
      return
    }
    if (vendorId) {
      writePendingVendorIntegrationLink(vendorId, provider.id)
    }
    startPolling(provider, installedInstances.length)
  }, [provider, vendorId, startPolling, installedInstances.length])

  const { isConnecting, webhookDetails, dismissWebhookDetails, handleAuthConnect, handleSubmit } = useIntegrationConnect({
    provider,
    credentialSchema,
    userInputSchema,
    credentialRef: selectedCredential?.ref,
    initialValues,
    reset,
    onSuccess: handleConnectSuccess,
    onRedirect: handleConnectRedirect,
  })

  useEffect(() => {
    if (!provider) {
      return
    }

    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Organization Settings', href: '/organization-settings/general-settings' },
      { label: 'Integrations', href: '/organization-settings/integrations' },
      { label: provider.displayName, href: `/organization-settings/integrations/${definitionId}` },
    ])
  }, [provider, definitionId, setCrumbs])

  if (integrationsLoading || providersLoading) {
    return <Loading />
  }

  if (!provider) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p>Integration not found.</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push('/organization-settings/integrations')}>
          Back to Integrations
        </Button>
      </div>
    )
  }

  return (
    <div>
      <button className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" onClick={() => router.push('/organization-settings/integrations')}>
        <ArrowLeft className="h-4 w-4" />
        Integrations
      </button>

      {/* Header */}
      <Card className="mb-8 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            {provider.category ? <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">{provider.category}</p> : null}
            <div className="flex items-center gap-3">
              <IntegrationCardIcons providerName={provider.slug} logoUrl={provider.logoUrl} />
              <PageHeading heading={provider.displayName} />
            </div>
            {provider.description ? <p className="mt-2 text-sm text-muted-foreground">{provider.description}</p> : null}
            {provider.docsUrl ? (
              <a href={provider.docsUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-brand hover:underline">
                Documentation <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          </div>
          {provider.tags?.length ? (
            <div className="shrink-0">
              <IntegrationTagList tags={provider.tags} />
            </div>
          ) : null}
        </div>
      </Card>

      {/* Installed Instances */}
      {installedInstances.length > 0 ? (
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-base uppercase tracking-widest">Installed Instances</h3>
            <Badge variant="outline" className="text-[10px]">
              {installedInstances.length}
            </Badge>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {installedInstances.map((inst) => (
              <InstalledIntegrationCard key={inst.id} integration={inst} providers={providers} />
            ))}
          </div>
        </section>
      ) : null}

      <OperationsTable operations={visibleOperations} />

      {webhookDetails ? <WebhookDetailsSection details={webhookDetails} onDismiss={dismissWebhookDetails} /> : null}

      <CredentialConnectionSection
        provider={provider}
        installedCount={installedInstances.length}
        isConnecting={isConnecting}
        onAuthConnect={handleAuthConnect}
        onSubmit={handleSubmit}
        formMethods={formMethods}
        credentialSections={credentialSections}
        userInputSections={userInputSections}
        isSubmitting={isSubmitting}
        selectedCredentialIndex={selectedCredentialIndex}
        onSelectCredential={handleSelectCredential}
      />
    </div>
  )
}

export default IntegrationDefinitionPage
