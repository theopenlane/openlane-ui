'use client'

import { NextPage } from 'next'
import { useParams } from 'next/navigation'
import ViewProcedurePage from '@/components/pages/protected/procedures/view/view-procedure-page.tsx'

const Page: NextPage = () => {
  const { id } = useParams()
  return <ViewProcedurePage procedureId={id as string} />
}

export default Page
