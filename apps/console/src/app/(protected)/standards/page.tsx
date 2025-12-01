import React from 'react'
import { Metadata } from 'next'
import StandardsSwitcher from '@/components/pages/protected/standards/standards-switcher'

export const metadata: Metadata = {
  title: 'Standards Catalog',
}

const Page: React.FC = () => <StandardsSwitcher />

export default Page
