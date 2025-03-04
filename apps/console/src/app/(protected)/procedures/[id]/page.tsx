'use client'

import { NextPage } from 'next'
import { ProcedurePage } from '@/components/pages/protected/procedures/procedure-page'
import { useParams } from 'next/navigation'

export const Page: NextPage = () => {
  const { id } = useParams()
  return <ProcedurePage procedureId={id as string} />
}

export default Page
