'use client'

import * as React from 'react'

import ThemeSection from './theme-section'
import BrandSection from './brand-section'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { Loading } from '@/components/shared/loading/loading'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import TitleAndOverview from './title-and-overview'
import WatermarkConfigurationSection from './watermark-configuration-section'

const TrustCenterSettingsPage = () => {
  const { data, isLoading, error } = useGetTrustCenter()
  const { setCrumbs } = React.useContext(BreadcrumbContext)

  React.useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Trust Center' }, { label: 'Settings', href: '/trust-center/settings' }])
  }, [setCrumbs])

  if (isLoading) {
    return <Loading />
  }

  if (error) {
    return <div className="p-6 text-red-600">Failed to load trust center settings: {error.message}</div>
  }
  const trustCenter = data?.trustCenters?.edges?.[0]?.node
  const setting = trustCenter?.setting

  if (!setting || !trustCenter) {
    return <div className="p-6">No trust center settings found.</div>
  }

  return (
    <div className="space-y-8 p-6">
      <TitleAndOverview />
      <ThemeSection setting={setting} />
      <BrandSection setting={setting} />
      <WatermarkConfigurationSection watermarkConfig={trustCenter.watermarkConfig} />
    </div>
  )
}

export default TrustCenterSettingsPage
