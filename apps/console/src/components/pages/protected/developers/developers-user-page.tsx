'use client'

import React, { use, useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { PersonalAccessTokenTable } from './table/personal-access-tokens-table'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { PageHeading } from '@repo/ui/page-heading'
import { Callout } from '@/components/shared/callout/callout'

const PAGE_CONFIG = [
  {
    match: '/api-tokens',
    heading: 'API Tokens',
    description:
      'API Tokens are organization-scoped credentials designed for system integrations, automation, and service-to-service communication. Access is controlled through configurable scopes that define read, write, and delete permissions for each object type across the organization. It is recommended to follow the principle of least privilege and only grant the minimum scopes required for the job or workflow.',
    crumbHref: '/developers/api-tokens',
  },
  {
    match: '/personal-access-tokens',
    heading: 'Personal Access Tokens',
    description:
      "Personal Access Tokens are user-scoped credentials that act on behalf of the user who created them. These tokens inherit the user's existing roles and permissions within the organization and can only access resources the user is authorized to view or manage. Permission is revoked immediately if the user leaves the organization.",
    crumbHref: '/developers/personal-access-tokens',
  },
]

const DevelopersPage: React.FC = () => {
  const { setCrumbs } = use(BreadcrumbContext)
  const path = usePathname()

  const { heading, description, crumbHref } = useMemo(() => {
    const config = PAGE_CONFIG.find((c) => path.includes(c.match))
    return config ?? PAGE_CONFIG[1]
  }, [path])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Developers', href: crumbHref },
      { label: heading, href: crumbHref },
    ])
  }, [setCrumbs, heading, crumbHref])

  return (
    <div>
      <PageHeading heading={heading} />
      <Callout compact={true}>{description}</Callout>
      <PersonalAccessTokenTable />
    </div>
  )
}

export default DevelopersPage
