import IntegrationDefinitionPage from '@/components/pages/protected/organization-settings/integrations/integration-definition-page'
import { type Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: 'Integration',
}

const Page = async ({ params }: { params: Promise<{ definitionId: string }> }) => {
  const { definitionId } = await params
  return <IntegrationDefinitionPage definitionId={definitionId} />
}

export default Page
