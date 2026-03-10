import React from 'react'
import { type Metadata } from 'next'
import { PolicySwitcher } from '@/components/shared/tab-switcher/policy-switcher.tsx'

export const metadata: Metadata = {
  title: 'Internal Policies',
}

const Page: React.FC = () => {
  return <PolicySwitcher />
}

export default Page
