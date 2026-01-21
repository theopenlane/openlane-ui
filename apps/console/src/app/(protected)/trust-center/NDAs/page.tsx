import React from 'react'
import { Metadata } from 'next'
import ANDAsPage from '@/components/pages/protected/trust-center/NDAs/NDAs-page'

export const metadata: Metadata = {
  title: 'ANDAs | Trust center',
}

const Page: React.FC = () => {
  return <ANDAsPage />
}

export default Page
