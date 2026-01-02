'use client'

import React, { useEffect, useContext } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import CustomTagsTab from './custom-tags/custom-tags-tab'
import CustomEnumsTab from './custom-enums/custom-enums-tab'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

const CustomDataPage = () => {
  const { setCrumbs } = useContext(BreadcrumbContext)
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeTab = searchParams.get('tab') || 'tags'

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Organization Settings' }, { label: 'Custom Tags', href: '/organization-settings/custom-data' }])
  }, [setCrumbs])

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">Manage organization-specific tags, labels, and enums that define your compliance structure.</div>

      <Tabs value={activeTab} onValueChange={handleTabChange} variant="underline">
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="tags">Custom Tags</TabsTrigger>
            <TabsTrigger value="enums">Custom Enums</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="tags" className="space-y-3">
          <CustomTagsTab />
        </TabsContent>

        <TabsContent value="enums" className="space-y-3">
          <CustomEnumsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CustomDataPage
