'use client'

import { useCallback, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { PageHeading } from '@repo/ui/page-heading'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Mail, Bell } from 'lucide-react'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import React from 'react'
import { EmailTemplatesTab } from './email-templates/email-templates-tab'
import { NotificationTemplatesTab } from './notification-templates/notification-templates-tab'

type CommunicationsTabValue = 'email-templates' | 'notification-templates'
const DEFAULT_TAB: CommunicationsTabValue = 'email-templates'
const TAB_QUERY_PARAM = 'tab'
const VALID_TABS: CommunicationsTabValue[] = ['email-templates', 'notification-templates']

const CommunicationsPage: React.FC = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { setCrumbs } = React.use(BreadcrumbContext)

  const tabParamValue = searchParams.get(TAB_QUERY_PARAM)
  const activeTab: CommunicationsTabValue = tabParamValue && VALID_TABS.includes(tabParamValue as CommunicationsTabValue) ? (tabParamValue as CommunicationsTabValue) : DEFAULT_TAB

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Automation', href: '/automation/communications' },
      { label: 'Communications', href: '/automation/communications' },
    ])
  }, [setCrumbs])

  const updateTabParam = useCallback(
    (tab: CommunicationsTabValue) => {
      const nextParams = new URLSearchParams(searchParams.toString())

      if (tab === DEFAULT_TAB) {
        nextParams.delete(TAB_QUERY_PARAM)
      } else {
        nextParams.set(TAB_QUERY_PARAM, tab)
      }

      const query = nextParams.toString()
      router.replace(query ? `${pathname}?${query}` : pathname)
    },
    [pathname, router, searchParams],
  )

  const handleTabChange = (value: string) => {
    if (VALID_TABS.includes(value as CommunicationsTabValue)) {
      updateTabParam(value as CommunicationsTabValue)
    }
  }

  return (
    <>
      <PageHeading heading="Communications" />
      <Tabs value={activeTab} onValueChange={handleTabChange} variant="underline">
        <div className="relative pb-1 mb-1">
          <TabsList className="w-auto flex justify-start">
            <TabsTrigger value="email-templates" className="inline-flex flex-none items-center text-muted-foreground data-[state=active]:text-foreground">
              <Mail className="mr-2 h-4 w-4" />
              <span>Email Templates</span>
            </TabsTrigger>
            <TabsTrigger value="notification-templates" className="inline-flex flex-none items-center text-muted-foreground data-[state=active]:text-foreground">
              <Bell className="mr-2 h-4 w-4" />
              <span>Notification Templates</span>
            </TabsTrigger>
          </TabsList>
          <div className="pointer-events-none absolute inset-x-0 bottom-0.5 left-0.5 h-px shadow-[inset_0_-1px_0_0_var(--color-border)]" />
        </div>
        <TabsContent value="email-templates" className="mt-6">
          <EmailTemplatesTab />
        </TabsContent>
        <TabsContent value="notification-templates" className="mt-6">
          <NotificationTemplatesTab />
        </TabsContent>
      </Tabs>
    </>
  )
}

export default CommunicationsPage
