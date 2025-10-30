import React from 'react'
import { Metadata } from 'next'
import PoliciesPage from '@/components/pages/protected/policies/policies-page'

export const metadata: Metadata = {
  title: 'Internal Policies',
}

const Page: React.FC = () => {
  return <PoliciesPage />
}

export default Page
