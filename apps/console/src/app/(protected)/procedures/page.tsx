'use client'

import React, { useContext, useEffect } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { ProceduresTable } from '@/components/pages/protected/procedures/table/procedures-table.tsx'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

const Page: React.FC = () => {
  const { setCrumbs } = useContext(BreadcrumbContext)

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Procedures', href: '/procedures' },
    ])
  }, [setCrumbs])

  return (
    <>
      <PageHeading heading="Procedures" />

      <ProceduresTable />
    </>
  )
}

export default Page
