'use client'

import React, { useContext, useEffect } from 'react'
import { Globe, Plus } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { Button } from '@repo/ui/button'
import Link from 'next/link'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { SUPPORT_EMAIL } from '@/constants'

export default function AnalyticsPage() {
  const { resolvedTheme } = useTheme()

  //todo: connect this once we have a trust center pirsch access link and remove env variable
  const { data: trustCenterData } = useGetTrustCenter()
  const trustCenter = trustCenterData?.trustCenters?.edges?.[0]?.node
  const accessLink = trustCenter?.pirschAccessLink
  const customDomain = trustCenter?.customDomain?.cnameRecord

  const mode = resolvedTheme === 'dark' ? 'dark' : 'light'

  const { setCrumbs } = useContext(BreadcrumbContext)

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Trust Center' }, { label: 'Analytics', href: '/trust-center/analytics' }])
  }, [setCrumbs])
  if (!accessLink && !customDomain) {
    return (
      <div className="relative w-full h-[600px]">
        <div className="absolute inset-0 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center p-8 ">
          <Globe size={24} className="mb-4 text-muted-foreground" />
          <h3 className="text-sm font-medium mb-1">Unlock analytics</h3>
          <p className="text-sm text-muted-foreground mb-6">Analytics require a custom domain. Configure one to start tracking usage.</p>
          <Link href={'/trust-center/domain'}>
            <Button icon={<Plus size={16} />} iconPosition="left">
              Add Custom Domain
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!accessLink && customDomain) {
    return (
      <div className="relative w-full h-[600px]">
        <div className="absolute inset-0 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center p-8 ">
          <Globe size={24} className="mb-4 text-muted-foreground" />
          <h3 className="text-sm font-medium mb-1">Unlock analytics</h3>
          <p className="text-sm text-muted-foreground mb-6">Analytics is not currently available for you domain. If this continues, please reach out to support.</p>
          <Link href={SUPPORT_EMAIL}>
            <Button icon={<Plus size={16} />} iconPosition="left">
              Reach out to support
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full overflow-hidden rounded-lg">
      <iframe src={`${accessLink}&ui=hide&mode=${mode}`} width="100%" height="100%" className="min-h-[800px] border-none" title="Pirsch Analytics" />
    </div>
  )
}
