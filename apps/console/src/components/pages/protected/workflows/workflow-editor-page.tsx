'use client'

import React, { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { PageHeading } from '@repo/ui/page-heading'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'

const WorkflowEditor = dynamic(() => import('@/components/pages/protected/workflows/workflow-editor'), {
  ssr: false,
})

export default function WorkflowEditorPage() {
  const { setCrumbs } = React.use(BreadcrumbContext)

  useEffect(() => {
    setCrumbs([{ label: 'Home', href: '/dashboard' }, { label: 'Automation', href: '/automation/workflows' }, { label: 'Workflows', href: '/automation/workflows' }, { label: 'Editor' }])
  }, [setCrumbs])

  return (
    <>
      <PageHeading eyebrow="Workflows" heading="Editor" />
      <WorkflowEditor />
    </>
  )
}
