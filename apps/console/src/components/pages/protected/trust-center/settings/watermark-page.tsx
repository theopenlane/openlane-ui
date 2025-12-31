'use client'

import Loading from '@/app/(protected)/trust-center/documents/loading'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useContext, useEffect } from 'react'
import WatermarkConfigurationSection from './watermark-configuration-section'
import { PageHeading } from '@repo/ui/page-heading'

const WatermarkPage = () => {
  const { data, isLoading, error } = useGetTrustCenter()
  const { setCrumbs } = useContext(BreadcrumbContext)

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Trust Center' }, { label: 'Watermark', href: '/trust-center/domain' }])
  }, [setCrumbs])

  const trustCenter = data?.trustCenters?.edges?.[0]?.node
  const watermarkConfig = trustCenter?.watermarkConfig

  if (!trustCenter) {
    return <div className="p-6">No trust center settings found.</div>
  }

  if (isLoading) {
    return <Loading />
  }

  if (error) {
    return <div className="p-6 text-red-600">Failed to load trust center settings: {error.message}</div>
  }

  return (
    <>
      <PageHeading heading="Watermark" />
      <WatermarkConfigurationSection watermarkConfig={watermarkConfig} />
    </>
  )
}

export default WatermarkPage
