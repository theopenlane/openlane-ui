import React from 'react'
import { Metadata } from 'next'
import LogsPage from '@/components/pages/protected/organization/logs/logs-page.tsx'

export const metadata: Metadata = {
  title: 'Audit Logs',
}
const Page: React.FC = () => <LogsPage />

export default Page
