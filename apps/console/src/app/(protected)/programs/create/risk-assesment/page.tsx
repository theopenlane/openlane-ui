import React from 'react'
import { Metadata } from 'next'
import RiskAssessmentWizard from '@/components/pages/protected/programs/create/risk-assesment/risk-assessment-wizard'

export const metadata: Metadata = {
  title: 'Create Program',
}

const Page: React.FC = () => <RiskAssessmentWizard />

export default Page
