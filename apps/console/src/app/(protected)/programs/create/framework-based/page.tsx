import React from 'react'
import { Metadata } from 'next'
import FrameworkBased from '@/components/pages/protected/programs/create/framework-based/framework-based'

export const metadata: Metadata = {
  title: 'Create Program',
}

const Page: React.FC = () => <FrameworkBased />

export default Page
