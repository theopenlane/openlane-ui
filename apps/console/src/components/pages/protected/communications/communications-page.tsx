'use client'

import { useEffect } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import React from 'react'
import { EmailTemplatesTab } from './email-templates/email-templates-tab'

const CommunicationsPage: React.FC = () => {
  const { setCrumbs } = React.use(BreadcrumbContext)

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Automation', href: '/automation/email-templates' },
      { label: 'Email Templates', href: '/automation/email-templates' },
    ])
  }, [setCrumbs])

  return (
    <>
      <PageHeading heading="Email Templates" />
      <div className="mt-6">
        <EmailTemplatesTab />
      </div>
    </>
  )
}

export default CommunicationsPage
