import React from 'react'
import ProgramsPage from '@/components/pages/protected/program/programs-page'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Programs',
}

const Page: React.FC = () => {
  return <ProgramsPage></ProgramsPage>
}

export default Page
