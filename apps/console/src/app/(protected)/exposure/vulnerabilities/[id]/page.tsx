import React from 'react'
import { type Metadata } from 'next'
import VulnerabilityDetailPage from '@/components/pages/protected/vulnerabilities/detail/vulnerability-detail-page'

export const metadata: Metadata = {
  title: 'Vulnerability Details',
}

const VulnerabilityDetailsPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  return <VulnerabilityDetailPage vulnerabilityId={id} />
}

export default VulnerabilityDetailsPage
