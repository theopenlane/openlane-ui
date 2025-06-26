import React from 'react'
import EvidencePage from '@/components/pages/protected/evidence/evidence-page'
import { PageHeading } from '@repo/ui/page-heading'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Evidence',
}

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Submit Evidence" />
      <EvidencePage />
    </>
  )
}

export default Page
