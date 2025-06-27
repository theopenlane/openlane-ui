import React from 'react'
import MultiStepForm from '@/components/pages/protected/onboarding/onboarding-page'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Onboarding',
}
const Page: React.FC = () => {
  return <MultiStepForm></MultiStepForm>
}

export default Page
