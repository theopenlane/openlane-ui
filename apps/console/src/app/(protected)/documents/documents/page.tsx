'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { DocumentList } from '@/components/pages/protected/documents/documents'
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
      <PageTitle description="View your documents" title="Document Library" />
      <DocumentList />
    </>
  )
}

export default Page
