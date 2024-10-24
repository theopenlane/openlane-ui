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
      <Tabs
        variant="solid"
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value)
        }}
      >
        <TabsList>
          <TabsTrigger value="pat">Personal Access Tokens</TabsTrigger>
          <TabsTrigger value="api">API Tokens</TabsTrigger>
        </TabsList>
        <TabsContent value="pat">
          <div className={wrapper()}>
            <PersonalAccessTokenForm />
            <PersonalAccessTokenTable />
          </div>
        </TabsContent>
        <TabsContent value="api">
          <>In progress</>
        </TabsContent>
      </Tabs>
    </>
  )
}

export default DevelopersPage
