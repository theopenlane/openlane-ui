import React from 'react'
import { Metadata } from 'next'
import NDAsPage from '@/components/pages/protected/trust-center/NDAs/NDAs-page'

export const metadata: Metadata = {
  title: 'NDAs | Trust center',
}

const Page: React.FC = () => {
  return <NDAsPage />
}

export default Page
