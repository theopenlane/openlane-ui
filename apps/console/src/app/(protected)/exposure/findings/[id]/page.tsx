import React from 'react'
import { type Metadata } from 'next'
import FindingDetailPage from '@/components/pages/protected/findings/detail/finding-detail-page'

export const metadata: Metadata = {
  title: 'Finding Details',
}

const FindingDetailsPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  return <FindingDetailPage findingId={id} />
}

export default FindingDetailsPage
