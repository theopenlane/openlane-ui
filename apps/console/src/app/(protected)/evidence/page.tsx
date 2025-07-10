import React from 'react'
import { Metadata } from 'next'
import EvidenceDetailsPage from '@/components/pages/protected/evidence/evidence-details-page.tsx'

export const metadata: Metadata = {
  title: 'Evidence',
}

const Page: React.FC = () => <EvidenceDetailsPage />

export default Page
