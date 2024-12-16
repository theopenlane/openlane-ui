'use client'

import React, { useEffect } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import { PoliciesForm, PolicyFormSchema } from '@/components/pages/protected/policies/policies-form'
import { useCreateInternalPolicyMutation } from '@repo/codegen/src/schema'
import { useRouter } from 'next/navigation'
import { useToast } from '@repo/ui/use-toast'
import { useGqlError } from '@/hooks/useGqlError'
import { NextPage } from 'next'

const Page: NextPage = () => {
  const router = useRouter()
  const { toast } = useToast()

  const [{ error }, createPolicy] = useCreateInternalPolicyMutation()
  const { errorMessages } = useGqlError(error)

  useEffect(() => {
    if (!errorMessages?.length) return
    toast({
      title: `Error`,
      description: 'We couldnt save the policy: ' + errorMessages.join('\n'),
      variant: 'destructive',
    })
  }, [errorMessages])

  const onSubmit = async (policy: PolicyFormSchema) => {
    const { data } = await createPolicy({
      input: {
        name: policy.name,
        description: policy.description,
        background: policy.background,
        policyType: policy.policyType,
        purposeAndScope: policy.purposeAndScope,
        details: policy.details,
      },
    })

    if (data?.createInternalPolicy?.internalPolicy?.id) {
      router.push('/policies-and-procedures/policies/' + data?.createInternalPolicy.internalPolicy?.id || '')
    }
  }

  return (
    <>
      <PageHeading eyebrow="Policies & Procedures" heading="Create Policy" />
      <PoliciesForm onSubmit={onSubmit} />
    </>
  )
}

export default Page
