import React from 'react'
import { type Metadata } from 'next'
import TriagePage from '@/components/pages/protected/exposure/triage/triage-page'

export const metadata: Metadata = {
  title: 'Triage Queue',
}

const Page: React.FC = () => {
  return <TriagePage />
}

export default Page
