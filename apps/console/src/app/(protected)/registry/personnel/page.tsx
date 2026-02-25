import React from 'react'
import { Metadata } from 'next'
import { PageHeading } from '@repo/ui/page-heading'
import PersonnelPage from '@/components/pages/protected/personnel/table/page'

export const metadata: Metadata = {
  title: 'Personnel',
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Personnel" />
      <PersonnelPage />
    </>
  )
}

export default Page
