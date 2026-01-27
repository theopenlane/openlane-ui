'use client'

import React from 'react'
import { Globe, Plus } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { Button } from '@repo/ui/button'
import Link from 'next/link'

export default function AnalyticsPage() {
  const { resolvedTheme } = useTheme()
  const { data: trustCenterData } = useGetTrustCenter()
  const trustCenter = trustCenterData?.trustCenters?.edges?.[0]?.node

  const accessLink = trustCenter?.pirschAccessLink
  // || process.env.NEXT_PUBLIC_ANALYTICS_ACCESS_LINK || ''
  const mode = resolvedTheme === 'dark' ? 'dark' : 'light'

  if (!accessLink) {
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

  return (
    <div className="h-full w-full overflow-hidden rounded-lg">
      <iframe src={`${accessLink}&ui=hide&mode=${mode}`} width="100%" height="100%" className="min-h-[800px] border-none" title="Pirsch Analytics" />
    </div>
  )
}
