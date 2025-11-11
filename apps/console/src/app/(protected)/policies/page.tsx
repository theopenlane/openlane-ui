import React from 'react'
import { Metadata } from 'next'
import { PolicySwitcher } from '@/components/shared/tab-switcher/policy-switcher.tsx'

export const metadata: Metadata = {
  title: 'Internal Policies',
}

const Page: React.FC = () => {
  return <PolicySwitcher />
}

export default Page
