import IntegrationRunPage from '@/components/pages/protected/integrations/health/run-detail/integration-run-page'
import { type Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: 'Integration Run',
}

const Page = async ({ params }: { params: Promise<{ definitionId: string; runId: string }> }) => {
  const { definitionId, runId } = await params
  return <IntegrationRunPage definitionId={definitionId} runId={runId} />
}

export default Page
