'use client'
import { PageHeading } from '@repo/ui/page-heading'
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import IntegrationsToolbar from './integrations-toolbar'
import { useGetIntegrations } from '@/lib/graphql-hooks/integration'
import { IntegrationsGrid } from './integrations-grid'
import { IntegrationTab } from './config'
import { useNotification } from '@/hooks/useNotification'
import { useRouter, useSearchParams } from 'next/navigation'
import { canEdit } from '@/lib/authz/utils'
import ProtectedArea from '@/components/shared/protected-area/protected-area'
import { Loading } from '@/components/shared/loading/loading'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { useIntegrationProviders } from '@/lib/query-hooks/integrations'

const IntegrationsPage = () => {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<IntegrationTab>(() => (searchParams.get('status') === 'success' ? 'Installed' : 'All'))
  const [searchQuery, setSearchQuery] = useState('')
  const { data, isLoading: integrationsLoading } = useGetIntegrations({ where: {} })
  const { data: providersData, isLoading: providersLoading } = useIntegrationProviders()
  const { setCrumbs } = useContext(BreadcrumbContext)

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

    if (status === 'success') {
      successNotification({ title: 'Integration Connected', description: message ?? `Successfully connected ${provider}` })
    } else {
      errorNotification({ title: 'Integration Failed', description: message ?? `Failed to connect ${provider}` })
    }

    router.replace('/organization-settings/integrations')
  }, [successNotification, errorNotification, router, searchParams])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Organization Settings', href: '/organization-settings' },
      { label: 'Integrations', href: '/organization-settings/integrations' },
    ])
  }, [setCrumbs])

  const installedIntegrations = useMemo(() => (data?.integrations?.edges ?? []).flatMap((edge) => (edge?.node ? [edge.node] : [])), [data?.integrations?.edges])

  const installedProviderNames = useMemo(
    () => installedIntegrations.map((integration) => (integration.kind || integration.name).toLowerCase()),
    [installedIntegrations],
  )

  const visibleProviders = useMemo(() => (providersData?.providers ?? []).filter((provider) => provider.visible !== false), [providersData?.providers])

  const availableProviders = useMemo(
    () =>
      visibleProviders.filter(
        (provider) => !installedProviderNames.includes(provider.name.toLowerCase()),
      ),
    [visibleProviders, installedProviderNames],
  )

  const { allCount, comingSoonCount } = useMemo(() => {
    const active = availableProviders.filter((provider) => provider.active).length
    const upcoming = availableProviders.filter((provider) => !provider.active).length
    return { allCount: active, comingSoonCount: upcoming }
  }, [availableProviders])

  const installedCount = installedIntegrations.length

  if (isLoading && integrationsLoading && providersLoading) {
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
          <IntegrationsGrid integrations={data?.integrations} activeTab={activeTab} providers={providersData?.providers ?? []} searchQuery={searchQuery} />
        </>
      )}
    </div>
  )
}

export default IntegrationsPage
