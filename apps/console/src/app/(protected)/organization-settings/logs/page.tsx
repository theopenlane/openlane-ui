'use client'

import React, { useContext, useEffect } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

const Page: React.FC = () => {
  const { setCrumbs } = useContext(BreadcrumbContext)
  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Organization Settings', href: '/organization-settings' },
      { label: 'Audit Logs', href: '/logs' },
    ])
  }, [setCrumbs])

  useEffect(() => {
    document.title = `Acme Corp: | Audit Logs`
  }, [])
  return <PageHeading heading="Audit Logs" eyebrow="Organization Settings" />
}

export default Page
