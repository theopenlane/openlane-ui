'use client'

import React from 'react'
import { TemplateList } from '@/components/pages/protected/documents/templates'
import { useSession } from 'next-auth/react'
import PageTitle from '../../../../components/page-title'

const Page: React.FC = () => {
  const { status } = useSession()
  const isSessionLoading = status === 'loading'

  // Wait for the session and template data
  if (isSessionLoading) {
    return <div>loading...</div>
  }

  return (
    <>
      <PageTitle
        description="Template Library"
        title="Openlane provided template library"
      />
      <TemplateList />
    </>
  )
}

export default Page
