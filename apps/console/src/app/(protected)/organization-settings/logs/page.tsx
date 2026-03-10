import React from 'react'
import LogsPage from '@/components/pages/protected/logs/logs-page'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Audit Logs',
}
const Page: React.FC = () => <LogsPage />

export default Page
