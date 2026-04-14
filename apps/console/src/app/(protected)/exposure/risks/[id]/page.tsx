import React from 'react'
import { type Metadata } from 'next'
import RiskDetailPage from '@/components/pages/protected/risks/view/detail/risk-detail-page'

export const metadata: Metadata = {
  title: 'Risk Details',
}

const RiskDetailsPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  return <RiskDetailPage riskId={id} />
}

export default RiskDetailsPage
