'use client'

import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import {
  PoliciesForm,
  PolicyFormSchema,
} from '@/components/pages/protected/policies/policies-form'
import { NextPage } from 'next'
import { useCreateInternalPolicyMutation } from '@repo/codegen/src/schema'
import { useRouter } from 'next/navigation'

type PageProps = {}

const Page: NextPage<PageProps> = () => {
  const router = useRouter()

  const [{ fetching: isSubmitting }, createPolicy] =
    useCreateInternalPolicyMutation()

  // const onSubmit = (data: z.infer<typeof PolicyFormSchema>) => {
  //   updatePolicy({
  //     name: data.name,
  //     description: data.description,
  //     purposeAndScope: data.purposeAndScope,
  //     policyType: data.policyType,
  //     background: data.background,
  //   })
  // }

  const onSubmit = async (policy: PolicyFormSchema) => {
    console.log('onSubmit: creating policy', policy)
    const { data, error } = await createPolicy({
      input: {
        name: policy.name,
        description: policy.description,
        background: policy.background,
        policyType: policy.policyType,
        purposeAndScope: policy.purposeAndScope,
        details: policy.details,
      },
    })
    if (error) {
      console.error('failed to save policy:', error)
      return
    }

    if (!data?.createInternalPolicy) {
      console.error('no internal policy returned:')
      return
    }

    // load the policy page
    router.push(
      '/policies-and-procedures/policies/' +
        data?.createInternalPolicy.internalPolicy.id,
    )
  }

  return (
    <>
      <PageHeading eyebrow="Policies & Procedures" heading="Create Policy" />
      <PoliciesForm onSubmit={onSubmit} />
    </>
  )
}

export default Page
