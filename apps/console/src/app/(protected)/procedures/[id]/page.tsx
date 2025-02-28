'use client'

import { NextPage } from 'next'
import { ProceduresPage } from '@/components/pages/protected/procedures/procedures-page'
import { useParams } from 'next/navigation'

export const Page: NextPage = () => {
  const { id } = useParams()
  return <ProceduresPagePage procedureId={id as string} />
}

export default Page
