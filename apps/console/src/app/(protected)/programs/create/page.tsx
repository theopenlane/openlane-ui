import React from 'react'
import { type Metadata } from 'next'
import ProgramsCreate from '@/components/pages/protected/programs/create/programs-page'

export const metadata: Metadata = {
  title: 'Programs',
}

const Page: React.FC = () => <ProgramsCreate />

export default Page
