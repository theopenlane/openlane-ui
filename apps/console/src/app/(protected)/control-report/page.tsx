import React from 'react'
import { Metadata } from 'next'
import ControlReportPage from '@/components/pages/protected/control-report/control-report-page'

export const metadata: Metadata = {
  title: 'Control Report',
}

const Page: React.FC = () => {
  return <ControlReportPage />
}

export default Page
