import React from 'react'
import CreateProcedurePage from '@/components/pages/protected/procedures/create/create-procedure-page'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Procedures',
}
const Page: React.FC = () => {
  return <CreateProcedurePage></CreateProcedurePage>
}

export default Page
