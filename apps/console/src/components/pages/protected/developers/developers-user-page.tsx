'use client'

import React from 'react'
import { PanelHeader } from '@repo/ui/panel'
import PersonalApiKeyDialog from './personal-access-token-create-dialog'
import { usePathname } from 'next/navigation'
import { PersonalAccessTokenTable } from './table/personal-access-tokens-table'

const DevelopersPage: React.FC = () => {
  const path = usePathname()
  const heading = path.includes('/organization-settings') ? 'API Tokens' : 'Personal Access Tokens'
  return (
    <div>
      <div className="flex justify-between items-center ">
        <PanelHeader heading={heading} noBorder />
        <PersonalApiKeyDialog />
      </div>
      <PersonalAccessTokenTable />
    </div>
  )
}

export default DevelopersPage
