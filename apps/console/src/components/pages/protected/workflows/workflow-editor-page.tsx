'use client'

import dynamic from 'next/dynamic'
import { PageHeading } from '@repo/ui/page-heading'

const WorkflowEditor = dynamic(() => import('@/components/pages/protected/workflows/workflow-editor'), {
  ssr: false,
})

export default function WorkflowEditorPage() {
  return (
    <>
      <PageHeading eyebrow="Workflows" heading="Editor" />
      <WorkflowEditor />
    </>
  )
}
