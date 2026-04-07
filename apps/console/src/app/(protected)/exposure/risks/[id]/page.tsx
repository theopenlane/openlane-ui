import React from 'react'
import { type Metadata } from 'next'
import ViewRisksPage from '@/components/pages/protected/risks/view/view-risks-page.tsx'

export const metadata: Metadata = {
  title: 'Risk Details',
}

const RiskDetailsPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  return <ViewRisksPage riskId={id} />
}

export default RiskDetailsPage
