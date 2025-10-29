'use client'

import React, { useContext, useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { PersonalAccessTokenTable } from './table/personal-access-tokens-table'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { PageHeading } from '@repo/ui/page-heading'

const PAGE_CONFIG = [
  {
    match: '/api-tokens',
    heading: 'API Tokens',
    crumbHref: '/developers/api-tokens',
  },
  {
    match: '/personal-access-tokens',
    heading: 'Personal Access Tokens',
    crumbHref: '/developers/personal-access-tokens',
  },
]

const DevelopersPage: React.FC = () => {
  const { setCrumbs } = useContext(BreadcrumbContext)
  const path = usePathname()

  const { heading, crumbHref } = useMemo(() => {
    const config = PAGE_CONFIG.find((c) => path.includes(c.match))
    return config ?? PAGE_CONFIG[1]
  }, [path])

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Developers' }, { label: heading, href: crumbHref }])
  }, [setCrumbs, heading, crumbHref])

  return (
    <div>
      <PageHeading heading={heading} />
      <PersonalAccessTokenTable />
    </div>
  )
}

export default DevelopersPage
