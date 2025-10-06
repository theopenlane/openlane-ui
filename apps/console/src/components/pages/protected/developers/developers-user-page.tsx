'use client'

import React, { useContext, useEffect } from 'react'
import { PanelHeader } from '@repo/ui/panel'
import { usePathname } from 'next/navigation'
import { PersonalAccessTokenTable } from './table/personal-access-tokens-table'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

const DevelopersPage: React.FC = () => {
  const { setCrumbs } = useContext(BreadcrumbContext)
  const path = usePathname()
  const heading = path.includes('/organization-settings') ? 'API Tokens' : 'Personal Access Tokens'

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Organization Settings', href: '/organization-settings' },
      { label: 'Developers', href: '/developers' },
    ])
  }, [setCrumbs])

  return (
    <div>
      <div className="flex justify-between items-center ">
        <PanelHeader heading={heading} noBorder />
      </div>
      <PersonalAccessTokenTable />
    </div>
  )
}

export default DevelopersPage
