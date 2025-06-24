'use client'

import React, { useContext, useEffect } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { PoliciesTable } from '@/components/pages/protected/policies/table/policies-table.tsx'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

const Page: React.FC = () => {
  const { setCrumbs } = useContext(BreadcrumbContext)

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Policies', href: '/policies' },
    ])
  }, [setCrumbs])

  return (
    <>
      <PageHeading heading="Internal Policies" />

      <PoliciesTable />
    </>
  )
}

export default Page
