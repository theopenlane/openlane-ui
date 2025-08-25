'use client'

import * as React from 'react'

import ThemeSection from './theme-section'
import BrandSection from './brand-section'
import ConfigureUrlSection from './configure-url-section'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { Loading } from '@/components/shared/loading/loading'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

const TrustCenterSettingsPage = () => {
  const { data, isLoading, error } = useGetTrustCenter()
  const { setCrumbs } = React.useContext(BreadcrumbContext)

  React.useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Trust Center Settings' }])
  }, [setCrumbs])

  if (isLoading) {
    return <Loading />
  }

  if (error) {
    return <div className="p-6 text-red-600">Failed to load trust center settings: {error.message}</div>
  }

  const setting = data?.trustCenters?.edges?.[0]?.node?.setting

  if (!setting) {
    return <div className="p-6">No trust center settings found.</div>
  }

  return (
    <div className="space-y-8 p-6">
      <ConfigureUrlSection setting={setting} />
      <BrandSection setting={setting} />
      <ThemeSection setting={setting} />
    </div>
  )
}

export default TrustCenterSettingsPage
