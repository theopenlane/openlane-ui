import React from 'react'
import CreateRiskPage from '@/components/pages/protected/risks/create/create-risk-page'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Risk',
}
const Page: React.FC = () => <CreateRiskPage />

export default Page
