'use client'

import React, { useContext, useEffect } from 'react'
import EvidencePage from '@/components/pages/protected/evidence/evidence-page'
import { PageHeading } from '@repo/ui/page-heading'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

const Page: React.FC = () => {
  const { setCrumbs } = useContext(BreadcrumbContext)

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Evidence', href: '/evidence' },
    ])
  }, [setCrumbs])

  return (
    <>
      <PageHeading heading="Submit Evidence" />
      <EvidencePage />
    </>
  )
}

export default Page
