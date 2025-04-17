'use client'
import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import CreateProcedureForm from '@/components/pages/protected/procedures/create/form/create-procedure-form.tsx'

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Create a new procedure" />
      <CreateProcedureForm />
    </>
  )
}

export default Page
