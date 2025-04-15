'use client'
import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import CreatePolicyForm from '@/components/pages/protected/policies/create/form/create-policy-form.tsx'

const Page: React.FC = () => {
  return (
    <>
      <PageHeading heading="Internal Policies" />
      <CreatePolicyForm />
    </>
  )
}

export default Page
