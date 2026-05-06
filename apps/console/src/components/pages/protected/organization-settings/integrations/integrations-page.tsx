'use client'
import { PageHeading } from '@repo/ui/page-heading'
import React, { use, useEffect, useMemo, useRef, useState } from 'react'
import IntegrationsToolbar from './integrations-toolbar'
import { useGetIntegrations } from '@/lib/graphql-hooks/integration'
import { useUpdateEntity } from '@/lib/graphql-hooks/entity'
import { IntegrationsGrid } from './integrations-grid'
import { type IntegrationTab } from '@/lib/integrations/types'
import { integrationDefinitionID, isFinalizedIntegration, installedIntegrationDisplayName, latestFinalizedIntegrationForProvider, toAvailableIntegration } from '@/lib/integrations/utils'
import { readPendingVendorIntegrationLink, clearPendingVendorIntegrationLink } from '@/lib/integrations/pending-vendor-link'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useNotification } from '@/hooks/useNotification'
import { useRouter, useSearchParams } from 'next/navigation'
import { canEdit } from '@/lib/authz/utils'
import ProtectedArea from '@/components/shared/protected-area/protected-area'
import { Loading } from '@/components/shared/loading/loading'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { useIntegrationProviders } from '@/lib/query-hooks/integrations'
import { useQueryClient } from '@tanstack/react-query'

const IntegrationsPage = () => {
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<IntegrationTab>(() => (searchParams.get('status') === 'success' ? 'Installed' : 'All'))
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const { data, isLoading: integrationsLoading } = useGetIntegrations({ where: {} })
  const { data: providersData, isLoading: providersLoading } = useIntegrationProviders()
  const { setCrumbs } = use(BreadcrumbContext)

  const { data: orgPermission, isLoading } = useOrganizationRoles()
  const editAllowed = canEdit(orgPermission?.roles)

  const { successNotification, errorNotification } = useNotification()
  const router = useRouter()
  const { mutateAsync: updateEntity } = useUpdateEntity()

  const handledRef = useRef(false)
  const pendingLinkRef = useRef(readPendingVendorIntegrationLink())
  const linkAttemptedRef = useRef(false)

  useEffect(() => {
    const provider = searchParams.get('provider')
    const status = searchParams.get('status')
    const message = searchParams.get('message')
    if (handledRef.current || !status) return

    handledRef.current = true

    queryClient.invalidateQueries({ queryKey: ['integrations'] })

    if (status === 'success') {
      successNotification({ title: 'Integration Connected', description: message ?? (provider ? `Successfully connected ${provider}` : 'Successfully connected integration') })
    } else {
      errorNotification({ title: 'Integration Failed', description: message ?? (provider ? `Failed to connect ${provider}` : 'Failed to connect integration') })
      clearPendingVendorIntegrationLink()
      pendingLinkRef.current = null
    }

    router.replace('/organization-settings/integrations')
  }, [queryClient, successNotification, errorNotification, router, searchParams])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Organization Settings', href: '/organization-settings/general-settings' },
      { label: 'Integrations', href: '/organization-settings/integrations' },
    ])
  }, [setCrumbs])

  const providers = useMemo(() => providersData?.providers ?? [], [providersData?.providers])

  const integrationRows = useMemo(() => (data?.integrations?.edges ?? []).flatMap((edge) => (edge?.node ? [edge.node] : [])), [data?.integrations?.edges])

  useEffect(() => {
    if (linkAttemptedRef.current) return
    if (!handledRef.current) return
    const stash = pendingLinkRef.current
    if (!stash) return
    if (providers.length === 0 || integrationRows.length === 0) return

    const matchingProvider = providers.find((p) => p.id === stash.providerId)
    if (!matchingProvider) return

    const justCreated = latestFinalizedIntegrationForProvider(integrationRows, matchingProvider)
    if (!justCreated) return

    const createdAtMs = Date.parse(justCreated.createdAt ?? '')
    if (!Number.isFinite(createdAtMs) || createdAtMs < stash.startedAt) return

    linkAttemptedRef.current = true

    const linkToVendor = async () => {
      try {
        await updateEntity({
          updateEntityId: stash.vendorId,
          input: { addIntegrationIDs: [justCreated.id] },
        })
        clearPendingVendorIntegrationLink()
        pendingLinkRef.current = null
        successNotification({
          title: 'Integration linked to vendor',
          description: 'The new integration has been attached to the vendor record.',
        })
        router.push(`/registry/vendors/${stash.vendorId}`)
      } catch (error) {
        clearPendingVendorIntegrationLink()
        pendingLinkRef.current = null
        errorNotification({
          title: 'Integration created but failed to link to vendor',
          description: parseErrorMessage(error),
        })
      }
    }
    void linkToVendor()
  }, [providers, integrationRows, updateEntity, successNotification, errorNotification, router])

  const installedIntegrations = useMemo(
    () =>
      integrationRows
        .filter((integration) => isFinalizedIntegration(integration))
        .sort((a, b) => installedIntegrationDisplayName(a, providers).localeCompare(installedIntegrationDisplayName(b, providers), undefined, { sensitivity: 'base' })),
    [integrationRows, providers],
  )

  const installedProviderCounts = useMemo(() => {
    const counts = new Map<string, number>()

    for (const integration of installedIntegrations) {
      const definitionId = integrationDefinitionID(integration, providers)
      if (!definitionId) {
        continue
      }

      counts.set(definitionId, (counts.get(definitionId) ?? 0) + 1)
    }

    return counts
  }, [installedIntegrations, providers])

  const availableIntegrations = useMemo(
    () =>
      providers
        .filter((p) => p.visible !== false)
        .map((provider) => ({
          ...toAvailableIntegration(provider),
          installedCount: installedProviderCounts.get(provider.id) ?? 0,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    [providers, installedProviderCounts],
  )

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    for (const integration of availableIntegrations) {
      for (const tag of integration.tags) {
        tags.add(tag)
      }
    }
    return Array.from(tags).sort()
  }, [availableIntegrations])

  const { allCount, comingSoonCount } = useMemo(() => {
    const active = availableIntegrations.filter((ai) => ai.provider.active).length
    const upcoming = availableIntegrations.filter((ai) => !ai.provider.active).length
    return { allCount: active, comingSoonCount: upcoming }
  }, [availableIntegrations])

  const installedCount = installedIntegrations.length

  if (isLoading || integrationsLoading || providersLoading) {
    return <Loading />
  }
  return (
    <div>
      <PageHeading heading="Integrations" />
      {!editAllowed ? (
        <ProtectedArea />
      ) : (
        <>
          <IntegrationsToolbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            allCount={allCount}
            comingSoonCount={comingSoonCount}
            installedCount={installedCount}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            allTags={allTags}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
          />
          <IntegrationsGrid
            installedIntegrations={installedIntegrations}
            availableIntegrations={availableIntegrations}
            activeTab={activeTab}
            providers={providers}
            searchQuery={searchQuery}
            selectedTags={selectedTags}
          />
        </>
      )}
    </div>
  )
}

export default IntegrationsPage
