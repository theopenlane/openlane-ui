'use client'

import { pageStyles } from './page.styles'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { useState } from 'react'
import { PersonalAccessTokenForm } from './personal-access-token-form'
import { PersonalAccessTokenTable } from './personal-access-tokens-table'

const DevelopersPage: React.FC = () => {
  const { wrapper } = pageStyles()
  const defaultTab = 'pat'
  const [activeTab, setActiveTab] = useState(defaultTab)

  return (
    <>
          <div className={wrapper()}>
            <PersonalAccessTokenForm />
            <PersonalAccessTokenTable />
          </div>
    </>
  )
}

export default DevelopersPage
