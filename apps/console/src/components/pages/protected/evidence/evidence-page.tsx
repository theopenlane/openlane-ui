'use client'

import { PageHeading } from '@repo/ui/page-heading'
import React from 'react'
import EvidenceCreateForm from '@/components/pages/protected/evidence/evidence-create-form'

const EvidencePage: React.FC = () => {
  return (
    <>
      <PageHeading heading="Submit Evidence" />
      <EvidenceCreateForm />
    </>
  )
}

export default EvidencePage
