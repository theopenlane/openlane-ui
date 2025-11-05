import React from 'react'
import { Metadata } from 'next'
import ProgramDetailsPage from '@/components/pages/protected/programs/program-details-page'

export const metadata: Metadata = {
  title: 'Programs',
}

const Page: React.FC = () => <ProgramDetailsPage />

export default Page
