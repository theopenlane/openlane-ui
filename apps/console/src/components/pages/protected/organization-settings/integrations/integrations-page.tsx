'use client'
import { PageHeading } from '@repo/ui/page-heading'
import React, { useContext, useEffect, useRef, useState } from 'react'
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
  const [activeTab, setActiveTab] = useState<IntegrationTab>(() => (searchParams.get('status') === 'success' ? 'Installed' : 'Available'))
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
          <IntegrationsToolbar activeTab={activeTab} setActiveTab={setActiveTab} installedCount={data?.integrations.edges?.length} />
          <IntegrationsGrid integrations={data?.integrations} activeTab={activeTab} providers={providersData?.providers ?? []} />
        </>
      )}
    </div>
  )
}

export default IntegrationsPage
