'use client'

import React, { useContext, useEffect } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import ControlsTable from '@/components/pages/protected/controls/table/controls-table'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

const Page: React.FC = () => {
  const { setCrumbs } = useContext(BreadcrumbContext)
  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Controls', href: '/controls' },
    ])
  }, [setCrumbs])
  return (
    <>
      <PageHeading heading="Controls" />
      <ControlsTable />
    </>
  )
}

export default Page
