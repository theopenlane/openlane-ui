'use client'

import React from 'react'
import { pageStyles } from './page.styles'
import { Panel, PanelHeader } from '@repo/ui/panel'
import PersonalApiKeyDialog from './personal-access-token-create-dialog'
import { PersonalAccessTokenTable } from './personal-access-tokens-table'
import { usePathname } from 'next/navigation'

const DevelopersPage: React.FC = () => {
  const { wrapper } = pageStyles()
  const path = usePathname()
  const heading = path.includes('/organization-settings') ? 'API Tokens' : 'Personal Access Tokens'
  return (
    <div className={wrapper()}>
      <div className="flex justify-between items-center ">
        <PanelHeader heading={heading} noBorder />
        <PersonalApiKeyDialog />
      </div>
      <PersonalAccessTokenTable />
    </div>
  )
}

export default DevelopersPage
