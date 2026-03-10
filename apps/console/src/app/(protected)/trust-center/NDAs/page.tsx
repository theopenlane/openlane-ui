import React from 'react'
import { type Metadata } from 'next'
import NDAsPage from '@/components/pages/protected/trust-center/NDAs/NDAs-page'

export const metadata: Metadata = {
  title: 'NDAs | Trust Center',
}

const Page: React.FC = () => {
  return <NDAsPage />
}

export default Page
