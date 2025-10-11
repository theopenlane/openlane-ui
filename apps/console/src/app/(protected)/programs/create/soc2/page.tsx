import React from 'react'
import { Metadata } from 'next'
import Soc2Wizard from '@/components/pages/protected/programs/create/soc2/soc2-wizard'

export const metadata: Metadata = {
  title: 'Create Program',
}

const Page: React.FC = () => <Soc2Wizard />

export default Page
