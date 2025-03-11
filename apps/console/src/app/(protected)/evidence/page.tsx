import React from 'react'
import EvidencePage from '@/components/pages/protected/evidence/evidence-page'
import { PageHeading } from '@repo/ui/page-heading'

const Page: React.FC = () => (
  <>
    <PageHeading heading="Submit Evidence" />
    <EvidencePage />
  </>
)

export default Page
