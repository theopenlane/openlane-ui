import React from 'react'
import CreatePolicyPage from '@/components/pages/protected/policies/create/create-policy-page'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Internal Policy',
}
const Page: React.FC = () => <CreatePolicyPage />

export default Page
