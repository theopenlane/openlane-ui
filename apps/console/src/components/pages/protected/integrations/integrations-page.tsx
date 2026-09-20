'use client'
import { PageHeading } from '@repo/ui/page-heading'
import { Tabs, TabsContent } from '@repo/ui/tabs'
import React, { use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import IntegrationsToolbar from './integrations-toolbar'
import { useGetIntegrations } from '@/lib/graphql-hooks/integration'
import { useUpdateEntity } from '@/lib/graphql-hooks/entity'
import { BrowseIntegrationsGrid } from './browse-integrations-grid'
import { InstalledIntegrationsGrid } from './installed-integrations-grid'
import { INTEGRATIONS_TABS, type IntegrationHealthFilter, type IntegrationsTab, type IntegrationStatusFilter } from '@/lib/integrations/types'
import { integrationDefinitionID, isFinalizedIntegration, installedIntegrationDisplayName, latestFinalizedIntegrationForProvider, toAvailableIntegration } from '@/lib/integrations/utils'
import { providerSupportsPrimaryDirectory } from '@/lib/integrations/flow'
import { readPendingVendorIntegrationLink, clearPendingVendorIntegrationLink } from '@/lib/integrations/pending-vendor-link'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useNotification } from '@/hooks/useNotification'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { canEdit } from '@/lib/authz/utils'
import { Loading } from '@/components/shared/loading/loading'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { useIntegrationProviders } from '@/lib/query-hooks/integrations'
import { useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

const TAB_QUERY_PARAM = 'tab'
const TAGS_QUERY_PARAM = 'tags'
const INTEGRATION_CALLBACK_PARAMS = ['provider', 'status', 'message']

const IntegrationsPage = () => {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<IntegrationStatusFilter>('All')
  const [healthFilter, setHealthFilter] = useState<IntegrationHealthFilter>('All')
  const [searchQuery, setSearchQuery] = useState('')

  const tagsParam = searchParams.get(TAGS_QUERY_PARAM)
  const selectedTags = useMemo(() => (tagsParam ? tagsParam.split(',').filter(Boolean) : []), [tagsParam])

  const tabParam = searchParams.get(TAB_QUERY_PARAM)
  const tab: IntegrationsTab = tabParam === INTEGRATIONS_TABS.installed || searchParams.get('status') === 'success' ? INTEGRATIONS_TABS.installed : INTEGRATIONS_TABS.browse

  const { data, isLoading: integrationsLoading } = useGetIntegrations({ where: {} })
  const { data: providersData, isLoading: providersLoading } = useIntegrationProviders()
  const { setCrumbs } = use(BreadcrumbContext)

  const { data: orgPermission, isLoading } = useOrganizationRoles()
  const { data: session } = useSession()
  const canManage = canEdit(orgPermission?.roles, session)

  const { successNotification, errorNotification } = useNotification()
  const router = useRouter()
  const { mutateAsync: updateEntity } = useUpdateEntity()

  const handledRef = useRef(false)
  const pendingLinkRef = useRef(readPendingVendorIntegrationLink())
  const linkAttemptedRef = useRef(false)

  const replaceParams = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const nextParams = new URLSearchParams(searchParams.toString())
      mutate(nextParams)
      const query = nextParams.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const handleTabChange = (nextTab: string) => {
    replaceParams((params) => {
      if (nextTab === INTEGRATIONS_TABS.installed) {
        params.set(TAB_QUERY_PARAM, INTEGRATIONS_TABS.installed)
      } else {
        params.delete(TAB_QUERY_PARAM)
      }
    })
  }

  const setSelectedTags = (tags: string[]) => {
    replaceParams((params) => {
      if (tags.length > 0) {
        params.set(TAGS_QUERY_PARAM, tags.join(','))
      } else {
        params.delete(TAGS_QUERY_PARAM)
      }
    })
  }

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

    replaceParams((params) => {
      if (status === 'success') {
        params.set(TAB_QUERY_PARAM, INTEGRATIONS_TABS.installed)
      }
      INTEGRATION_CALLBACK_PARAMS.forEach((param) => params.delete(param))
    })
  }, [queryClient, successNotification, errorNotification, replaceParams, searchParams])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Automation', href: '/automation' },
      { label: 'Integrations', href: '/automation/integrations' },
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
          supportsPrimaryDirectory: providerSupportsPrimaryDirectory(provider),
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

  if (isLoading || integrationsLoading || providersLoading) {
    return <Loading />
  }
  return (
    <div>
      <PageHeading heading="Integrations" />
      <Tabs value={tab} onValueChange={handleTabChange} variant="solid">
        <IntegrationsToolbar installedCount={installedIntegrations.length} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <TabsContent value={INTEGRATIONS_TABS.browse}>
          <BrowseIntegrationsGrid
            availableIntegrations={availableIntegrations}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            searchQuery={searchQuery}
            allTags={allTags}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
            canManage={canManage}
          />
        </TabsContent>
        <TabsContent value={INTEGRATIONS_TABS.installed}>
          <InstalledIntegrationsGrid
            installedIntegrations={installedIntegrations}
            healthFilter={healthFilter}
            setHealthFilter={setHealthFilter}
            providers={providers}
            searchQuery={searchQuery}
            canManage={canManage}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default IntegrationsPage
