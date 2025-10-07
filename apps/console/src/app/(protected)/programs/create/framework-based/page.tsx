import React from 'react'
import { Metadata } from 'next'
import FrameworkBasedWizard from '@/components/pages/protected/programs/create/framework-based/framework-based-wizard'

export const metadata: Metadata = {
  title: 'Create Program',
}

const Page: React.FC = () => <FrameworkBasedWizard />

export default Page
