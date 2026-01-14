import React from 'react'
import { Metadata } from 'next'
import FrameworksPage from '@/components/pages/protected/trust-center/frameworks/frameworks-page'

export const metadata: Metadata = {
  title: 'Frameworks | Trust center',
}

const Page: React.FC = () => {
  return <FrameworksPage />
}

export default Page
