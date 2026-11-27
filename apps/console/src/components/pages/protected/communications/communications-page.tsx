'use client'

import { useEffect } from 'react'
import { PageHeading } from '@theopenlane/ui/page-heading'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import React from 'react'
import { EmailTemplatesTab } from './email-templates/email-templates-tab'
import { EMAIL_TEMPLATES_HREF } from '@/constants/email-template-routes'

const CommunicationsPage: React.FC = () => {
  const { setCrumbs } = React.use(BreadcrumbContext)

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Automation', href: '/automation' },
      { label: 'Email Templates', href: EMAIL_TEMPLATES_HREF },
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
