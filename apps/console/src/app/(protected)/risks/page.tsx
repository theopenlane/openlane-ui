import React from 'react'
import RiskTable from '@/components/pages/protected/risks/table/risk-table.tsx'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Risks',
}

const RisksPage: React.FC = () => {
  return <RiskTable />
}

export default RisksPage
