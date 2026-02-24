import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import PersonnelPage from '@/components/pages/protected/personnel/table/page'

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Personnel" />
      <PersonnelPage />
    </>
  )
}

export default Page
