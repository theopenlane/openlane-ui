'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import ViewRisksPage from '@/components/pages/protected/risks/view/view-risks-page.tsx'

const RiskDetailsPage: React.FC = () => {
  const { id } = useParams()

  return <ViewRisksPage riskId={id! as string} />
}

export default RiskDetailsPage
