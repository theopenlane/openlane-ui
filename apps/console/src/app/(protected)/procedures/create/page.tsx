import React from 'react'
import CreateProcedurePage from '@/components/pages/protected/procedures/create/create-procedure-page'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Procedure',
}
const Page: React.FC = () => <CreateProcedurePage />

export default Page
