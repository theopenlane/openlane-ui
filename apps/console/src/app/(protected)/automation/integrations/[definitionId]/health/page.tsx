import IntegrationHealthPage from '@/components/pages/protected/integrations/health/integration-health-page'
import { type Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: 'Integration Health',
}

const Page = async ({ params }: { params: Promise<{ definitionId: string }> }) => {
  const { definitionId } = await params
  return <IntegrationHealthPage definitionId={definitionId} />
}

export default Page
