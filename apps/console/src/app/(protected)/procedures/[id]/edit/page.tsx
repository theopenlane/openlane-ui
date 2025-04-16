'use client'

import { NextPage } from 'next'
import { useParams } from 'next/navigation'
import { PageHeading } from '@repo/ui/page-heading'
import React from 'react'
import EditProcedurePage from '@/components/pages/protected/procedures/edit-procedure-page.tsx'

const Page: NextPage = () => {
  const { id } = useParams()

  return (
    <>
      <PageHeading heading="Edit procedure" />
      <EditProcedurePage procedureId={id as string} />
    </>
  )
}

export default Page
