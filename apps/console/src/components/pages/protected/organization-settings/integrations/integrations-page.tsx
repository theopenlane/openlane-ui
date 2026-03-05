'use client'
import { PageHeading } from '@repo/ui/page-heading'
import React, { use, useEffect, useMemo, useRef, useState } from 'react'
import IntegrationsToolbar from './integrations-toolbar'
import { useGetIntegrations } from '@/lib/graphql-hooks/integration'
import { IntegrationsGrid } from './integrations-grid'
import { type IntegrationTab, toAvailableIntegration } from './config'
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
  const { data, isLoading: integrationsLoading } = useGetIntegrations({ where: {} })
  const { data: providersData, isLoading: providersLoading } = useIntegrationProviders()
  const { setCrumbs } = use(BreadcrumbContext)

  const { data: orgPermission, isLoading } = useOrganizationRoles()
  const editAllowed = canEdit(orgPermission?.roles)

  const { successNotification, errorNotification } = useNotification()
  const router = useRouter()

  const handledRef = useRef(false)

  useEffect(() => {
    const provider = searchParams.get('provider')
    const status = searchParams.get('status')
    const message = searchParams.get('message')
    if (handledRef.current || !provider || !status) return

    handledRef.current = true

    queryClient.invalidateQueries({ queryKey: ['integrations'] })

    if (status === 'success') {
      successNotification({ title: 'Integration Connected', description: message ?? `Successfully connected ${provider}` })
    } else {
      errorNotification({ title: 'Integration Failed', description: message ?? `Failed to connect ${provider}` })
    }

    router.replace('/organization-settings/integrations')
  }, [queryClient, successNotification, errorNotification, router, searchParams])

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        queryClient.invalidateQueries({ queryKey: ['integrations'] })
      }
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [queryClient])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Organization Settings', href: '/organization-settings' },
      { label: 'Integrations', href: '/organization-settings/integrations' },
    ])
  }, [setCrumbs])

  const providers = useMemo(() => providersData?.providers ?? [], [providersData?.providers])

  const installedIntegrations = useMemo(
    () => (data?.integrations?.edges ?? []).flatMap((edge) => (edge?.node ? [edge.node] : [])).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    [data?.integrations?.edges],
  )

  const installedProviderNames = useMemo(
    () => new Set(installedIntegrations.map((integration) => (integration.kind || integration.name).toLowerCase()).filter((name) => name.length > 0)),
    [installedIntegrations],
  )

  const availableIntegrations = useMemo(
    () =>
      providers
        .filter((p) => p.visible !== false)
        .map(toAvailableIntegration)
        .filter((ai) => !installedProviderNames.has(ai.provider.name.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    [providers, installedProviderNames],
  )

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
          />
          <IntegrationsGrid installedIntegrations={installedIntegrations} availableIntegrations={availableIntegrations} activeTab={activeTab} providers={providers} searchQuery={searchQuery} />
        </>
      )}
    </div>
  )
}

export default IntegrationsPage
