'use client'

import React, { useContext, useEffect } from 'react'
import RiskTable from '@/components/pages/protected/risks/table/risk-table.tsx'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

const RisksPage: React.FC = () => {
  const { setCrumbs } = useContext(BreadcrumbContext)

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Risks', href: '/risks' },
    ])
  }, [setCrumbs])

  return <RiskTable />
}

export default RisksPage
