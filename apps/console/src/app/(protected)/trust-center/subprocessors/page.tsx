import React from 'react'
import { Metadata } from 'next'
import SubprocessorsPage from '@/components/pages/protected/trust-center/subprocessors/subprocessors-page'

export const metadata: Metadata = {
  title: 'Subprocessors | Trust center',
}

const Page: React.FC = () => {
  return <SubprocessorsPage />
}

export default Page
