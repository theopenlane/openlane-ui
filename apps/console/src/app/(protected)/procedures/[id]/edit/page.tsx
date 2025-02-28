'use client'

import { NextPage } from 'next'
import { ProcedureEditPage } from '@/components/pages/protected/procedures/procedure-edit-page'
import { useParams } from 'next/navigation'

export const Page: NextPage = () => {
  const { id } = useParams()
  return <ProcedureEditPage procedureId={id as string} />
}

export default Page
