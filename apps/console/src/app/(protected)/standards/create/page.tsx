import React from 'react'
import { type Metadata } from 'next'
import CreateCustomFrameworkWizard from '@/components/pages/protected/standards/custom-framework/create-custom-framework-wizard'

export const metadata: Metadata = {
  title: 'Create Framework',
}

const Page: React.FC = () => <CreateCustomFrameworkWizard />

export default Page
