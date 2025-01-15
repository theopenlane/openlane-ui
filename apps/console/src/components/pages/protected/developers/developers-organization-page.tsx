'use client'

import { pageStyles } from './page.styles'
import { useState } from 'react'
import { APITokenForm } from './api-token-form'
import { APITokenTable } from './api-tokens-table'

const DevelopersPage: React.FC = () => {
  const { wrapper } = pageStyles()
  const defaultTab = 'pat'

  return (
    <>
      <div className={wrapper()}>
        <APITokenForm />
        <APITokenTable />
      </div>
    </>
  )
}

export default DevelopersPage
