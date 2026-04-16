'use client'

import React, { use, useEffect } from 'react'
import { SubscribersTable } from './table/subscribers-table'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

const SubscribersPage: React.FC = () => {
  const { setCrumbs } = use(BreadcrumbContext)

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Organization Settings', href: '/organization-settings/general-settings' },
      { label: 'Subscribers', href: '/subscribers' },
    ])
  }, [setCrumbs])

  return <SubscribersTable />
}

export default SubscribersPage
