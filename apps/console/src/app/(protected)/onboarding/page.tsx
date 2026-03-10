import React from 'react'
import MultiStepForm from '@/components/pages/protected/onboarding/onboarding-page'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Onboarding',
}
const Page: React.FC = () => {
  return <MultiStepForm />
}

export default Page
