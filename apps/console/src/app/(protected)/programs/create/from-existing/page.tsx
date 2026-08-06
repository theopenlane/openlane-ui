import React from 'react'
import { type Metadata } from 'next'
import FromExistingProgramWizard from '@/components/pages/protected/programs/create/from-existing/from-existing-wizard'

export const metadata: Metadata = {
  title: 'Create Program',
}

const Page: React.FC = () => <FromExistingProgramWizard />

export default Page
