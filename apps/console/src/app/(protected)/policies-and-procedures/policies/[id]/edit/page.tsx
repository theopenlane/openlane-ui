'use client'

import { useState, useEffect } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import {
  PoliciesForm,
  PolicyFormSchema,
} from '@/components/pages/protected/policies/policies-form'
import { NextPage, NextPageContext } from 'next'
import {
  useGetInternalPolicyDetailsByIdQuery,
  useUpdateInternalPolicyMutation,
} from '@repo/codegen/src/schema'
import { useRouter } from 'next/navigation'

type PageProps = {
  params: { id: string }
}

const Page: NextPage<PageProps> = ({ params }) => {
  const router = useRouter()

  const [result] = useGetInternalPolicyDetailsByIdQuery({
    variables: { internalPolicyId: params.id },
  })
  const { data, fetching, error } = result
  const [policyModel, setPolicyModel] = useState({ name: '' })

  useEffect(() => {
    if (data?.internalPolicy.id) {
      setPolicyModel(data?.internalPolicy)
    }
  }, [data])

  const [{ fetching: isSubmitting }, updatePolicy] =
    useUpdateInternalPolicyMutation()

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
    console.log('onSubmit: updating policy', policy)
    const { data, error } = await updatePolicy({
      updateInternalPolicyId: params.id,
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
      console.error('failed to update policy:', error)
      return
    }

    if (!data?.updateInternalPolicy) {
      console.error('no internal policy returned:')
      return
    }

    // load the policy page
    router.push(
      '/policies-and-procedures/policies/' +
        data?.updateInternalPolicy.internalPolicy.id,
    )
  }

  return (
    <>
      <PageHeading eyebrow="Policies & Procedures" heading="Edit Policy" />
      {data?.internalPolicy.id && (
        <PoliciesForm onSubmit={onSubmit} policy={policyModel} />
      )}
    </>
  )
}

export default Page
