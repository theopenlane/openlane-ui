import React from 'react'
import { Metadata } from 'next'
import AdvancedSetupWizard from '@/components/pages/protected/programs/create/advanced-setup/advanced-setup-wizard'

export const metadata: Metadata = {
  title: 'Advanced Setup',
}

const Page: React.FC = () => <AdvancedSetupWizard />

export default Page
