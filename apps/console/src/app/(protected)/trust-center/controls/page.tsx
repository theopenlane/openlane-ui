import React from 'react'
import { type Metadata } from 'next'
import ControlsPage from '@/components/pages/protected/trust-center/controls/controls-page'

export const metadata: Metadata = {
  title: 'Controls | Trust Center',
}

const Page: React.FC = () => {
  return <ControlsPage />
}

export default Page
