'use client'
import { PageHeading } from '@repo/ui/page-heading'
import React, { useContext, useEffect, useState } from 'react'
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

const IntegrationsPage = () => {
  const [activeTab, setActiveTab] = useState<IntegrationTab>('Available')
  const { data, isLoading: integrationsLoading } = useGetIntegrations({ where: {} })
  const { setCrumbs } = useContext(BreadcrumbContext)

  const { data: orgPermission, isLoading } = useOrganizationRoles()
  const editAllowed = canEdit(orgPermission?.roles)

  const { successNotification, errorNotification } = useNotification()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [handled, setHandled] = useState(false)

  useEffect(() => {
    const provider = searchParams.get('provider')
    const status = searchParams.get('status')
    const message = searchParams.get('message')
    if (handled || !provider || !status) return

    if (status === 'success') {
      successNotification({ title: 'Integration Connected', description: message ?? `Successfully connected ${provider}` })
      setActiveTab('Installed')
    } else {
      errorNotification({ title: 'Integration Failed', description: message ?? `Failed to connect ${provider}` })
    }

    router.replace('/organization-settings/integrations')
    setHandled(true)
  }, [successNotification, errorNotification, router, handled, searchParams])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Organization Settings', href: '/organization-settings' },
      { label: 'Integrations', href: '/organization-settings/integrations' },
    ])
  }, [setCrumbs])

  if (isLoading && integrationsLoading) {
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
          <IntegrationsGrid integrations={data?.integrations} activeTab={activeTab} />
        </>
      )}
    </div>
  )
}

export default IntegrationsPage
